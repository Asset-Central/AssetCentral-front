import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';
import { createPortfolio, fetchPortfolioSummary } from '@/services/portfolio.service';
import type { PortfolioSummary } from '@/types/portfolio';
import './ac-portfolio-card';
import './ac-portfolio-form';
import '@/components/common/ac-modal';
import '@/components/common/ac-button';
import '@/components/common/ac-empty-state';
import '@/components/common/ac-spinner';

@customElement('ac-portfolio-manager')
export class AcPortfolioManager extends LitElement {
  static styles = css`
    :host { display: block; }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-6);
    }
    h1 { font-size: var(--text-2xl); font-weight: 700; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
    }
  `;

  @consume({ context: appContext, subscribe: true })
  @state()
  private _app!: AppState;

  @state() private _summaries: PortfolioSummary[] = [];
  @state() private _loading = true;
  @state() private _showCreate = false;

  async connectedCallback() {
    super.connectedCallback();
    await this._loadSummaries();
  }

  private async _loadSummaries() {
    this._loading = true;
    const portfolios = this._app?.portfolios ?? [];
    this._summaries = await Promise.all(portfolios.map((p) => fetchPortfolioSummary(p.id)));
    this._loading = false;
  }

  private async _onCreate(e: CustomEvent) {
    await createPortfolio(e.detail);
    this._showCreate = false;
    await this._loadSummaries();
  }

  render() {
    return html`
      <div class="header">
        <h1>Portfolios</h1>
        <ac-button @click="${() => (this._showCreate = true)}">+ Nuevo portfolio</ac-button>
      </div>

      ${this._loading
        ? html`<ac-spinner></ac-spinner>`
        : this._summaries.length === 0
          ? html`<ac-empty-state icon="❏" title="Sin portfolios" message="Creá tu primer portfolio para organizar tus activos."></ac-empty-state>`
          : html`
            <div class="grid">
              ${this._summaries.map((s) => html`<ac-portfolio-card .summary="${s}"></ac-portfolio-card>`)}
            </div>
          `
      }

      <ac-modal .open="${this._showCreate}" title="Nuevo portfolio" @ac-modal-close="${() => (this._showCreate = false)}">
        <ac-portfolio-form
          .availableAssets="${this._app?.assets ?? []}"
          @ac-portfolio-submit="${this._onCreate}"
          @ac-cancel="${() => (this._showCreate = false)}"
        ></ac-portfolio-form>
      </ac-modal>
    `;
  }
}
