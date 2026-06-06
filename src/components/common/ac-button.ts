import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@customElement('ac-button')
export class AcButton extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    button {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: none; border-radius: var(--radius-md);
      font-family: var(--font-sans); font-size: var(--text-sm); font-weight: 500;
      cursor: pointer; transition: opacity var(--transition-fast), background var(--transition-fast);
    }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
    .primary  { background: var(--color-primary); color: #fff; }
    .primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .secondary { background: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border); }
    .secondary:hover:not(:disabled) { background: var(--color-border); }
    .danger   { background: var(--color-danger); color: #fff; }
    .ghost    { background: transparent; color: var(--color-text-muted); }
    .ghost:hover:not(:disabled) { color: var(--color-text); background: var(--color-surface-raised); }
  `;

  @property() variant: ButtonVariant = 'primary';
  @property({ type: Boolean }) disabled = false;

  render() {
    return html`
      <button class="${this.variant}" ?disabled="${this.disabled}">
        <slot></slot>
      </button>
    `;
  }
}
