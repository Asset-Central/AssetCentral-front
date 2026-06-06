import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ac-empty-state')
export class AcEmptyState extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      gap: var(--space-3);
      color: var(--color-text-muted);
      text-align: center;
    }
    .icon { font-size: 2.5rem; }
    .title { font-size: var(--text-lg); font-weight: 600; color: var(--color-text); }
    .message { font-size: var(--text-sm); }
  `;

  @property() icon = '○';
  @property() title = 'Sin datos';
  @property() message = '';

  render() {
    return html`
      <span class="icon">${this.icon}</span>
      <span class="title">${this.title}</span>
      ${this.message ? html`<span class="message">${this.message}</span>` : ''}
    `;
  }
}
