import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('ac-spinner')
export class AcSpinner extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    .spinner {
      width: 24px; height: 24px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary-light);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  render() { return html`<div class="spinner"></div>`; }
}
