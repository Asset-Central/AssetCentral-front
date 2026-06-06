import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Asset, AssetType } from '@/types/asset';
import './ac-asset-card';
import '@/components/common/ac-empty-state';

const ALL_TYPES: AssetType[] = ['CEDEAR', 'BONO', 'FCI', 'USD', 'ACCION', 'CRYPTO', 'OTRO'];

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
  `;

  @property({ type: Array }) assets: Asset[] = [];
  @property({ type: Boolean }) compact = false;

  @state() private _query = '';
  @state() private _activeType: AssetType | null = null;

  private get _filtered(): Asset[] {
    return this.assets.filter((a) => {
      const matchType = !this._activeType || a.type === this._activeType;
      const q = this._query.toLowerCase();
      const matchQuery = !q || a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }

  render() {
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

      ${this._filtered.length === 0
        ? html`<ac-empty-state icon="◎" title="Sin activos" message="No hay activos que coincidan con el filtro."></ac-empty-state>`
        : html`<div class="list">${this._filtered.map((a) => html`<ac-asset-card .asset="${a}"></ac-asset-card>`)}</div>`
      }
    `;
  }
}
