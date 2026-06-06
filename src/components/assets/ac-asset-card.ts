import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Asset } from '@/types/asset';
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
    }
    :host(:hover) { border-color: var(--color-primary); }

    .row { display: flex; align-items: center; justify-content: space-between; }
    .left { display: flex; align-items: center; gap: var(--space-3); }

    .ticker {
      font-weight: 700;
      font-size: var(--text-base);
    }
    .name {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .total {
      font-family: var(--font-mono);
      font-size: var(--text-base);
      font-weight: 600;
      text-align: right;
    }
    .currency-badge {
      font-size: var(--text-xs);
      font-family: var(--font-mono);
      text-align: right;
      margin-top: 2px;
      color: var(--color-text-muted);
    }
  `;

  @property({ type: Object }) asset!: Asset;

  render() {
    const { ticker, name, asset_type, unit_price, total_valuation, currency, quantity } = this.asset;

    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
    const fmtTotal = total_valuation != null
      ? `${currency ?? ''} ${fmt.format(total_valuation)}`
      : '—';
    const fmtPrice = unit_price != null
      ? `${currency ?? ''} ${fmt.format(unit_price)} × ${fmt.format(quantity)}`
      : `${fmt.format(quantity)} unidades`;

    return html`
      <div class="row">
        <div class="left">
          <ac-asset-type-badge .type="${asset_type ?? 'stock'}"></ac-asset-type-badge>
          <div>
            <div class="ticker">${ticker}</div>
            <div class="name">${name ?? ''}</div>
          </div>
        </div>
        <div>
          <div class="total">${fmtTotal}</div>
          <div class="currency-badge">${fmtPrice}</div>
        </div>
      </div>
    `;
  }
}
