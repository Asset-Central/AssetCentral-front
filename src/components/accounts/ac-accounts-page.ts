import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';
import { unlinkAccount } from '@/services/account.service';
import type { LinkedAccount } from '@/types/account';
import './ac-account-card';
import './ac-link-wizard';
import '@/components/common/ac-modal';
import '@/components/common/ac-button';
import '@/components/common/ac-empty-state';

@customElement('ac-accounts-page')
export class AcAccountsPage extends LitElement {
  static styles = css`
    :host { display: block; }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-6);
    }
    h1 { font-size: var(--text-2xl); font-weight: 700; }
    .list { display: flex; flex-direction: column; gap: var(--space-3); }
  `;

  @consume({ context: appContext, subscribe: true })
  @state()
  private _app!: AppState;

  @state() private _showWizard = false;

  private async _unlink(e: CustomEvent) {
    const account: LinkedAccount = e.detail;
    await unlinkAccount(account.id);
    // El re-fetch lo debería disparar el provider en ac-app
  }

  private _onAccountLinked() {
    this._showWizard = false;
    // El re-fetch lo maneja ac-app
  }

  render() {
    const accounts = this._app?.accounts ?? [];
    return html`
      <div class="header">
        <h1>Cuentas vinculadas</h1>
        <ac-button @click="${() => (this._showWizard = true)}">+ Vincular cuenta</ac-button>
      </div>

      ${accounts.length === 0
        ? html`<ac-empty-state icon="◉" title="Sin cuentas vinculadas" message="Vinculá tu primera plataforma para empezar."></ac-empty-state>`
        : html`
          <div class="list">
            ${accounts.map(
              (a) => html`<ac-account-card .account="${a}" @ac-unlink="${this._unlink}"></ac-account-card>`
            )}
          </div>
        `}

      <ac-modal
        .open="${this._showWizard}"
        title="Vincular cuenta"
        @ac-modal-close="${() => (this._showWizard = false)}"
      >
        <ac-link-wizard @ac-account-linked="${this._onAccountLinked}"></ac-link-wizard>
      </ac-modal>
    `;
  }
}
