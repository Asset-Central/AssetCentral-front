import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Asset } from '@/types/asset';
import type { Portfolio } from '@/types/portfolio';
import '@/components/common/ac-button';

@customElement('ac-portfolio-form')
export class AcPortfolioForm extends LitElement {
  static styles = css`
    :host { display: block; }
    form { display: flex; flex-direction: column; gap: var(--space-4); }
    label { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--text-sm); font-weight: 500; }
    input, textarea {
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans); font-size: var(--text-sm);
    }
    input:focus, textarea:focus { outline: 2px solid var(--color-primary); }
    textarea { min-height: 80px; resize: vertical; }
    .asset-select { display: flex; flex-direction: column; gap: var(--space-2); max-height: 160px; overflow-y: auto; }
    .asset-option {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: var(--text-sm); cursor: pointer;
    }
    .actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
  `;

  @property({ type: Array }) availableAssets: Asset[] = [];
  @property({ type: Object }) initial?: Partial<Portfolio>;

  @state() private _name = '';
  @state() private _description = '';
  @state() private _selectedIds = new Set<string>();

  connectedCallback() {
    super.connectedCallback();
    if (this.initial) {
      this._name = this.initial.name ?? '';
      this._description = this.initial.description ?? '';
      this._selectedIds = new Set(this.initial.assetIds ?? []);
    }
  }

  private _toggleAsset(id: string) {
    const s = new Set(this._selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    this._selectedIds = s;
  }

  private _submit(e: Event) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('ac-portfolio-submit', {
      detail: { name: this._name, description: this._description, assetIds: Array.from(this._selectedIds) },
      bubbles: true, composed: true,
    }));
  }

  render() {
    return html`
      <form @submit="${this._submit}">
        <label>
          Nombre
          <input type="text" .value="${this._name}" @input="${(e: InputEvent) => (this._name = (e.target as HTMLInputElement).value)}" required placeholder="Ej: Dólares y Bonos" />
        </label>
        <label>
          Descripción (opcional)
          <textarea .value="${this._description}" @input="${(e: InputEvent) => (this._description = (e.target as HTMLTextAreaElement).value)}" placeholder="Descripción del portfolio..."></textarea>
        </label>
        <label>
          Activos incluidos
          <div class="asset-select">
            ${this.availableAssets.map(
              (a) => html`
                <label class="asset-option">
                  <input type="checkbox" .checked="${this._selectedIds.has(a.id)}" @change="${() => this._toggleAsset(a.id)}" />
                  ${a.ticker} — ${a.name}
                </label>
              `
            )}
          </div>
        </label>
        <div class="actions">
          <ac-button variant="ghost" type="button" @click="${() => this.dispatchEvent(new CustomEvent('ac-cancel', { bubbles: true, composed: true }))}">Cancelar</ac-button>
          <ac-button variant="primary" type="submit">Guardar</ac-button>
        </div>
      </form>
    `;
  }
}
