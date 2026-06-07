import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PlatformConfig } from '@/types/account';
import { fetchPlatformConfigs, linkAccount } from '@/services/account.service';
import './ac-credential-form';
import '@/components/common/ac-spinner';
import '@/components/common/ac-button';

type WizardStep = 'select' | 'name' | 'credentials';

@customElement('ac-link-wizard')
export class AcLinkWizard extends LitElement {
  static styles = css`
    :host { display: block; }
    .platforms { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-3); }
    .platform-btn {
      padding: var(--space-4);
      background: var(--color-surface-raised);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 600;
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      text-align: center;
      transition: all var(--transition-fast);
    }
    .platform-btn:hover { border-color: var(--color-primary-light); color: var(--color-primary-light); }
    .back { margin-bottom: var(--space-4); }
    .name-step { display: flex; flex-direction: column; gap: var(--space-4); }
    .name-step label { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--text-sm); font-weight: 500; }
    .name-step input {
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
    }
    .name-step input:focus { outline: 2px solid var(--color-primary); }
    .name-step .actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-2); }
  `;

  /** Cuando se pasa, salta la selección de plataforma (flujo reconectar). */
  @property({ type: String }) prefillPlatform?: string;

  @state() private _step: WizardStep = 'select';
  @state() private _platforms: PlatformConfig[] = [];
  @state() private _selected?: PlatformConfig;
  @state() private _nombre = '';
  @state() private _loading = true;
  @state() private _submitting = false;
  @state() private _formError = '';

  async connectedCallback() {
    super.connectedCallback();
    this._platforms = await fetchPlatformConfigs();
    this._loading = false;

    // Si ya viene con plataforma pre-seleccionada (reconectar), saltamos al form
    if (this.prefillPlatform) {
      const found = this._platforms.find(p => p.platform === this.prefillPlatform);
      if (found) {
        this._selected = found;
        this._nombre = found.display_name;
        this._step = 'credentials';
      }
    }
  }

  private _select(p: PlatformConfig) {
    this._selected = p;
    this._nombre = p.display_name;
    this._formError = '';
    this._step = 'name';
  }

  private async _onSubmit(e: CustomEvent) {
    const { platform, credentials } = e.detail;
    this._submitting = true;
    this._formError = '';
    try {
      const account = await linkAccount(platform, this._nombre, credentials);
      this.dispatchEvent(new CustomEvent('ac-account-linked', {
        detail: account, bubbles: true, composed: true,
      }));
    } catch (err) {
      this._formError = err instanceof Error ? err.message : 'Error al vincular la cuenta';
    } finally {
      this._submitting = false;
    }
  }

  render() {
    if (this._loading) return html`<ac-spinner></ac-spinner>`;

    if (this._step === 'name' && this._selected) {
      return html`
        <div class="back">
          <ac-button variant="ghost" @click="${() => { this._step = 'select'; this._formError = ''; }}">← Volver</ac-button>
        </div>
        <div class="name-step">
          <label>
            Nombre de la cuenta
            <input
              type="text"
              .value="${this._nombre}"
              @input="${(e: InputEvent) => this._nombre = (e.target as HTMLInputElement).value}"
              placeholder="${this._selected.display_name}"
              autocomplete="off"
            />
          </label>
          <div class="actions">
            <ac-button variant="ghost" @click="${() => this.dispatchEvent(new CustomEvent('ac-cancel', { bubbles: true, composed: true }))}">Cancelar</ac-button>
            <ac-button variant="primary" @click="${() => { this._step = 'credentials'; }}">Continuar</ac-button>
          </div>
        </div>
      `;
    }

    if (this._step === 'credentials' && this._selected) {
      return html`
        ${!this.prefillPlatform ? html`
          <div class="back">
            <ac-button variant="ghost" @click="${() => { this._step = 'name'; this._formError = ''; }}">← Volver</ac-button>
          </div>
        ` : ''}
        <ac-credential-form
          .config="${this._selected}"
          .submitting="${this._submitting}"
          .error="${this._formError}"
          @ac-submit-credentials="${this._onSubmit}"
          @ac-cancel="${() => this.dispatchEvent(new CustomEvent('ac-cancel', { bubbles: true, composed: true }))}"
        ></ac-credential-form>
      `;
    }

    return html`
      <div class="platforms">
        ${this._platforms.map(p => html`
          <button class="platform-btn" @click="${() => this._select(p)}">
            ${p.display_name}
          </button>
        `)}
      </div>
    `;
  }
}
