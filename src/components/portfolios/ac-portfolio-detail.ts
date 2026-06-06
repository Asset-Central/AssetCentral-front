import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { Router } from '@vaadin/router';
import { appContext, type AppState } from '@/store/app.context';
import { fetchPortfolioSummary, updatePortfolio, deletePortfolio } from '@/services/portfolio.service';
import type { PortfolioSummary } from '@/types/portfolio';
import '@/components/assets/ac-asset-list';
import '@/components/common/ac-spinner';
import '@/components/common/ac-button';
import '@/components/common/ac-modal';
import './ac-portfolio-form';

@customElement('ac-portfolio-detail')
export class AcPortfolioDetail extends LitElement {
  static styles = css`
    :host { display: block; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); }
    h1 { font-size: var(--text-2xl); font-weight: 700; }
    .actions { display: flex; gap: var(--space-3); }
    .stats { display: flex; gap: var(--space-6); margin-bottom: var(--space-6); }
    .stat { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); }
    .stat-label { font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-1); }
    .stat-value { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: 700; }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
  `;

  @consume({ context: appContext, subscribe: true })
  @state()
  private _app!: AppState;

  @state() private _summary?: PortfolioSummary;
  @state() private _loading = true;
  @state() private _showEdit = false;

  // @vaadin/router inyecta location en el elemento
  location?: { params: { id: string } };

  async connectedCallback() {
    super.connectedCallback();
    const id = this.location?.params?.id;
    if (id) {
      this._summary = await fetchPortfolioSummary(id);
    }
    this._loading = false;
  }

  private async _delete() {
    if (!this._summary) return;
    if (!confirm(`¿Eliminar el portfolio "${this._summary.portfolio.name}"?`)) return;
    await deletePortfolio(this._summary.portfolio.id);
    Router.go('/portfolios');
  }

  private async _onEdit(e: CustomEvent) {
    if (!this._summary) return;
    await updatePortfolio(this._summary.portfolio.id, e.detail);
    this._showEdit = false;
  }

  render() {
    if (this._loading) return html`<ac-spinner></ac-spinner>`;
    if (!this._summary) return html`<p>Portfolio no encontrado.</p>`;

    const { portfolio, totalArs, dailyChangePercent, assets } = this._summary;
    const fmtArs = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalArs);
    const sign = dailyChangePercent >= 0 ? '+' : '';
    const cls = dailyChangePercent >= 0 ? 'positive' : 'negative';

    return html`
      <div class="header">
        <h1>${portfolio.name}</h1>
        <div class="actions">
          <ac-button variant="secondary" @click="${() => (this._showEdit = true)}">Editar</ac-button>
          <ac-button variant="danger" @click="${this._delete}">Eliminar</ac-button>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-label">Valuación total</div>
          <div class="stat-value">${fmtArs}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Variación diaria</div>
          <div class="stat-value ${cls}">${sign}${dailyChangePercent.toFixed(2)}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">Activos</div>
          <div class="stat-value">${assets.length}</div>
        </div>
      </div>

      <ac-asset-list .assets="${assets}"></ac-asset-list>

      <ac-modal .open="${this._showEdit}" title="Editar portfolio" @ac-modal-close="${() => (this._showEdit = false)}">
        <ac-portfolio-form
          .availableAssets="${this._app?.assets ?? []}"
          .initial="${portfolio}"
          @ac-portfolio-submit="${this._onEdit}"
          @ac-cancel="${() => (this._showEdit = false)}"
        ></ac-portfolio-form>
      </ac-modal>
    `;
  }
}
