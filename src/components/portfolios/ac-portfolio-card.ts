import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PortfolioSummary } from '@/types/portfolio';

@customElement('ac-portfolio-card')
export class AcPortfolioCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      cursor: pointer;
      transition: border-color var(--transition-fast);
    }
    :host(:hover) { border-color: var(--color-primary); }
    .name { font-size: var(--text-lg); font-weight: 700; }
    .desc { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
    .stats { display: flex; gap: var(--space-6); margin-top: var(--space-4); }
    .stat-label { font-size: var(--text-xs); color: var(--color-text-subtle); }
    .stat-value { font-family: var(--font-mono); font-weight: 600; font-size: var(--text-sm); }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
  `;

  @property({ type: Object }) summary!: PortfolioSummary;

  private _navigate() {
    window.location.href = `/portfolios/${this.summary.portfolio.id}`;
  }

  render() {
    const { portfolio, totalArs, dailyChangePercent } = this.summary;
    const fmtArs = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalArs);
    const sign = dailyChangePercent >= 0 ? '+' : '';
    const cls = dailyChangePercent >= 0 ? 'positive' : 'negative';

    return html`
      <div @click="${this._navigate}">
        <div class="name">${portfolio.name}</div>
        ${portfolio.description ? html`<div class="desc">${portfolio.description}</div>` : ''}
        <div class="stats">
          <div>
            <div class="stat-label">Valuación</div>
            <div class="stat-value">${fmtArs}</div>
          </div>
          <div>
            <div class="stat-label">Variación diaria</div>
            <div class="stat-value ${cls}">${sign}${dailyChangePercent.toFixed(2)}%</div>
          </div>
          <div>
            <div class="stat-label">Activos</div>
            <div class="stat-value">${this.summary.assets.length}</div>
          </div>
        </div>
      </div>
    `;
  }
}
