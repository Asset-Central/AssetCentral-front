import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import {
  Chart, type ChartConfiguration,
  LineElement, PointElement, LinearScale, CategoryScale,
  LineController, Filler, Tooltip,
} from 'chart.js';
import type { Favorite } from '@/types/favorites';
import { removeFavorite, setFavoriteOpen, FAVORITES_EVENT } from '@/services/favorites.service';
import { fetchMarketHistory } from '@/services/market.service';
import './ac-asset-type-badge';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, LineController, Filler, Tooltip);

type Range = '1h' | '1d' | '1w' | '30d' | '1y';
const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };

function _fmtLabel(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    return (dateStr.split('T')[1] ?? '').substring(0, 5);
  }
  const p = (dateStr.split('T')[0] ?? dateStr).split('-');
  return p.length >= 3 ? `${p[2]}/${p[1]}` : dateStr;
}
function _fmtTooltip(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const [d = '', t = ''] = dateStr.split('T');
    const [y = '', m = '', day = ''] = d.split('-');
    return `${day}/${m}/${y} ${t.substring(0, 5)}`;
  }
  const [y = '', m = '', d = ''] = (dateStr.split('T')[0] ?? dateStr).split('-');
  return `${d}/${m}/${y}`;
}

@customElement('ac-favorite-card')
export class AcFavoriteCard extends LitElement {
  static styles = css`
    :host { display: block; }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: border-color var(--transition-fast), background var(--transition-fast);
    }
    .card:hover { border-color: var(--color-primary); }

    /* Open favorite: slightly lighter / tinted */
    .card.is-open {
      background: color-mix(in srgb, var(--color-primary) 7%, var(--color-surface));
      border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      user-select: none;
    }

    .left { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .info { min-width: 0; }
    .ticker { font-weight: 700; font-size: var(--text-base); }
    .name {
      font-size: var(--text-xs); color: var(--color-text-muted);
      margin-top: 2px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 180px;
    }

    .right { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }

    .values { text-align: right; }
    .price { font-family: var(--font-mono); font-size: var(--text-base); font-weight: 600; }
    .change {
      display: inline-flex; align-items: center; gap: 2px;
      font-size: var(--text-xs); font-family: var(--font-mono); font-weight: 600;
      padding: 2px 6px; border-radius: var(--radius-full); margin-top: 2px;
    }
    .change.up   { background: color-mix(in srgb, #34d399 15%, transparent); color: #34d399; }
    .change.down { background: color-mix(in srgb, #f87171 15%, transparent); color: #f87171; }
    .change.flat { color: var(--color-text-muted); }

    .actions { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }

    .btn-open {
      padding: 2px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent;
      font-size: var(--text-xs); font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .btn-open.open-state {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .btn-open.closed-state {
      color: var(--color-text-muted);
    }
    .btn-open:hover { border-color: var(--color-primary); color: var(--color-primary); }

    .btn-unfav {
      background: none; border: none; cursor: pointer;
      font-size: 16px; color: #f59e0b;
      padding: 2px; line-height: 1;
      transition: transform var(--transition-fast), opacity var(--transition-fast);
      flex-shrink: 0;
    }
    .btn-unfav:hover { opacity: 0.7; transform: scale(1.15); }

    .chevron {
      font-size: 10px; color: var(--color-text-muted);
      transition: transform var(--transition-fast); flex-shrink: 0;
    }
    .chevron.open { transform: rotate(180deg); }

    /* Chart section */
    .chart-section {
      border-top: 1px solid var(--color-border);
      padding: var(--space-2) var(--space-5) var(--space-4);
    }
    .chart-header {
      display: flex; align-items: center; justify-content: flex-end;
      margin-bottom: var(--space-1);
    }
    .range-btns { display: flex; gap: 2px; }
    .range-btn {
      padding: 1px 6px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent; color: var(--color-text-muted);
      font-size: 10px; font-weight: 600; cursor: pointer;
      transition: all var(--transition-fast);
    }
    .range-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .range-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
    canvas { display: block; width: 100%; max-height: 80px; }
    .chart-loading {
      display: flex; align-items: center; justify-content: center;
      height: 60px; font-size: var(--text-xs); color: var(--color-text-muted);
    }

    .open-badge {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: var(--radius-full);
      font-weight: 700;
      background: color-mix(in srgb, var(--color-primary) 20%, transparent);
      color: var(--color-primary);
    }
  `;

  @property({ type: Object }) favorite!: Favorite;
  @property({ type: Boolean }) expanded = false;
  @property({ type: String }) globalRange: Range = '30d';

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @state() private _history: { date: string; price: number }[] = [];
  @state() private _range: Range = '30d';
  @state() private _chartLoading = false;
  private _loadedKey = '';
  private _chart?: Chart;

  connectedCallback() {
    super.connectedCallback();
    this._range = this.globalRange;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._chart?.destroy();
  }

  protected updated(changed: PropertyValues) {
    // sync globalRange when no local override
    if (changed.has('globalRange')) {
      this._range = this.globalRange;
    }

    if (!this.expanded) {
      this._chart?.destroy();
      this._chart = undefined;
      return;
    }

    const key = `${this.favorite?.ticker}:${this._range}`;
    if (key !== this._loadedKey) {
      this._loadedKey = key;
      this._loadChart();
    }

    if (!this._chartLoading && this._history.length >= 2) {
      this._renderChart();
    }
  }

  private async _loadChart() {
    this._chart?.destroy();
    this._chart = undefined;
    this._chartLoading = true;
    try {
      this._history = await fetchMarketHistory(this.favorite.ticker, this._range);
    } catch { this._history = []; }
    finally { this._chartLoading = false; }
  }

  private _setRange(r: Range) {
    if (this._range === r) return;
    this._range = r;
    this._loadedKey = '';
  }

  private _renderChart() {
    if (!this._canvas) return;
    const prices = this._history.map(p => p.price);
    const rawDates = this._history.map(p => p.date);
    const first = prices[0] ?? 0;
    const last  = prices[prices.length - 1] ?? 0;
    const up = last >= first;
    const lineColor = up ? '#34d399' : '#f87171';
    const fillColor = up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    this._chart?.destroy();
    this._chart = undefined;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: rawDates,
        datasets: [{
          data: prices, borderColor: lineColor, backgroundColor: fillColor,
          borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 3, tension: 0.35, fill: true,
        }],
      },
      options: {
        responsive: true, animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (ctx) => _fmtTooltip(ctx[0]?.label ?? '', self._range),
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                const sym = self.favorite.currency ? `${self.favorite.currency} ` : '';
                return ` ${sym}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: false,
            ticks: {
              callback: (_, idx) => {
                const label = (self._chart?.data.labels?.[idx] as string) ?? '';
                return _fmtLabel(label, self._range);
              },
            },
          },
          y: { display: false },
        },
      },
    };
    this._chart = new Chart(this._canvas, config);
  }

  private _toggleExpand(e: Event) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }

  private _toggleOpen(e: Event) {
    e.stopPropagation();
    setFavoriteOpen(this.favorite.ticker, !this.favorite.isOpen);
  }

  private _unfavorite(e: Event) {
    e.stopPropagation();
    removeFavorite(this.favorite.ticker);
  }

  render() {
    const { ticker, name, asset_type, currency, unit_price, daily_change_pct, isOpen } = this.favorite;
    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
    const fmtPrice = unit_price != null ? `${currency ?? ''} ${fmt.format(unit_price)}` : '—';
    const up = (daily_change_pct ?? 0) >= 0;
    const changeClass = daily_change_pct == null ? 'flat' : up ? 'up' : 'down';
    const changeLabel = daily_change_pct != null
      ? `${up ? '▲' : '▼'} ${Math.abs(daily_change_pct).toFixed(2)}%` : null;
    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];

    return html`
      <div class="card ${isOpen ? 'is-open' : ''}">
        <div class="header" @click="${this._toggleExpand}">
          <div class="left">
            <ac-asset-type-badge .type="${asset_type ?? 'stock'}"></ac-asset-type-badge>
            <div class="info">
              <div class="ticker">
                ${ticker}
                ${isOpen ? html`<span class="open-badge" style="margin-left:4px">abierto</span>` : ''}
              </div>
              <div class="name">${name ?? ''}</div>
            </div>
          </div>

          <div class="right">
            <div class="values">
              <div class="price">${fmtPrice}</div>
              ${changeLabel ? html`<div class="change ${changeClass}">${changeLabel}</div>` : ''}
            </div>
            <div class="actions" @click="${(e: Event) => e.stopPropagation()}">
              <button
                class="btn-open ${isOpen ? 'open-state' : 'closed-state'}"
                title="${isOpen ? 'Cerrar posición' : 'Abrir posición'}"
                @click="${this._toggleOpen}"
              >${isOpen ? '■ Cerrar' : '▶ Abrir'}</button>
              <button class="btn-unfav" title="Quitar de favoritos" @click="${this._unfavorite}">★</button>
            </div>
            <span class="chevron ${this.expanded ? 'open' : ''}">▼</span>
          </div>
        </div>

        ${this.expanded ? html`
          <div class="chart-section">
            <div class="chart-header">
              <div class="range-btns">
                ${ranges.map(r => html`
                  <button
                    class="range-btn ${this._range === r ? 'active' : ''}"
                    @click="${(e: Event) => { e.stopPropagation(); this._setRange(r); }}"
                  >${RANGE_LABELS[r]}</button>
                `)}
              </div>
            </div>
            ${this._chartLoading
              ? html`<div class="chart-loading">Cargando…</div>`
              : this._history.length >= 2
                ? html`<canvas></canvas>`
                : html`<div class="chart-loading">Sin datos para este período</div>`}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-favorite-card': AcFavoriteCard; }
}
