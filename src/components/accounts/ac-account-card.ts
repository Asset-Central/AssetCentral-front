import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { LinkedAccount } from '@/types/account';

const STATUS_LABEL: Record<LinkedAccount['status'], string> = {
  CONNECTED:    'Conectada',
  ERROR:        'Error',
  PENDING:      'Sincronizando...',
  DISCONNECTED: 'Desconectada',
};

@customElement('ac-account-card')
export class AcAccountCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
    }
    .row { display: flex; align-items: center; justify-content: space-between; }
    .platform { font-weight: 700; }
    .label { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }
    .status {
      display: inline-flex; align-items: center; gap: var(--space-1);
      font-size: var(--text-xs); font-weight: 600;
      padding: 2px var(--space-2); border-radius: var(--radius-full);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .CONNECTED    .dot { background: var(--color-success); }
    .ERROR        .dot { background: var(--color-danger); }
    .PENDING      .dot { background: var(--color-warning); }
    .DISCONNECTED .dot { background: var(--color-text-subtle); }
    .CONNECTED    { color: var(--color-success); }
    .ERROR        { color: var(--color-danger); }
    .PENDING      { color: var(--color-warning); }
    .DISCONNECTED { color: var(--color-text-subtle); }
    .actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
    button {
      font-size: var(--text-xs); padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-md); cursor: pointer; border: 1px solid var(--color-border);
      background: transparent; color: var(--color-text-muted);
      transition: all var(--transition-fast);
    }
    button:hover { color: var(--color-text); background: var(--color-surface-raised); }
    button.danger:hover { color: var(--color-danger); border-color: var(--color-danger); }
  `;

  @property({ type: Object }) account!: LinkedAccount;

  private _unlink() {
    this.dispatchEvent(new CustomEvent('ac-unlink', { detail: this.account, bubbles: true, composed: true }));
  }

  private _sync() {
    this.dispatchEvent(new CustomEvent('ac-sync', { detail: this.account, bubbles: true, composed: true }));
  }

  render() {
    const { platform, label, status, lastSyncAt } = this.account;
    const syncDate = lastSyncAt ? new Date(lastSyncAt).toLocaleString('es-AR') : 'Nunca';
    return html`
      <div class="row">
        <div>
          <div class="platform">${platform}</div>
          <div class="label">${label} · Última sync: ${syncDate}</div>
        </div>
        <span class="status ${status}">
          <span class="dot"></span>
          ${STATUS_LABEL[status]}
        </span>
      </div>
      <div class="actions">
        <button @click="${this._sync}">Sincronizar</button>
        <button class="danger" @click="${this._unlink}">Desvincular</button>
      </div>
    `;
  }
}
