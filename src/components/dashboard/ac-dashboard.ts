import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';

import './ac-total-valuation';
import './ac-performance-badge';
import './ac-distribution-chart';
import '@/components/assets/ac-asset-list';
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

    .top-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-4);
    }

    @media (max-width: 1100px) {
      .top-row    { grid-template-columns: 1fr 1fr; }
      .bottom-row { grid-template-columns: 1fr; }
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

      <div class="top-row">
        <ac-total-valuation
          .totalArs="${this._app?.totalArs ?? 0}"
          .totalUsd="${this._app?.totalUsd ?? 0}"
        ></ac-total-valuation>

        <ac-performance-badge
          .assets="${this._app?.assets ?? []}"
        ></ac-performance-badge>

        <ac-distribution-chart
          .assets="${this._app?.assets ?? []}"
        ></ac-distribution-chart>
      </div>

      <div class="bottom-row">
        <ac-asset-list
          .assets="${this._app?.assets?.slice(0, 5) ?? []}"
          compact
        ></ac-asset-list>
      </div>
    `;
  }
}
