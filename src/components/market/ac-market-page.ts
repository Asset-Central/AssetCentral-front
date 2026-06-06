import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import {
  Chart, type ChartConfiguration,
  LineElement, PointElement, LinearScale, CategoryScale,
  LineController, Filler, Tooltip,
} from 'chart.js';
import type { MarketPricePoint, MarketQuote } from '@/types/market';
import { fetchMarketHistory, searchMarket } from '@/services/market.service';
import { getFavorites, toggleFavorite, FAVORITES_EVENT } from '@/services/favorites.service';
import '@/components/common/ac-spinner';
import './ac-market-compare';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, LineController, Filler, Tooltip);

type Range = '1h' | '1d' | '1w' | '30d' | '1y';

const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };

const TYPE_ICONS: Record<string, string> = {
  cedear: 'C', stock: 'S', crypto: '₿', bono: 'B', fci: 'F', cash: '$',
};
const TYPE_COLORS: Record<string, string> = {
  cedear: '#6366f1', stock: '#3b82f6', crypto: '#f59e0b',
  bono: '#10b981', fci: '#8b5cf6', cash: '#6b7280',
};

function _fmt(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const t = dateStr.includes('T') ? (dateStr.split('T')[1] ?? '') : '';
    return t.substring(0, 5);
  }
  const parts = dateStr.split('T')[0]?.split('-') ?? [];
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

function _fmtTooltip(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const [d = '', t = ''] = dateStr.split('T');
    const [y = '', m = '', day = ''] = d.split('-');
    return `${day}/${m}/${y} ${t.substring(0, 5)}`;
  }
  const d = dateStr.split('T')[0] ?? dateStr;
  const [y = '', m = '', day = ''] = d.split('-');
  return `${day}/${m}/${y}`;
}

function _fmtPrice(price: number | undefined, currency: string | undefined): string {
  if (price == null) return '—';
  const sym = currency === 'ARS' ? 'ARS ' : currency === 'USD' ? 'USD ' : (currency ?? '') + ' ';
  return sym + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(price);
}

function _fmtCap(cap: number | undefined): string {
  if (!cap) return '';
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9)  return `${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6)  return `${(cap / 1e6).toFixed(2)}M`;
  return String(cap);
}

@customElement('ac-market-page')
export class AcMarketPage extends LitElement {
  static styles = css`
    :host { display: block; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    h2 {
      font-size: var(--text-xl);
      font-weight: 700;
      margin: 0;
    }

    .tabs {
      display: flex;
      gap: var(--space-1);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 3px;
    }
    .tab-btn {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: calc(var(--radius-lg) - 2px);
      background: transparent;
      color: var(--color-text-muted);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .tab-btn:hover { color: var(--color-text); }
    .tab-btn.active {
      background: var(--color-primary);
      color: #fff;
    }

    .search-bar {
      position: relative;
      margin-bottom: var(--space-5);
    }
    .search-icon {
      position: absolute;
      left: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      font-size: var(--text-base);
      pointer-events: none;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: var(--space-3) var(--space-4) var(--space-3) calc(var(--space-4) * 2 + 18px);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-base);
    }
    input:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: -1px;
    }

    /* ── Status messages ── */
    .status {
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-10);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    /* ── Results list ── */
    .results { display: flex; flex-direction: column; gap: var(--space-2); }

    .result-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: border-color var(--transition-fast);
    }
    .result-card:hover { border-color: var(--color-primary); }
    .result-card.selected { border-color: var(--color-primary); }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      user-select: none;
    }

    .result-left  { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .result-right { display: flex; align-items: center; gap: var(--space-4); flex-shrink: 0; }

    .type-badge {
      width: 28px; height: 28px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
      flex-shrink: 0;
    }

    .ticker-info .ticker { font-weight: 700; font-size: var(--text-base); }
    .ticker-info .name {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 260px;
    }

    .price-info { text-align: right; }
    .price {
      font-family: var(--font-mono);
      font-size: var(--text-base);
      font-weight: 600;
    }
    .change {
      display: inline-flex; align-items: center; gap: 2px;
      font-size: var(--text-xs); font-family: var(--font-mono); font-weight: 600;
      padding: 2px 6px; border-radius: var(--radius-full); margin-top: 2px;
    }
    .change.up   { background: color-mix(in srgb, #34d399 15%, transparent); color: #34d399; }
    .change.down { background: color-mix(in srgb, #f87171 15%, transparent); color: #f87171; }
    .change.flat { color: var(--color-text-muted); }

    .chevron {
      font-size: 10px; color: var(--color-text-muted);
      transition: transform var(--transition-fast); flex-shrink: 0;
    }
    .chevron.open { transform: rotate(180deg); }

    .fav-btn {
      background: none; border: none; cursor: pointer;
      font-size: 17px; line-height: 1; padding: 2px;
      color: var(--color-text-muted);
      transition: color var(--transition-fast), transform var(--transition-fast);
      flex-shrink: 0;
    }
    .fav-btn:hover { color: #f59e0b; transform: scale(1.2); }
    .fav-btn.fav-on { color: #f59e0b; }

    /* ── Detail panel ── */
    .detail {
      border-top: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-5) var(--space-5);
    }

    .detail-meta {
      display: flex; align-items: baseline; flex-wrap: wrap;
      gap: var(--space-4); margin-bottom: var(--space-4);
    }
    .detail-price {
      font-size: var(--text-2xl); font-family: var(--font-mono); font-weight: 700;
    }
    .detail-change { font-size: var(--text-sm); }
    .detail-cap { font-size: var(--text-xs); color: var(--color-text-muted); }

    .chart-header {
      display: flex; justify-content: flex-end; margin-bottom: var(--space-2);
    }
    .range-btns { display: flex; gap: var(--space-1); }
    .range-btn {
      padding: 2px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-xs); font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .range-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .range-btn.active {
      background: var(--color-primary); border-color: var(--color-primary); color: #fff;
    }

    canvas { display: block; width: 100%; max-height: 200px; }

    .chart-loading, .chart-empty {
      display: flex; align-items: center; justify-content: center;
      height: 120px; color: var(--color-text-muted); font-size: var(--text-sm);
    }

    .exchange-tag {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      padding: 1px 6px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
    }
  `;

  @query('canvas') private _canvas!: HTMLCanvasElement;

  @state() private _tab: 'search' | 'compare' = 'search';
  @state() private _favTickers: Set<string> = new Set();
  @state() private _query = '';
  @state() private _searching = false;
  @state() private _results: MarketQuote[] = [];
  @state() private _error: string | null = null;
  @state() private _selectedTicker: string | null = null;
  @state() private _range: Range = '30d';
  @state() private _history: MarketPricePoint[] = [];
  @state() private _chartLoading = false;

  private _debounceTimer?: ReturnType<typeof setTimeout>;
  private _chart?: Chart;

  connectedCallback() {
    super.connectedCallback();
    this._refreshFavs();
    window.addEventListener(FAVORITES_EVENT, this._onFavChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._debounceTimer);
    this._chart?.destroy();
    window.removeEventListener(FAVORITES_EVENT, this._onFavChange);
  }

  private _onFavChange = () => { this._refreshFavs(); };
  private _refreshFavs() {
    this._favTickers = new Set(getFavorites().map(f => f.ticker));
  }

  private _toggleFav(e: Event, quote: MarketQuote) {
    e.stopPropagation();
    toggleFavorite(quote.ticker, {
      name: quote.name,
      asset_type: quote.asset_type,
      currency: quote.currency,
      exchange: quote.exchange,
      unit_price: quote.unit_price,
      daily_change_pct: quote.daily_change_pct,
    });
  }

  private _onInput(e: InputEvent) {
    this._query = (e.target as HTMLInputElement).value.trim();
    clearTimeout(this._debounceTimer);
    if (!this._query) {
      this._results = [];
      this._error = null;
      return;
    }
    this._debounceTimer = setTimeout(() => this._doSearch(), 350);
  }

  private async _doSearch() {
    this._searching = true;
    this._error = null;
    try {
      this._results = await searchMarket(this._query);
      if (this._results.length === 0) this._error = 'Sin resultados para "' + this._query + '"';
    } catch {
      this._error = 'Error al buscar. Intenta de nuevo.';
    } finally {
      this._searching = false;
    }
  }

  private _toggleSelect(ticker: string) {
    if (this._selectedTicker === ticker) {
      this._selectedTicker = null;
      this._chart?.destroy();
      this._chart = undefined;
      return;
    }
    this._selectedTicker = ticker;
    this._range = '30d';
    this._loadHistory(ticker, '30d');
  }

  private async _loadHistory(ticker: string, range: Range) {
    this._chartLoading = true;
    this._history = [];
    if (this._chart) { this._chart.destroy(); this._chart = undefined; }
    try {
      this._history = await fetchMarketHistory(ticker, range);
    } catch { this._history = []; }
    finally { this._chartLoading = false; }
  }

  private _setRange(r: Range) {
    if (this._range === r || !this._selectedTicker) return;
    this._range = r;
    this._loadHistory(this._selectedTicker, r);
  }

  updated() {
    if (this._selectedTicker && !this._chartLoading && this._history.length >= 2) {
      this._renderChart();
    }
  }

  private _renderChart() {
    if (!this._canvas) return;

    const prices = this._history.map(p => p.price);
    const rawDates = this._history.map(p => p.date);

    const first = prices[0] ?? 0;
    const last  = prices[prices.length - 1] ?? 0;
    const up    = last >= first;
    const lineColor = up ? '#34d399' : '#f87171';
    const fillColor = up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    if (this._chart) {
      this._chart.data.labels = rawDates;
      const ds = this._chart.data.datasets[0] as any;
      ds.data = prices;
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
          data: prices,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
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
              title: (ctx) => _fmtTooltip(ctx[0]?.label ?? '', self._range),
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                const q = self._results.find(r => r.ticker === self._selectedTicker);
                const sym = q?.currency ? `${q.currency} ` : '';
                return ` ${sym}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#6b7280', font: { size: 10 }, maxTicksLimit: 8,
              callback: (_, idx) => {
                const label = (self._chart?.data.labels?.[idx] as string) ?? '';
                return _fmt(label, self._range);
              },
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            ticks: {
              color: '#6b7280', font: { size: 10 },
              callback: (v) => {
                const n = Number(v);
                return n >= 1_000_000
                  ? `${(n / 1_000_000).toFixed(1)}M`
                  : n >= 1_000
                    ? `${(n / 1_000).toFixed(0)}K`
                    : n.toFixed(2);
              },
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    };
    this._chart = new Chart(this._canvas, config);
  }

  private _renderDetail(quote: MarketQuote) {
    const up = (quote.daily_change_pct ?? 0) >= 0;
    const changeClass = quote.daily_change_pct == null ? 'flat' : up ? 'up' : 'down';
    const changeLabel = quote.daily_change_pct != null
      ? `${up ? '▲' : '▼'} ${Math.abs(quote.daily_change_pct).toFixed(2)}%`
      : null;
    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];

    return html`
      <div class="detail">
        <div class="detail-meta">
          <span class="detail-price">${_fmtPrice(quote.unit_price, quote.currency)}</span>
          ${changeLabel ? html`<span class="detail-change change ${changeClass}">${changeLabel}</span>` : ''}
          ${quote.exchange ? html`<span class="exchange-tag">${quote.exchange}</span>` : ''}
          ${quote.market_cap ? html`<span class="detail-cap">Cap: ${_fmtCap(quote.market_cap)}</span>` : ''}
        </div>

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
          ? html`<div class="chart-loading"><ac-spinner></ac-spinner></div>`
          : this._history.length >= 2
            ? html`<canvas></canvas>`
            : html`<div class="chart-empty">Sin datos para este período</div>`}
      </div>
    `;
  }

  render() {
    return html`
      <div class="page-header">
        <h2>Mercado</h2>
        <div class="tabs">
          <button
            class="tab-btn ${this._tab === 'search' ? 'active' : ''}"
            @click="${() => { this._tab = 'search'; }}"
          >Buscar</button>
          <button
            class="tab-btn ${this._tab === 'compare' ? 'active' : ''}"
            @click="${() => { this._tab = 'compare'; }}"
          >Comparar</button>
        </div>
      </div>

      ${this._tab === 'compare'
        ? html`<ac-market-compare></ac-market-compare>`
        : html`
          <div class="search-bar">
            <span class="search-icon">⌕</span>
            <input
              type="search"
              placeholder="Buscar CEDEAR, acción, crypto, bono… (ej: AAPL, BTC, GGAL)"
              .value="${this._query}"
              @input="${this._onInput}"
            />
          </div>

          ${this._searching
            ? html`<div class="status"><ac-spinner></ac-spinner></div>`
            : this._error
              ? html`<div class="status">${this._error}</div>`
              : !this._query
                ? html`<div class="status">Ingresá un ticker o nombre para buscar instrumentos del mercado.</div>`
                : html`
                  <div class="results">
                    ${this._results.map(quote => {
                      const selected = this._selectedTicker === quote.ticker;
                      const type = quote.asset_type ?? 'stock';
                      const icon = TYPE_ICONS[type] ?? 'S';
                      const color = TYPE_COLORS[type] ?? '#6b7280';
                      const up = (quote.daily_change_pct ?? 0) >= 0;
                      const changeClass = quote.daily_change_pct == null ? 'flat' : up ? 'up' : 'down';
                      const changeLabel = quote.daily_change_pct != null
                        ? `${up ? '▲' : '▼'} ${Math.abs(quote.daily_change_pct).toFixed(2)}%`
                        : null;

                      return html`
                        <div class="result-card ${selected ? 'selected' : ''}">
                          <div class="result-header" @click="${() => this._toggleSelect(quote.ticker)}">
                            <div class="result-left">
                              <div class="type-badge" style="background:${color}22;color:${color}">
                                ${icon}
                              </div>
                              <div class="ticker-info">
                                <div class="ticker">${quote.ticker}</div>
                                <div class="name">${quote.name ?? ''}</div>
                              </div>
                            </div>
                            <div class="result-right">
                              <div class="price-info">
                                <div class="price">${_fmtPrice(quote.unit_price, quote.currency)}</div>
                                ${changeLabel ? html`<div class="change ${changeClass}">${changeLabel}</div>` : ''}
                              </div>
                              <button
                                class="fav-btn ${this._favTickers.has(quote.ticker) ? 'fav-on' : ''}"
                                title="${this._favTickers.has(quote.ticker) ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                                @click="${(e: Event) => this._toggleFav(e, quote)}"
                              >${this._favTickers.has(quote.ticker) ? '★' : '☆'}</button>
                              <span class="chevron ${selected ? 'open' : ''}">▼</span>
                            </div>
                          </div>

                          ${selected ? this._renderDetail(quote) : ''}
                        </div>
                      `;
                    })}
                  </div>
                `}
        `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-market-page': AcMarketPage; }
}
