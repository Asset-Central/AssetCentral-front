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
  `;

  @property({ type: Object }) summary!: PortfolioSummary;

  private _navigate() {
    window.location.href = `/portfolios/${this.summary.portfolio.id}`;
  }

  render() {
    const { portfolio, total_ars, total_usd, assets } = this.summary;
    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

    return html`
      <div @click="${this._navigate}">
        <div class="name">${portfolio.name}</div>
        ${portfolio.description ? html`<div class="desc">${portfolio.description}</div>` : ''}
        <div class="stats">
          <div>
            <div class="stat-label">ARS</div>
            <div class="stat-value">$ ${fmt.format(total_ars)}</div>
          </div>
          <div>
            <div class="stat-label">USD</div>
            <div class="stat-value">U$ ${fmt.format(total_usd)}</div>
          </div>
          <div>
            <div class="stat-label">Activos</div>
            <div class="stat-value">${assets.length}</div>
          </div>
        </div>
      </div>
    `;
  }
}
