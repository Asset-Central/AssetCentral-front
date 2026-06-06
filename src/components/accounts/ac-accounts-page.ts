import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';
import { unlinkAccount } from '@/services/account.service';
import type { Account } from '@/types/account';
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
  @state() private _reconnectPlatform?: string;

  private _refresh() {
    window.dispatchEvent(new CustomEvent('ac-data-refresh'));
  }

  private async _unlink(e: CustomEvent) {
    const account: Account = e.detail;
    await unlinkAccount(account.id);
    this._refresh();
  }

  private _onAccountLinked() {
    this._showWizard = false;
    this._reconnectPlatform = undefined;
    this._refresh();
  }

  private _openWizard() {
    this._reconnectPlatform = undefined;
    this._showWizard = true;
  }

  private _onReconnect(e: CustomEvent) {
    const account: Account = e.detail;
    this._reconnectPlatform = account.platform;
    this._showWizard = true;
  }

  private _closeWizard() {
    this._showWizard = false;
    this._reconnectPlatform = undefined;
  }

  render() {
    const accounts = this._app?.accounts ?? [];
    const wizardTitle = this._reconnectPlatform ? 'Reconectar cuenta' : 'Vincular cuenta';

    return html`
      <div class="header">
        <h1>Cuentas vinculadas</h1>
        <ac-button @click="${this._openWizard}">+ Vincular cuenta</ac-button>
      </div>

      ${accounts.length === 0
        ? html`<ac-empty-state icon="◉" title="Sin cuentas vinculadas" message="Vinculá tu primera plataforma para empezar."></ac-empty-state>`
        : html`
          <div class="list">
            ${accounts.map(a => html`
              <ac-account-card
                .account="${a}"
                @ac-unlink="${this._unlink}"
                @ac-reconnect="${this._onReconnect}"
              ></ac-account-card>
            `)}
          </div>
        `}

      <ac-modal
        .open="${this._showWizard}"
        title="${wizardTitle}"
        @ac-modal-close="${this._closeWizard}"
      >
        <ac-link-wizard
          .prefillPlatform="${this._reconnectPlatform}"
          @ac-account-linked="${this._onAccountLinked}"
          @ac-cancel="${this._closeWizard}"
        ></ac-link-wizard>
      </ac-modal>
    `;
  }
}
