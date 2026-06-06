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
    input:disabled { opacity: 0.5; cursor: not-allowed; }
    .actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-2); }
    .error {
      display: flex; align-items: flex-start; gap: var(--space-2);
      color: var(--color-danger); font-size: var(--text-sm);
      background: color-mix(in srgb, var(--color-danger) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-3);
    }
    .loading-hint {
      font-size: var(--text-xs); color: var(--color-text-muted);
      text-align: center; padding: var(--space-1) 0;
    }
  `;

  @property({ type: Object }) config!: PlatformConfig;
  @property({ type: Boolean }) submitting = false;
  @property({ type: String }) error = '';

  @state() private _values: Record<string, string> = {};

  private _set(name: string, value: string) {
    this._values = { ...this._values, [name]: value };
  }

  private _submit(e: Event) {
    e.preventDefault();
    if (this.submitting) return;
    // Validar que todos los campos requeridos tengan valor
    const missing = (this.config?.fields ?? []).some(f => !this._values[f.name]?.trim());
    if (missing) return;
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
        ${this.config?.fields.map(f => html`
          <label>
            ${f.label}
            <input
              type="${f.type}"
              placeholder="${f.placeholder ?? ''}"
              .value="${this._values[f.name] ?? ''}"
              @input="${(e: InputEvent) => this._set(f.name, (e.target as HTMLInputElement).value)}"
              ?disabled="${this.submitting}"
              required
              autocomplete="off"
            />
          </label>
        `)}
        ${this.error ? html`<div class="error">⚠ ${this.error}</div>` : ''}
        ${this.submitting ? html`<div class="loading-hint">Verificando credenciales…</div>` : ''}
        <div class="actions">
          <ac-button variant="ghost" ?disabled="${this.submitting}" @click="${this._cancel}">Cancelar</ac-button>
          <!-- ac-button vive en shadow DOM y no dispara submit del form nativo,
               por eso usamos @click que llama _submit directamente -->
          <ac-button variant="primary" ?disabled="${this.submitting}" @click="${this._submit}">
            ${this.submitting ? 'Verificando…' : 'Vincular cuenta'}
          </ac-button>
        </div>
      </form>
    `;
  }
}
