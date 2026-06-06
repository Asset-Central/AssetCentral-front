import { LitElement, html, css, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Asset, PricePoint } from '@/types/asset';
import { fetchAssetHistory } from '@/services/asset.service';
import './ac-asset-type-badge';

@customElement('ac-asset-card')
export class AcAssetCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      transition: border-color var(--transition-fast);
      cursor: default;
    }
    :host(:hover) { border-color: var(--color-primary); }

    .row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
    .left { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .info { min-width: 0; }

    .ticker { font-weight: 700; font-size: var(--text-base); }
    .name {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .right { display: flex; align-items: center; gap: var(--space-4); flex-shrink: 0; }

    .sparkline { flex-shrink: 0; }

    .values { text-align: right; }
    .total {
      font-family: var(--font-mono);
      font-size: var(--text-base);
      font-weight: 600;
    }
    .sub {
      font-size: var(--text-xs);
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .change {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: var(--text-xs);
      font-family: var(--font-mono);
      font-weight: 600;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      margin-top: var(--space-1);
    }
    .change.up   { background: color-mix(in srgb, #34d399 15%, transparent); color: #34d399; }
    .change.down { background: color-mix(in srgb, #f87171 15%, transparent); color: #f87171; }
    .change.flat { color: var(--color-text-muted); background: transparent; }
  `;

  @property({ type: Object }) asset!: Asset;
  @state() private _history: PricePoint[] = [];

  connectedCallback() {
    super.connectedCallback();
    fetchAssetHistory(this.asset.ticker)
      .then(h => { this._history = h; })
      .catch(() => { /* silencioso */ });
  }

  private _sparkline(points: PricePoint[]) {
    if (points.length < 2) return svg``;
    const W = 80, H = 32;
    const prices = points.map(p => p.unit_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const xs = prices.map((_, i) => (i / (prices.length - 1)) * W);
    const ys = prices.map(p => H - ((p - min) / range) * (H - 4) - 2);
    const polyline = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const last = prices[prices.length - 1];
    const first = prices[0];
    const color = last >= first ? '#34d399' : '#f87171';
    return svg`
      <polyline
        points="${polyline}"
        fill="none"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    `;
  }

  render() {
    const { ticker, name, asset_type, unit_price, total_valuation, currency, quantity, daily_change_pct } = this.asset;

    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
    const fmtTotal = total_valuation != null
      ? `${currency ?? ''} ${fmt.format(total_valuation)}`
      : '—';
    const fmtPrice = unit_price != null
      ? `${fmt.format(unit_price)} × ${fmt.format(quantity)}`
      : `${fmt.format(quantity)} uds`;

    const changeClass = daily_change_pct == null ? 'flat'
      : daily_change_pct > 0 ? 'up' : daily_change_pct < 0 ? 'down' : 'flat';
    const changeLabel = daily_change_pct != null
      ? `${daily_change_pct > 0 ? '▲' : daily_change_pct < 0 ? '▼' : '—'} ${Math.abs(daily_change_pct).toFixed(2)}%`
      : null;

    return html`
      <div class="row">
        <div class="left">
          <ac-asset-type-badge .type="${asset_type ?? 'stock'}"></ac-asset-type-badge>
          <div class="info">
            <div class="ticker">${ticker}</div>
            <div class="name">${name ?? ''}</div>
          </div>
        </div>

        <div class="right">
          ${this._history.length >= 2 ? html`
            <div class="sparkline">
              <svg width="80" height="32" viewBox="0 0 80 32">
                ${this._sparkline(this._history)}
              </svg>
            </div>
          ` : ''}

          <div class="values">
            <div class="total">${fmtTotal}</div>
            <div class="sub">${fmtPrice}</div>
            ${changeLabel ? html`<div class="change ${changeClass}">${changeLabel}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
}
