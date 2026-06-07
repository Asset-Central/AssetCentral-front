import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';
import type { Asset, AssetType } from '@/types/asset';
import type { Favorite } from '@/types/favorites';
import { getFavorites, setFavoriteOpen, FAVORITES_EVENT } from '@/services/favorites.service';
import './ac-asset-card';
import './ac-favorite-card';
import '@/components/common/ac-empty-state';
import '@/components/common/ac-spinner';

const ALL_TYPES: AssetType[] = ['cedear', 'bono', 'fci', 'cash', 'crypto', 'stock', 'caucion'];
type Range = '1h' | '1d' | '1w' | '30d' | '1y';
const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };
type FilterMode = AssetType | 'favoritos' | null;

@customElement('ac-asset-list')
export class AcAssetList extends LitElement {
  static styles = css`
    :host { display: block; }

    .toolbar {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    .toolbar-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    input {
      flex: 1;
      min-width: 160px;
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
    }
    input:focus { outline: 2px solid var(--color-primary); }

    .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .filter-btn {
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-fast);
    }
    .filter-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    .filter-btn.fav-active {
      background: #f59e0b;
      border-color: #f59e0b;
      color: #000;
    }

    .range-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .range-label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: 600;
    }
    .range-btns { display: flex; gap: var(--space-1); }
    .range-btn {
      padding: 2px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
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

    .list { display: flex; flex-direction: column; gap: var(--space-2); }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) 0 var(--space-1);
      cursor: pointer;
      user-select: none;
      width: fit-content;
    }
    .section-header:hover .section-title { color: var(--color-text); }
    .section-title {
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      transition: color var(--transition-fast);
    }
    .section-count {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .section-arrow {
      font-size: 9px;
      color: var(--color-text-muted);
      transition: transform var(--transition-fast);
    }
    .section-arrow.expanded { transform: rotate(0deg); }
    .section-arrow.collapsed { transform: rotate(-90deg); }

    /* Favorites section header uses amber accent */
    .section-header.fav .section-title { color: #f59e0b; }
    .section-header.fav .section-count { color: #f59e0b; opacity: 0.7; }
    .section-header.fav .section-arrow { color: #f59e0b; }

    .section-divider {
      margin: var(--space-2) 0 0;
    }
  `;

  @consume({ context: appContext, subscribe: true })
  @state() private _app?: AppState;

  @property({ type: Array }) assets: Asset[] = [];
  @property({ type: Boolean }) compact = false;

  @state() private _query = '';
  @state() private _filter: FilterMode = null;
  @state() private _openTickers = new Set<string>();
  @state() private _globalRange: Range = '30d';
  @state() private _favorites: Favorite[] = [];
  @state() private _favSectionExpanded = true;

  private get _source(): Asset[] {
    return this.assets.length > 0 ? this.assets : (this._app?.assets ?? []);
  }

  connectedCallback() {
    super.connectedCallback();
    this._favorites = getFavorites();
    window.addEventListener(FAVORITES_EVENT, this._onFavChange);

    const open = new URLSearchParams(window.location.search).get('open');
    if (open) {
      this._openTickers = new Set([open]);
      history.replaceState(null, '', window.location.pathname);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(FAVORITES_EVENT, this._onFavChange);
  }

  private _onFavChange = () => {
    this._favorites = getFavorites();
  };

  private _toggleCard(ticker: string) {
    const next = new Set(this._openTickers);
    if (next.has(ticker)) next.delete(ticker);
    else next.add(ticker);
    this._openTickers = next;
  }

  private _onToggleOpen(e: Event) {
    const ticker: string = (e as CustomEvent).detail?.ticker;
    if (ticker) this._toggleCard(ticker);
  }

  private _closeAll() { this._openTickers = new Set(); }

  private _openAllClosed() {
    const toOpen = this._closedAssets.map(a => a.ticker);
    this._openTickers = new Set([...this._openTickers, ...toOpen]);
  }

  // Portfolio tickers (to exclude from favorites section)
  private get _portfolioTickers(): Set<string> {
    return new Set(this._source.map(a => a.ticker));
  }

  // Favorites not in portfolio
  private get _standaloneFavs(): Favorite[] {
    const ptickers = this._portfolioTickers;
    return this._favorites.filter(f => !ptickers.has(f.ticker));
  }

  // Open favorites = isOpen:true → shown in Abiertos section
  private get _openFavs(): Favorite[] {
    return this._standaloneFavs.filter(f => f.isOpen);
  }

  // Closed favorites = isOpen:false → shown in Favoritos section
  private get _closedFavs(): Favorite[] {
    return this._standaloneFavs.filter(f => !f.isOpen);
  }

  private get _openAssets(): Asset[] {
    return this._source
      .filter(a => this._openTickers.has(a.ticker))
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  private get _closedAssets(): Asset[] {
    return this._source
      .filter(a => !this._openTickers.has(a.ticker))
      .filter(a => {
        const matchType = !this._filter || this._filter === 'favoritos' || a.asset_type === this._filter;
        const q = this._query.toLowerCase();
        const matchQuery = !q
          || a.ticker.toLowerCase().includes(q)
          || (a.name ?? '').toLowerCase().includes(q);
        return matchType && matchQuery;
      })
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  render() {
    if (!this.compact && this._app?.isLoading) {
      return html`<ac-spinner></ac-spinner>`;
    }

    const openAssets   = this._openAssets;
    const closedAssets = this._filter === 'favoritos' ? [] : this._closedAssets;
    const openFavs     = this._openFavs;
    const closedFavs   = this._closedFavs;
    const showPortfolio = this._filter !== 'favoritos';
    const anyOpen      = openAssets.length > 0 || openFavs.length > 0;
    const anyClosed    = closedAssets.length > 0;
    const anyFavs      = closedFavs.length > 0;
    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];

    return html`
      ${!this.compact ? html`
        <div class="toolbar">
          <div class="toolbar-row">
            <input
              type="search"
              placeholder="Buscar por ticker o nombre..."
              .value="${this._query}"
              @input="${(e: InputEvent) => (this._query = (e.target as HTMLInputElement).value)}"
            />
            <div class="filters">
              ${ALL_TYPES.map(t => html`
                <button
                  class="filter-btn ${this._filter === t ? 'active' : ''}"
                  @click="${() => (this._filter = this._filter === t ? null : t)}"
                >${t}</button>
              `)}
              <button
                class="filter-btn ${this._filter === 'favoritos' ? 'fav-active' : ''}"
                @click="${() => (this._filter = this._filter === 'favoritos' ? null : 'favoritos')}"
              >★ favoritos</button>
            </div>
          </div>
          <div class="range-row">
            <span class="range-label">Rango global:</span>
            <div class="range-btns">
              ${ranges.map(r => html`
                <button
                  class="range-btn ${this._globalRange === r ? 'active' : ''}"
                  @click="${() => { this._globalRange = r; }}"
                >${RANGE_LABELS[r]}</button>
              `)}
            </div>
          </div>
        </div>
      ` : ''}

      <div class="list" @toggle-open="${this._onToggleOpen}">
        ${!this.compact ? html`
          ${showPortfolio ? html`
            <!-- ── Abiertos: portfolio open + open favorites ── -->
            <div class="section-header" @click="${this._closeAll}">
              <span class="section-arrow ${anyOpen ? 'expanded' : 'collapsed'}">▼</span>
              <span class="section-title">Abiertos</span>
              <span class="section-count">(${openAssets.length + openFavs.length})</span>
            </div>

            ${openAssets.map(a => html`
              <ac-asset-card
                .asset="${a}"
                .open="${true}"
                .globalRange="${this._globalRange}"
              ></ac-asset-card>
            `)}

            ${openFavs.map(f => html`
              <ac-favorite-card
                .favorite="${f}"
                .expanded="${true}"
                .globalRange="${this._globalRange}"
              ></ac-favorite-card>
            `)}

            <!-- ── Cerrados ── -->
            <div class="section-header" @click="${this._openAllClosed}">
              <span class="section-arrow ${anyClosed ? 'expanded' : 'collapsed'}">▼</span>
              <span class="section-title">Cerrados</span>
              <span class="section-count">(${closedAssets.length})</span>
            </div>

            ${closedAssets.map(a => html`
              <ac-asset-card
                .asset="${a}"
                .open="${false}"
                .globalRange="${this._globalRange}"
              ></ac-asset-card>
            `)}

            ${!anyOpen && !anyClosed ? html`
              <ac-empty-state icon="◎" title="Sin activos" message="No hay activos que coincidan con el filtro."></ac-empty-state>
            ` : ''}
          ` : ''}

          <!-- ── Favoritos (cerrados) ── -->
          ${anyFavs || this._filter === 'favoritos' ? html`
            <div class="section-divider"></div>
            <div class="section-header fav"
              @click="${() => { this._favSectionExpanded = !this._favSectionExpanded; }}"
            >
              <span class="section-arrow ${this._favSectionExpanded ? 'expanded' : 'collapsed'}">▼</span>
              <span class="section-title">★ Favoritos</span>
              <span class="section-count">(${closedFavs.length})</span>
            </div>

            ${this._favSectionExpanded ? html`
              ${closedFavs.length === 0
                ? html`<ac-empty-state icon="★" title="Sin favoritos" message="Agregá instrumentos desde la sección Mercado."></ac-empty-state>`
                : closedFavs.map(f => html`
                    <ac-favorite-card
                      .favorite="${f}"
                      .expanded="${false}"
                      .globalRange="${this._globalRange}"
                    ></ac-favorite-card>
                  `)}
            ` : ''}
          ` : ''}

        ` : html`
          <!-- Compact mode -->
          ${[...openAssets, ...closedAssets].map(a => html`
            <ac-asset-card
              .asset="${a}"
              .open="${this._openTickers.has(a.ticker)}"
              .globalRange="${this._globalRange}"
            ></ac-asset-card>
          `)}
          ${!anyOpen && !anyClosed ? html`
            <ac-empty-state icon="◎" title="Sin activos" message="No hay activos que coincidan con el filtro."></ac-empty-state>
          ` : ''}
        `}
      </div>
    `;
  }
}
