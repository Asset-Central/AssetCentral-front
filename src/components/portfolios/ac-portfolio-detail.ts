import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { Router } from '@vaadin/router';
import { appContext, type AppState } from '@/store/app.context';
import { fetchPortfolioSummary, updatePortfolio, deletePortfolio } from '@/services/portfolio.service';
import type { PortfolioSummary, PortfolioAssetSummary } from '@/types/portfolio';
import type { Asset } from '@/types/asset';
import '@/components/assets/ac-asset-list';
import '@/components/common/ac-spinner';
import '@/components/common/ac-button';
import '@/components/common/ac-modal';
import './ac-portfolio-form';

/** Convierte un PortfolioAssetSummary al shape que espera ac-asset-list */
function toAsset(a: PortfolioAssetSummary): Asset {
  return {
    ticker: a.ticker,
    name: a.name,
    asset_type: a.asset_type as Asset['asset_type'],
    platform: a.platform as Asset['platform'],
    currency: a.currency,
    account_id: '',
    quantity: a.total_quantity,
    unit_price: a.unit_price,
    total_valuation: a.total_valuation,
  };
}

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
  `;

  @consume({ context: appContext, subscribe: true })
  @state()
  private _app!: AppState;

  @state() private _summary?: PortfolioSummary;
  @state() private _loading = true;
  @state() private _showEdit = false;

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

    const { portfolio, total_ars, total_usd, assets } = this._summary;
    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
    const assetList = assets.map(toAsset);

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
          <div class="stat-label">Total ARS</div>
          <div class="stat-value">$ ${fmt.format(total_ars)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total USD</div>
          <div class="stat-value">U$ ${fmt.format(total_usd)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Activos</div>
          <div class="stat-value">${assets.length}</div>
        </div>
      </div>

      <ac-asset-list .assets="${assetList}"></ac-asset-list>

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
