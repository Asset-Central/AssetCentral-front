import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';

import './ac-total-valuation';
import './ac-performance-badge';
import './ac-distribution-chart';
import './ac-treemap';
import './ac-value-chart';
import './ac-performance-chart';
import '@/components/common/ac-spinner';

@customElement('ac-dashboard')
export class AcDashboard extends LitElement {
  static styles = css`
    :host { display: block; }

    h1 {
      font-size: var(--text-2xl);
      font-weight: 700;
      margin-bottom: var(--space-6);
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: var(--space-4);
      align-items: start;
    }

    @media (max-width: 1100px) {
      .layout { grid-template-columns: 1fr; }
    }

    .main { min-width: 0; }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `;

  @consume({ context: appContext, subscribe: true })
  @state()
  private _app!: AppState;

  render() {
    if (this._app?.isLoading) {
      return html`<ac-spinner></ac-spinner>`;
    }

    return html`
      <h1>Dashboard</h1>

      <div class="layout">
        <!-- Main column: treemap + performance chart -->
        <div class="main">
          <ac-treemap
            .assets="${this._app?.assets ?? []}"
            .portfolios="${this._app?.portfolios ?? []}"
          ></ac-treemap>

          <ac-performance-chart></ac-performance-chart>
        </div>

        <!-- Sidebar: valuation + distribution + daily badge -->
        <div class="sidebar">
          <ac-total-valuation
            .totalArs="${this._app?.totalArs ?? 0}"
            .totalUsd="${this._app?.totalUsd ?? 0}"
          ></ac-total-valuation>

          <ac-distribution-chart
            .assets="${this._app?.assets ?? []}"
          ></ac-distribution-chart>

          <ac-performance-badge
            .assets="${this._app?.assets ?? []}"
          ></ac-performance-badge>
        </div>
      </div>
    `;
  }
}
