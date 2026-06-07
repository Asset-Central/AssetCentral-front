import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { Router, type RouterLocation } from '@vaadin/router';
import { appContext, type AppState } from '@/store/app.context';
import { fetchPortfolioSummary, updatePortfolio, deletePortfolio } from '@/services/portfolio.service';
import type { PortfolioSummary, PortfolioAssetSummary } from '@/types/portfolio';
import type { Asset } from '@/types/asset';
import '@/components/assets/ac-asset-list';
import '@/components/dashboard/ac-treemap';
import '@/components/dashboard/ac-value-chart';
import '@/components/common/ac-spinner';
import '@/components/common/ac-button';
import '@/components/common/ac-modal';
import './ac-portfolio-form';

/** Convierte PortfolioAssetSummary al shape de Asset enriquecido con daily_change_pct */
function toAsset(a: PortfolioAssetSummary, appAssets: Asset[]): Asset {
  const live = appAssets.find(x => x.ticker === a.ticker);
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
    daily_change_pct: live?.daily_change_pct,
  };
}

@customElement('ac-portfolio-detail')
export class AcPortfolioDetail extends LitElement {
  static styles = css`
    :host { display: block; }

    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-6);
      flex-wrap: wrap; gap: var(--space-3);
    }
    h1 { font-size: var(--text-2xl); font-weight: 700; }
    .actions { display: flex; gap: var(--space-3); }

    .stats {
      display: flex; gap: var(--space-4);
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
    }
    .stat {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      min-width: 120px;
    }
    .stat-label { font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-1); }
    .stat-value { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: 700; }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    ac-treemap { margin-bottom: var(--space-6); }

    .section-title {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: var(--space-3);
      margin-top: var(--space-6);
    }
  `;

  @consume({ context: appContext, subscribe: true })
  @state()
  private _app!: AppState;

  @state() private _summary?: PortfolioSummary;
  @state() private _loading = true;
  @state() private _showEdit = false;

  // Called by Vaadin Router on every navigation (initial load + back/forward)
  async onAfterEnter(location: RouterLocation) {
    const id = location.params.id as string;
    await this._load(id);
  }

  private async _load(id: string) {
    this._loading = true;
    this._summary = await fetchPortfolioSummary(id);
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
    const id = this._summary.portfolio.id;
    await updatePortfolio(id, e.detail);
    this._showEdit = false;
    await this._load(id);
  }

  render() {
    if (this._loading) return html`<ac-spinner></ac-spinner>`;
    if (!this._summary) return html`<p>Portfolio no encontrado.</p>`;

    const { portfolio, total_ars, total_usd, assets } = this._summary;
    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
    const appAssets = this._app?.assets ?? [];
    const assetList = assets.map(a => toAsset(a, appAssets));

    // Compute overall daily change from enriched assets
    const totalVal = assetList.reduce((s, a) => s + (a.total_valuation ?? 0), 0);
    const weightedChange = totalVal > 0
      ? assetList.reduce((s, a) => s + (a.daily_change_pct ?? 0) * (a.total_valuation ?? 0) / totalVal, 0)
      : null;

    return html`
      <div class="header">
        <div>
          <h1>${portfolio.name}</h1>
          ${portfolio.description ? html`<p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-top:4px">${portfolio.description}</p>` : ''}
        </div>
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
        ${weightedChange != null ? html`
          <div class="stat">
            <div class="stat-label">Cambio hoy</div>
            <div class="stat-value" style="color:${weightedChange >= 0 ? '#34d399' : '#f87171'}">
              ${weightedChange >= 0 ? '▲' : '▼'} ${Math.abs(weightedChange).toFixed(2)}%
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Heatmap del portfolio -->
      <ac-treemap
        .assets="${assetList}"
        .portfolios="${[]}"
      ></ac-treemap>

      <!-- Gráfico de valor histórico del portfolio -->
      <ac-value-chart .portfolioId="${portfolio.id}"></ac-value-chart>

      <!-- Lista de activos -->
      <div class="section-title">Activos</div>
      <ac-asset-list .assets="${assetList}"></ac-asset-list>

      <ac-modal .open="${this._showEdit}" title="Editar portfolio" @ac-modal-close="${() => (this._showEdit = false)}">
        <ac-portfolio-form
          .availableAssets="${appAssets}"
          .initial="${portfolio}"
          @ac-portfolio-submit="${this._onEdit}"
          @ac-cancel="${() => (this._showEdit = false)}"
        ></ac-portfolio-form>
      </ac-modal>
    `;
  }
}
