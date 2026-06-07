import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ac-total-valuation')
export class AcTotalValuation extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-6);
    }

    .label {
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .divider {
      width: 1px;
      height: 32px;
      background: var(--color-border);
      flex-shrink: 0;
    }

    .amounts {
      display: flex;
      align-items: baseline;
      gap: var(--space-5);
      flex: 1;
      min-width: 0;
      flex-wrap: wrap;
    }

    .amount-ars {
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--color-text);
      letter-spacing: -0.03em;
      white-space: nowrap;
    }

    .amount-usd {
      font-size: var(--text-base);
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    @media (max-width: 600px) {
      :host { padding: var(--space-3) var(--space-4); gap: var(--space-4); }
      .amount-ars { font-size: var(--text-2xl); }
    }
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
      <div class="divider"></div>
      <div class="amounts">
        <span class="amount-ars">${this._fmt(this.totalArs, 'ARS')}</span>
        <span class="amount-usd">≈ ${this._fmt(this.totalUsd, 'USD')}</span>
      </div>
    `;
  }
}
