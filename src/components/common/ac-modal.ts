import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ac-modal')
export class AcModal extends LitElement {
  static styles = css`
    :host { display: contents; }
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
    }
    .dialog {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      min-width: 400px;
      max-width: 90vw;
      box-shadow: var(--shadow-lg);
    }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-5);
    }
    .title { font-size: var(--text-lg); font-weight: 600; }
    .close { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: var(--text-lg); }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @property() title = '';

  private _close() {
    this.dispatchEvent(new CustomEvent('ac-modal-close', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="backdrop" @click="${this._close}">
        <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
          <div class="header">
            <span class="title">${this.title}</span>
            <button class="close" @click="${this._close}">✕</button>
          </div>
          <slot></slot>
        </div>
      </div>
    `;
  }
}
