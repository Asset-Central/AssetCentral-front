import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Asset } from '@/types/asset';
import './ac-asset-type-badge';

@customElement('ac-asset-card')
export class AcAssetCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      transition: border-color var(--transition-fast);
    }
    :host(:hover) { border-color: var(--color-primary); }

    .row { display: flex; align-items: center; justify-content: space-between; }
    .left { display: flex; align-items: center; gap: var(--space-3); }

    .ticker {
      font-weight: 700;
      font-size: var(--text-base);
    }
    .name {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .total {
      font-family: var(--font-mono);
      font-size: var(--text-base);
      font-weight: 600;
      text-align: right;
    }
    .change {
      font-size: var(--text-xs);
      font-family: var(--font-mono);
      text-align: right;
      margin-top: 2px;
    }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
  `;

  @property({ type: Object }) asset!: Asset;

  render() {
    const { ticker, name, type, totalArs, dailyChangePercent } = this.asset;
    const sign = dailyChangePercent >= 0 ? '+' : '';
    const cls = dailyChangePercent >= 0 ? 'positive' : 'negative';
    const fmtArs = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalArs);

    return html`
      <div class="row">
        <div class="left">
          <ac-asset-type-badge .type="${type}"></ac-asset-type-badge>
          <div>
            <div class="ticker">${ticker}</div>
            <div class="name">${name}</div>
          </div>
        </div>
        <div>
          <div class="total">${fmtArs}</div>
          <div class="change ${cls}">${sign}${dailyChangePercent.toFixed(2)}%</div>
        </div>
      </div>
    `;
  }
}
