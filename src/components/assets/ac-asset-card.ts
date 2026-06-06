import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import {
  Chart, type ChartConfiguration,
  LineElement, PointElement, LinearScale, CategoryScale,
  LineController, Filler, Tooltip,
} from 'chart.js';
import type { Asset, InflationPoint, PricePoint } from '@/types/asset';
import { fetchAssetHistory, fetchInflation } from '@/services/asset.service';
import './ac-asset-type-badge';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, LineController, Filler, Tooltip);

type Range = '1h' | '1d' | '1w' | '30d' | '1y';

const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };

const CASH_TICKERS = new Set(['ARS-CASH', 'USDT']);

function _formatLabel(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const t = dateStr.includes('T') ? dateStr.split('T')[1] ?? '' : '';
    return t.substring(0, 5);
  }
  const parts = dateStr.split('-');
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`; // YYYY-MM
  return dateStr;
}

function _formatTooltipDate(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const [datePart = '', timePart = ''] = dateStr.split('T');
    const [y = '', m = '', d = ''] = datePart.split('-');
    return `${d}/${m}/${y} ${timePart}`;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y = '', m = '', d = ''] = parts;
    return `${d}/${m}/${y}`;
  }
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`; // YYYY-MM
  return dateStr;
}

@customElement('ac-asset-card')
export class AcAssetCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      transition: border-color var(--transition-fast);
    }
    :host(:hover) { border-color: var(--color-primary); }

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
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .right { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }

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

    .chevron {
      font-size: 10px;
      color: var(--color-text-muted);
      transition: transform var(--transition-fast);
      flex-shrink: 0;
    }
    .chevron.open { transform: rotate(180deg); }

    .chart-section {
      border-top: 1px solid var(--color-border);
      padding: var(--space-2) var(--space-5) var(--space-4);
    }
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-1);
    }
    .chart-label {
      font-size: 10px;
      color: var(--color-text-muted);
      font-weight: 600;
    }
    /* local-override badge */
    .local-badge {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: var(--radius-full);
      background: color-mix(in srgb, var(--color-primary) 20%, transparent);
      color: var(--color-primary);
      cursor: pointer;
    }
    .range-btns { display: flex; gap: 2px; }
    .range-btn {
      padding: 1px 6px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .range-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .range-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    .range-btn.active.local {
      background: #d97706;
      border-color: #d97706;
    }
    canvas { display: block; max-height: 80px; width: 100%; }
    .chart-loading {
      display: flex; align-items: center; justify-content: center;
      height: 60px;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }
  `;

  @property({ type: Object }) asset!: Asset;
  @property({ type: Boolean }) open = false;
  @property({ type: String }) globalRange: Range = '30d';

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @state() private _history: PricePoint[] = [];
  @state() private _chartLoading = false;

  // null = follow globalRange; set = local override
  private _localRange: Range | null = null;
  private _loadedKey = '';
  private _chart?: Chart;

  private get _activeRange(): Range {
    return this._localRange ?? this.globalRange;
  }

  private get _isCash(): boolean {
    return CASH_TICKERS.has(this.asset?.ticker ?? '');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._chart?.destroy();
    this._chart = undefined;
  }

  protected updated(changed: PropertyValues) {
    // When closed: destroy chart and reset local range override
    if (changed.has('open') && !this.open) {
      this._chart?.destroy();
      this._chart = undefined;
      this._localRange = null;
      return;
    }

    // When global range changes and we're following it, force reload
    if (changed.has('globalRange') && this._localRange === null) {
      this._loadedKey = '';
    }

    // Lazy-load when open (or range changed)
    if (this.open) {
      const key = `${this.asset?.ticker}:${this._activeRange}`;
      if (key !== this._loadedKey) {
        this._loadedKey = key;
        this._loadData();
      }
    }

    // Render chart when open + data ready
    if (this.open && !this._chartLoading && this._history.length >= 2) {
      this._renderChart();
    }
  }

  private async _loadData() {
    this._chart?.destroy();
    this._chart = undefined;
    this._chartLoading = true;
    try {
      if (this._isCash) {
        const currency = this.asset.ticker === 'USDT' ? 'USD' : 'ARS';
        const inf: InflationPoint[] = await fetchInflation(currency);
        // Map inflation points to PricePoint (rate → unit_price & total_valuation)
        this._history = inf.map(p => ({
          date: p.date,
          unit_price: p.rate,
          total_valuation: p.rate,
        }));
      } else {
        this._history = await fetchAssetHistory(this.asset.ticker, this._activeRange);
      }
    } catch {
      this._history = [];
    } finally {
      this._chartLoading = false;
    }
  }

  private _setRange(e: Event, r: Range) {
    e.stopPropagation();
    if (this._activeRange === r && this._localRange === r) return;
    this._localRange = r;
    this._loadedKey = ''; // trigger reload in updated()
    this.requestUpdate(); // ensure updated() fires for the localRange change
  }

  private _resetToGlobal(e: Event) {
    e.stopPropagation();
    this._localRange = null;
    this._loadedKey = '';
    this.requestUpdate();
  }

  private _toggle(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('toggle-open', {
      bubbles: true,
      composed: true,
      detail: { ticker: this.asset?.ticker },
    }));
  }

  private _renderChart() {
    if (!this._canvas) return;

    const isCash = this._isCash;
    const values = this._history.map(p => p.unit_price);
    const rawDates = this._history.map(p => p.date);

    const first = values[0] ?? 0;
    const last  = values[values.length - 1] ?? 0;
    const up    = last >= first;

    const lineColor = isCash ? '#f59e0b' : up ? '#34d399' : '#f87171';
    const fillColor = isCash ? 'rgba(245,158,11,0.12)' : up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    if (this._chart) {
      this._chart.data.labels = rawDates;
      const ds = this._chart.data.datasets[0] as any;
      ds.data = values;
      ds.borderColor = lineColor;
      ds.backgroundColor = fillColor;
      this._chart.update();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: rawDates,
        datasets: [{
          data: values,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.35,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (ctx) => {
                const label = ctx[0]?.label ?? '';
                return _formatTooltipDate(label, self._activeRange);
              },
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                if (isCash) return ` ${v.toFixed(2)}%`;
                const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
                return ` ${self.asset.currency ?? ''} ${fmt.format(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: isCash,
            ticks: {
              color: '#6b7280',
              font: { size: 9 },
              maxTicksLimit: 6,
              callback: (_, idx) => {
                const label = (self._chart?.data.labels?.[idx] as string) ?? '';
                return _formatLabel(label, self._activeRange);
              },
            },
            grid: { display: false },
          },
          y: {
            display: isCash,
            ticks: {
              color: '#6b7280',
              font: { size: 9 },
              callback: (v) => `${Number(v).toFixed(1)}%`,
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    };
    this._chart = new Chart(this._canvas, config);
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

    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];
    const isLocal = this._localRange !== null;
    const active  = this._activeRange;

    return html`
      <div class="header" @click="${this._toggle}">
        <div class="left">
          <ac-asset-type-badge .type="${asset_type ?? 'stock'}"></ac-asset-type-badge>
          <div class="info">
            <div class="ticker">${ticker}</div>
            <div class="name">${name ?? ''}</div>
          </div>
        </div>

        <div class="right">
          <div class="values">
            <div class="total">${fmtTotal}</div>
            <div class="sub">${fmtPrice}</div>
            ${changeLabel ? html`<div class="change ${changeClass}">${changeLabel}</div>` : ''}
          </div>
          <span class="chevron ${this.open ? 'open' : ''}">▼</span>
        </div>
      </div>

      ${this.open ? html`
        <div class="chart-section">
          <div class="chart-header">
            <span class="chart-label">
              ${this._isCash ? 'Inflación mensual' : 'Historial de precio'}
            </span>
            <div style="display:flex;align-items:center;gap:4px">
              ${isLocal ? html`
                <span class="local-badge" @click="${this._resetToGlobal}" title="Volver al rango global">↺ global</span>
              ` : ''}
              ${this._isCash ? '' : html`
                <div class="range-btns">
                  ${ranges.map(r => html`
                    <button
                      class="range-btn ${active === r ? 'active' : ''} ${active === r && isLocal ? 'local' : ''}"
                      @click="${(e: Event) => this._setRange(e, r)}"
                    >${RANGE_LABELS[r]}</button>
                  `)}
                </div>
              `}
            </div>
          </div>
          ${this._chartLoading
            ? html`<div class="chart-loading">Cargando…</div>`
            : this._history.length >= 2
              ? html`<canvas></canvas>`
              : html`<div class="chart-loading">Sin datos</div>`}
        </div>
      ` : ''}
    `;
  }
}
