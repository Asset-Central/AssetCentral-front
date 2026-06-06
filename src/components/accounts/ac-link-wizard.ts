import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { PlatformConfig } from '@/types/account';
import { fetchPlatformConfigs, linkAccount } from '@/services/account.service';
import './ac-credential-form';
import '@/components/common/ac-spinner';
import '@/components/common/ac-button';

type WizardStep = 'select' | 'credentials';

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
  `;

  @state() private _step: WizardStep = 'select';
  @state() private _platforms: PlatformConfig[] = [];
  @state() private _selected?: PlatformConfig;
  @state() private _loading = true;

  async connectedCallback() {
    super.connectedCallback();
    this._platforms = await fetchPlatformConfigs();
    this._loading = false;
  }

  private _select(p: PlatformConfig) {
    this._selected = p;
    this._step = 'credentials';
  }

  private async _onSubmit(e: CustomEvent) {
    const { platform, credentials } = e.detail;
    try {
      const account = await linkAccount(platform, credentials);
      this.dispatchEvent(new CustomEvent('ac-account-linked', { detail: account, bubbles: true, composed: true }));
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    if (this._loading) return html`<ac-spinner></ac-spinner>`;

    if (this._step === 'credentials' && this._selected) {
      return html`
        <div class="back">
          <ac-button variant="ghost" @click="${() => (this._step = 'select')}">← Volver</ac-button>
        </div>
        <ac-credential-form
          .config="${this._selected}"
          @ac-submit-credentials="${this._onSubmit}"
          @ac-cancel="${() => (this._step = 'select')}"
        ></ac-credential-form>
      `;
    }

    return html`
      <div class="platforms">
        ${this._platforms.map(
          (p) => html`
            <button class="platform-btn" @click="${() => this._select(p)}">
              ${p.displayName}
            </button>
          `
        )}
      </div>
    `;
  }
}
