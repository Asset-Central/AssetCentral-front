import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';
import type { Asset, AssetType } from '@/types/asset';
import './ac-asset-card';
import '@/components/common/ac-empty-state';
import '@/components/common/ac-spinner';

const ALL_TYPES: AssetType[] = ['cedear', 'bono', 'fci', 'cash', 'crypto', 'stock'];

@customElement('ac-asset-list')
export class AcAssetList extends LitElement {
  static styles = css`
    :host { display: block; }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
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

    .list { display: flex; flex-direction: column; gap: var(--space-2); }

    .section-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: var(--space-2) 0 var(--space-1);
    }
  `;

  @consume({ context: appContext, subscribe: true })
  @state() private _app?: AppState;

  @property({ type: Array }) assets: Asset[] = [];
  @property({ type: Boolean }) compact = false;

  @state() private _query = '';
  @state() private _activeType: AssetType | null = null;
  @state() private _openTickers = new Set<string>();

  private get _source(): Asset[] {
    return this.assets.length > 0 ? this.assets : (this._app?.assets ?? []);
  }

  connectedCallback() {
    super.connectedCallback();
    // Auto-open a ticker passed via ?open=TICKER (e.g. from treemap click)
    const open = new URLSearchParams(window.location.search).get('open');
    if (open) {
      this._openTickers = new Set([open]);
      history.replaceState(null, '', window.location.pathname);
    }
  }

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

  /** Open cards: always shown, sorted alphabetically */
  private get _openAssets(): Asset[] {
    return this._source
      .filter(a => this._openTickers.has(a.ticker))
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  /** Closed cards: filtered by search/type, sorted alphabetically */
  private get _closedAssets(): Asset[] {
    return this._source
      .filter(a => !this._openTickers.has(a.ticker))
      .filter(a => {
        const matchType = !this._activeType || a.asset_type === this._activeType;
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
    const closedAssets = this._closedAssets;
    const anyOpen      = openAssets.length > 0;
    const anyClosed    = closedAssets.length > 0;

    return html`
      ${!this.compact ? html`
        <div class="toolbar">
          <input
            type="search"
            placeholder="Buscar por ticker o nombre..."
            .value="${this._query}"
            @input="${(e: InputEvent) => (this._query = (e.target as HTMLInputElement).value)}"
          />
          <div class="filters">
            ${ALL_TYPES.map(
              (t) => html`
                <button
                  class="filter-btn ${this._activeType === t ? 'active' : ''}"
                  @click="${() => (this._activeType = this._activeType === t ? null : t)}"
                >${t}</button>
              `
            )}
          </div>
        </div>
      ` : ''}

      <div class="list" @toggle-open="${this._onToggleOpen}">
        ${anyOpen ? html`
          ${!this.compact && anyClosed ? html`<div class="section-label">Abiertos</div>` : ''}
          ${openAssets.map(a => html`
            <ac-asset-card .asset="${a}" .open="${true}"></ac-asset-card>
          `)}
        ` : ''}

        ${anyClosed ? html`
          ${!this.compact && anyOpen ? html`<div class="section-label">Cerrados</div>` : ''}
          ${closedAssets.map(a => html`
            <ac-asset-card .asset="${a}" .open="${false}"></ac-asset-card>
          `)}
        ` : ''}

        ${!anyOpen && !anyClosed
          ? html`<ac-empty-state icon="◎" title="Sin activos" message="No hay activos que coincidan con el filtro."></ac-empty-state>`
          : ''}
      </div>
    `;
  }
}
