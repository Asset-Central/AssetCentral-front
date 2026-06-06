import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ac-total-valuation')
export class AcTotalValuation extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }
    .label {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      margin-bottom: var(--space-2);
    }
    .amount-ars {
      font-size: var(--text-4xl);
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--color-text);
      letter-spacing: -0.03em;
    }
    .amount-usd {
      font-size: var(--text-sm);
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }
    .currency { color: var(--color-text-subtle); font-size: var(--text-xl); }
  `;

  @property({ type: Number }) totalArs = 0;
  @property({ type: Number }) totalUsd = 0;

  private _fmt(n: number, currency: string) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  }

  render() {
    return html`
      <div class="label">Valuación total</div>
      <div class="amount-ars">${this._fmt(this.totalArs, 'ARS')}</div>
      <div class="amount-usd">≈ ${this._fmt(this.totalUsd, 'USD')}</div>
    `;
  }
}
