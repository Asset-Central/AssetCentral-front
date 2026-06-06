import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PlatformConfig } from '@/types/account';
import '@/components/common/ac-button';

@customElement('ac-credential-form')
export class AcCredentialForm extends LitElement {
  static styles = css`
    :host { display: block; }
    form { display: flex; flex-direction: column; gap: var(--space-4); }
    label { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--text-sm); font-weight: 500; }
    input {
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
    }
    input:focus { outline: 2px solid var(--color-primary); }
    .actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-2); }
    .error { color: var(--color-danger); font-size: var(--text-sm); }
  `;

  @property({ type: Object }) config!: PlatformConfig;
  @state() private _values: Record<string, string> = {};
  @state() private _loading = false;
  @state() private _error = '';

  private _set(name: string, value: string) {
    this._values = { ...this._values, [name]: value };
  }

  private async _submit(e: Event) {
    e.preventDefault();
    this._loading = true;
    this._error = '';
    this.dispatchEvent(
      new CustomEvent('ac-submit-credentials', {
        detail: { platform: this.config.platform, credentials: { ...this._values } },
        bubbles: true, composed: true,
      })
    );
  }

  private _cancel() {
    this.dispatchEvent(new CustomEvent('ac-cancel', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <form @submit="${this._submit}">
        ${this.config?.fields.map(
          (f) => html`
            <label>
              ${f.label}
              <input
                type="${f.type}"
                placeholder="${f.placeholder ?? ''}"
                .value="${this._values[f.name] ?? ''}"
                @input="${(e: InputEvent) => this._set(f.name, (e.target as HTMLInputElement).value)}"
                required
                autocomplete="off"
              />
            </label>
          `
        )}
        ${this._error ? html`<span class="error">${this._error}</span>` : ''}
        <div class="actions">
          <ac-button variant="ghost" type="button" @click="${this._cancel}">Cancelar</ac-button>
          <ac-button variant="primary" type="submit" ?disabled="${this._loading}">
            ${this._loading ? 'Vinculando...' : 'Vincular cuenta'}
          </ac-button>
        </div>
      </form>
    `;
  }
}
