import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import {
  Chart, type ChartConfiguration,
  LineElement, PointElement, LinearScale, CategoryScale,
  LineController, Filler, Tooltip, Legend,
} from 'chart.js';
import { appContext, type AppState } from '@/store/app.context';
import type { Asset } from '@/types/asset';
import type { Favorite } from '@/types/favorites';
import type { MarketQuote } from '@/types/market';
import { fetchMarketHistory, searchMarket } from '@/services/market.service';
import { fetchAssetHistory } from '@/services/asset.service';
import { getFavorites, toggleFavorite, FAVORITES_EVENT } from '@/services/favorites.service';
import '@/components/common/ac-spinner';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, LineController, Filler, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = '1h' | '1d' | '1w' | '30d' | '1y';

interface PPoint { date: string; price: number; }

interface CompareEntry {
  ticker: string;
  name: string;
  color: string;
  source: 'market' | 'owned';
  currency?: string;
  history: PPoint[];
  loading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };
const RANGE_TITLES: Record<Range, string> = {
  '1h': 'última hora', '1d': 'último día', '1w': 'última semana',
  '30d': 'últimos 30 días', '1y': 'último año',
};

const PALETTE = [
  '#6366f1', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#c084fc',
];

const MAX_ITEMS = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _fmt(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const t = dateStr.includes('T') ? (dateStr.split('T')[1] ?? '') : '';
    return t.substring(0, 5);
  }
  const d = (dateStr.split('T')[0] ?? dateStr).split('-');
  return d.length >= 3 ? `${d[2]}/${d[1]}` : dateStr;
}

function _fmtTooltip(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const [dp = '', tp = ''] = dateStr.split('T');
    const [y = '', m = '', d = ''] = dp.split('-');
    return `${d}/${m}/${y} ${tp.substring(0, 5)}`;
  }
  const [y = '', m = '', d = ''] = (dateStr.split('T')[0] ?? dateStr).split('-');
  return `${d}/${m}/${y}`;
}

/** Align multiple series to a common date axis and normalize to % change. */
function alignAndNormalize(entries: CompareEntry[]): {
  labels: string[];
  datasets: (number | null)[][];
} {
  const allDates = new Set<string>();
  for (const e of entries) for (const p of e.history) allDates.add(p.date);
  const labels = Array.from(allDates).sort();

  const datasets = entries.map(e => {
    const map = new Map(e.history.map(p => [p.date, p.price]));
    const firstPrice = e.history[0]?.price ?? 1;
    return labels.map(d => {
      const v = map.get(d);
      return v !== undefined ? ((v - firstPrice) / firstPrice) * 100 : null;
    });
  });

  return { labels, datasets };
}

// ─── Component ────────────────────────────────────────────────────────────────

@customElement('ac-market-compare')
export class AcMarketCompare extends LitElement {
  static styles = css`
    :host { display: block; }

    /* ── Add panel ── */
    .add-panel {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    @media (max-width: 900px) { .add-panel { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .add-panel { grid-template-columns: 1fr; } }

    .panel-box {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }
    .panel-title {
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-3);
    }

    /* search */
    .search-wrap { position: relative; margin-bottom: var(--space-3); }
    .search-icon {
      position: absolute; left: var(--space-3); top: 50%;
      transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none;
    }
    input[type="search"] {
      width: 100%; box-sizing: border-box;
      padding: var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 20px);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
    }
    input[type="search"]:focus { outline: 2px solid var(--color-primary); outline-offset: -1px; }

    .search-results { display: flex; flex-direction: column; gap: var(--space-1); max-height: 200px; overflow-y: auto; }
    .search-result {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition-fast);
      font-size: var(--text-sm);
    }
    .search-result:hover { background: var(--color-surface-raised); }
    .search-result.disabled { opacity: 0.45; cursor: default; pointer-events: none; }
    .sr-ticker { font-weight: 700; }
    .sr-name { color: var(--color-text-muted); font-size: var(--text-xs); }
    .sr-price { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); }

    .sr-right { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }

    .fav-btn {
      background: none; border: none; cursor: pointer;
      font-size: 15px; line-height: 1; padding: 2px;
      color: var(--color-text-muted);
      transition: color var(--transition-fast), transform var(--transition-fast);
      flex-shrink: 0;
    }
    .fav-btn:hover { color: #f59e0b; transform: scale(1.2); }
    .fav-btn.fav-on { color: #f59e0b; }

    /* owned assets */
    .owned-grid { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .owned-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      font-size: var(--text-xs); font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .owned-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .owned-chip.added { opacity: 0.4; cursor: default; pointer-events: none; }

    /* favorites chips */
    .fav-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: var(--space-1) var(--space-3);
      border: 1px solid #f59e0b;
      border-radius: var(--radius-full);
      font-size: var(--text-xs); font-weight: 600;
      cursor: pointer; color: #f59e0b;
      transition: all var(--transition-fast);
    }
    .fav-chip:hover { background: rgba(245,158,11,0.15); }
    .fav-chip.added { opacity: 0.4; cursor: default; pointer-events: none; }

    /* ── Selected pills ── */
    .selected-bar {
      display: flex; align-items: center; flex-wrap: wrap;
      gap: var(--space-2); margin-bottom: var(--space-4);
    }
    .selected-label {
      font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 600;
    }
    .pill {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 3px var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs); font-weight: 700;
    }
    .pill-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .pill-source {
      font-size: 9px; opacity: 0.65; font-weight: 400;
    }
    .pill-remove {
      background: none; border: none; cursor: pointer;
      color: inherit; opacity: 0.6; padding: 0; line-height: 1;
      font-size: 12px;
    }
    .pill-remove:hover { opacity: 1; }

    /* ── Chart area ── */
    .chart-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
    }
    .chart-top {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);
    }
    .chart-title { font-size: var(--text-sm); color: var(--color-text-muted); }

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
    .range-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }

    canvas { display: block; width: 100%; max-height: 280px; }

    .chart-empty {
      display: flex; align-items: center; justify-content: center;
      height: 180px; color: var(--color-text-muted); font-size: var(--text-sm);
    }
    .chart-loading {
      display: flex; align-items: center; justify-content: center; height: 180px;
    }

    /* ── Legend ── */
    .legend {
      display: flex; flex-wrap: wrap; gap: var(--space-4);
      margin-top: var(--space-5); padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }
    .legend-item { display: flex; align-items: center; gap: var(--space-2); min-width: 140px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-ticker { font-weight: 700; font-size: var(--text-sm); }
    .legend-name { font-size: var(--text-xs); color: var(--color-text-muted); }
    .legend-change {
      font-family: var(--font-mono); font-size: var(--text-sm); font-weight: 600; margin-left: auto;
    }
    .legend-change.up   { color: #34d399; }
    .legend-change.down { color: #f87171; }
    .legend-change.flat { color: var(--color-text-muted); }

    /* ── Empty state ── */
    .empty-hint {
      text-align: center; padding: var(--space-10);
      color: var(--color-text-muted); font-size: var(--text-sm); line-height: 1.6;
    }
  `;

  @consume({ context: appContext, subscribe: true })
  @state() private _app?: AppState;

  @query('canvas') private _canvas!: HTMLCanvasElement;

  @state() private _entries: CompareEntry[] = [];
  @state() private _range: Range = '30d';
  @state() private _searchQuery = '';
  @state() private _searchResults: MarketQuote[] = [];
  @state() private _searching = false;
  @state() private _favTickers: Set<string> = new Set();
  @state() private _favorites: Favorite[] = [];

  private _debounce?: ReturnType<typeof setTimeout>;
  private _chart?: Chart;
  private _chartKey = '';

  connectedCallback() {
    super.connectedCallback();
    this._refreshFavs();
    window.addEventListener(FAVORITES_EVENT, this._onFavChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._debounce);
    this._chart?.destroy();
    window.removeEventListener(FAVORITES_EVENT, this._onFavChange);
  }

  private _refreshFavs() {
    const favs = getFavorites();
    this._favorites = favs;
    this._favTickers = new Set(favs.map(f => f.ticker));
  }

  private _onFavChange = () => { this._refreshFavs(); };

  private _toggleFav(e: Event, quote: MarketQuote) {
    e.stopPropagation();
    toggleFavorite(quote.ticker, {
      name: quote.name ?? undefined,
      asset_type: quote.asset_type ?? undefined,
      currency: quote.currency ?? undefined,
      unit_price: quote.unit_price ?? undefined,
      daily_change_pct: quote.daily_change_pct ?? undefined,
    });
  }

  // ── Search ──

  private _onSearchInput(e: InputEvent) {
    this._searchQuery = (e.target as HTMLInputElement).value.trim();
    clearTimeout(this._debounce);
    if (!this._searchQuery) { this._searchResults = []; return; }
    this._debounce = setTimeout(() => this._doSearch(), 350);
  }

  private async _doSearch() {
    this._searching = true;
    try { this._searchResults = await searchMarket(this._searchQuery); }
    catch { this._searchResults = []; }
    finally { this._searching = false; }
  }

  // ── Entries management ──

  private _nextColor(): string {
    const used = new Set(this._entries.map(e => e.color));
    return PALETTE.find(c => !used.has(c)) ?? PALETTE[this._entries.length % PALETTE.length]!;
  }

  private _hasTicker(t: string) { return this._entries.some(e => e.ticker === t); }

  private async _addEntry(entry: Omit<CompareEntry, 'history' | 'loading' | 'color'>) {
    if (this._hasTicker(entry.ticker) || this._entries.length >= MAX_ITEMS) return;
    const newEntry: CompareEntry = { ...entry, color: this._nextColor(), history: [], loading: true };
    this._entries = [...this._entries, newEntry];
    this._invalidateChart();
    try {
      const history = entry.source === 'owned'
        ? (await fetchAssetHistory(entry.ticker, this._range)).map(p => ({ date: p.date, price: p.unit_price }))
        : await fetchMarketHistory(entry.ticker, this._range);
      this._entries = this._entries.map(e =>
        e.ticker === entry.ticker ? { ...e, history, loading: false } : e,
      );
    } catch {
      this._entries = this._entries.map(e =>
        e.ticker === entry.ticker ? { ...e, loading: false } : e,
      );
    }
  }

  private _remove(ticker: string) {
    this._entries = this._entries.filter(e => e.ticker !== ticker);
    this._invalidateChart();
  }

  private async _reloadAll() {
    this._invalidateChart();
    this._entries = this._entries.map(e => ({ ...e, loading: true, history: [] }));
    await Promise.all(this._entries.map(async e => {
      try {
        const history = e.source === 'owned'
          ? (await fetchAssetHistory(e.ticker, this._range)).map(p => ({ date: p.date, price: p.unit_price }))
          : await fetchMarketHistory(e.ticker, this._range);
        this._entries = this._entries.map(x => x.ticker === e.ticker ? { ...x, history, loading: false } : x);
      } catch {
        this._entries = this._entries.map(x => x.ticker === e.ticker ? { ...x, loading: false } : x);
      }
    }));
  }

  private _setRange(r: Range) {
    if (this._range === r) return;
    this._range = r;
    this._reloadAll();
  }

  private _invalidateChart() {
    this._chart?.destroy();
    this._chart = undefined;
    this._chartKey = '';
  }

  // ── Chart ──

  protected updated(_changed: PropertyValues) {
    const ready = this._entries.filter(e => !e.loading && e.history.length >= 2);
    if (ready.length === 0) return;

    const key = ready.map(e => `${e.ticker}:${e.history.length}`).join('|') + ':' + this._range;
    if (key === this._chartKey) return;
    this._chartKey = key;
    this._renderChart(ready);
  }

  private _renderChart(entries: CompareEntry[]) {
    if (!this._canvas) return;

    // Always rebuild from scratch — animation is disabled so it's instant,
    // and in-place dataset updates lose styling when datasets are added/removed.
    this._chart?.destroy();
    this._chart = undefined;

    const { labels, datasets } = alignAndNormalize(entries);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: entries.map((e, i) => ({
          label: e.ticker,
          data: datasets[i]!,
          borderColor: e.color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
          spanGaps: true,
        })),
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
                const sign = v >= 0 ? '+' : '';
                return ` ${ctx.dataset.label}: ${sign}${v.toFixed(2)}%`;
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
                return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
              },
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    };
    this._chart = new Chart(this._canvas, config);
  }

  // ── Render ──

  private _renderLegend() {
    return this._entries.map(e => {
      if (e.history.length < 2) return html``;
      const first = e.history[0]!.price;
      const last  = e.history[e.history.length - 1]!.price;
      const pct   = ((last - first) / first) * 100;
      const cls   = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
      const sign  = pct >= 0 ? '+' : '';
      return html`
        <div class="legend-item">
          <div class="legend-dot" style="background:${e.color}"></div>
          <div>
            <div class="legend-ticker">${e.ticker}</div>
            <div class="legend-name">${e.name}</div>
          </div>
          <span class="legend-change ${cls}">${sign}${pct.toFixed(2)}%</span>
        </div>
      `;
    });
  }

  render() {
    const ownedAssets: Asset[] = this._app?.assets ?? [];
    const isLoadingSome = this._entries.some(e => e.loading);
    const hasReady = this._entries.some(e => !e.loading && e.history.length >= 2);
    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];

    return html`
      <!-- Add panel -->
      <div class="add-panel">
        <!-- Market search -->
        <div class="panel-box">
          <div class="panel-title">Buscar en el mercado</div>
          <div class="search-wrap">
            <span class="search-icon">⌕</span>
            <input
              type="search"
              placeholder="AAPL, BTC, GGAL…"
              .value="${this._searchQuery}"
              @input="${this._onSearchInput}"
            />
          </div>
          ${this._searching
            ? html`<div style="text-align:center;padding:var(--space-2)"><ac-spinner></ac-spinner></div>`
            : html`
              <div class="search-results">
                ${this._searchResults.slice(0, 8).map(q => {
                  const already = this._hasTicker(q.ticker);
                  const full = this._entries.length >= MAX_ITEMS;
                  const isFav = this._favTickers.has(q.ticker);
                  return html`
                    <div
                      class="search-result ${already || full ? 'disabled' : ''}"
                      @click="${() => this._addEntry({ ticker: q.ticker, name: q.name ?? q.ticker, source: 'market', currency: q.currency ?? undefined })}"
                    >
                      <div>
                        <div class="sr-ticker">${q.ticker}</div>
                        <div class="sr-name">${q.name ?? ''}</div>
                      </div>
                      <div class="sr-right">
                        ${q.unit_price != null
                          ? html`<span class="sr-price">${q.currency ?? ''} ${q.unit_price.toFixed(2)}</span>`
                          : ''}
                        <button
                          class="fav-btn ${isFav ? 'fav-on' : ''}"
                          title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                          @click="${(e: Event) => this._toggleFav(e, q)}"
                        >${isFav ? '★' : '☆'}</button>
                      </div>
                    </div>
                  `;
                })}
              </div>
            `}
        </div>

        <!-- Owned assets -->
        <div class="panel-box">
          <div class="panel-title">Mis activos</div>
          <div class="owned-grid">
            ${ownedAssets.length === 0
              ? html`<span style="font-size:var(--text-xs);color:var(--color-text-muted)">Sin activos cargados.</span>`
              : ownedAssets.map(a => {
                  const already = this._hasTicker(a.ticker);
                  const full = this._entries.length >= MAX_ITEMS;
                  return html`
                    <div
                      class="owned-chip ${already || full ? 'added' : ''}"
                      @click="${() => this._addEntry({ ticker: a.ticker, name: a.name ?? a.ticker, source: 'owned', currency: a.currency ?? undefined })}"
                    >
                      ${a.ticker}
                    </div>
                  `;
                })}
          </div>
        </div>

        <!-- Favorite instruments -->
        <div class="panel-box">
          <div class="panel-title">★ Mis favoritos</div>
          <div class="owned-grid">
            ${this._favorites.length === 0
              ? html`<span style="font-size:var(--text-xs);color:var(--color-text-muted)">Sin favoritos guardados.</span>`
              : this._favorites.map(f => {
                  const already = this._hasTicker(f.ticker);
                  const full = this._entries.length >= MAX_ITEMS;
                  return html`
                    <div
                      class="fav-chip ${already || full ? 'added' : ''}"
                      @click="${() => this._addEntry({ ticker: f.ticker, name: f.name ?? f.ticker, source: 'market', currency: f.currency ?? undefined })}"
                    >
                      ★ ${f.ticker}
                    </div>
                  `;
                })}
          </div>
        </div>
      </div>

      <!-- Selected pills -->
      ${this._entries.length > 0 ? html`
        <div class="selected-bar">
          <span class="selected-label">Comparando:</span>
          ${this._entries.map(e => html`
            <div class="pill" style="background:${e.color}22;color:${e.color};border:1px solid ${e.color}44">
              <div class="pill-dot" style="background:${e.color}"></div>
              ${e.ticker}
              <span class="pill-source">${e.source === 'owned' ? 'propio' : 'mercado'}</span>
              ${e.loading ? html`<ac-spinner></ac-spinner>` : ''}
              <button class="pill-remove" @click="${() => this._remove(e.ticker)}">✕</button>
            </div>
          `)}
        </div>
      ` : ''}

      <!-- Chart -->
      ${this._entries.length === 0
        ? html`
          <div class="empty-hint">
            Agregá al menos un instrumento desde el mercado o tus activos<br>para comenzar la comparación.
          </div>
        `
        : html`
          <div class="chart-card">
            <div class="chart-top">
              <span class="chart-title">
                Rendimiento relativo — ${RANGE_TITLES[this._range]}
              </span>
              <div class="range-btns">
                ${ranges.map(r => html`
                  <button
                    class="range-btn ${this._range === r ? 'active' : ''}"
                    @click="${() => this._setRange(r)}"
                  >${RANGE_LABELS[r]}</button>
                `)}
              </div>
            </div>

            ${isLoadingSome && !hasReady
              ? html`<div class="chart-loading"><ac-spinner></ac-spinner></div>`
              : hasReady
                ? html`<canvas></canvas>`
                : html`<div class="chart-empty">Sin datos para este período</div>`}

            ${hasReady ? html`<div class="legend">${this._renderLegend()}</div>` : ''}
          </div>
        `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-market-compare': AcMarketCompare; }
}
