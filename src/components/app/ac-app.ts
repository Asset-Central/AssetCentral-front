import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit-labs/context';
import { Router } from '@vaadin/router';
import { appContext, initialState, type AppState } from '@/store/app.context';
import { fetchAssets } from '@/services/asset.service';
import { fetchAccounts } from '@/services/account.service';
import { fetchPortfolios } from '@/services/portfolio.service';

import '@/components/app/ac-nav';
import '@/components/dashboard/ac-dashboard';
import '@/components/assets/ac-asset-list';
import '@/components/accounts/ac-accounts-page';
import '@/components/portfolios/ac-portfolio-manager';

@customElement('ac-app')
export class AcApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      height: 100%;
    }

    .layout {
      display: flex;
      width: 100%;
      height: 100%;
    }

    .main {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
      min-width: 0;
    }

    #router-outlet {
      width: 100%;
    }
  `;

  @provide({ context: appContext })
  @state()
  private _state: AppState = { ...initialState };

  private _router!: Router;

  firstUpdated() {
    const outlet = this.shadowRoot!.querySelector('#router-outlet')!;
    this._router = new Router(outlet);
    this._router.setRoutes([
      { path: '/', redirect: '/dashboard' },
      { path: '/dashboard', component: 'ac-dashboard' },
      { path: '/assets', component: 'ac-asset-list' },
      { path: '/accounts', component: 'ac-accounts-page' },
      { path: '/portfolios', component: 'ac-portfolio-manager' },
      { path: '/portfolios/:id', component: 'ac-portfolio-detail' },
    ]);

    this._loadData();
  }

  private async _loadData() {
    this._state = { ...this._state, isLoading: true, error: null };
    try {
      const [assets, accounts, portfolios] = await Promise.all([
        fetchAssets(),
        fetchAccounts(),
        fetchPortfolios(),
      ]);
      const totalArs = assets.reduce((sum, a) => sum + a.totalArs, 0);
      const totalUsd = assets.reduce((sum, a) => sum + (a.totalUsd ?? 0), 0);
      this._state = { assets, accounts, portfolios, totalArs, totalUsd, isLoading: false, error: null };
    } catch (err) {
      this._state = {
        ...this._state,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
      };
    }
  }

  render() {
    return html`
      <div class="layout">
        <ac-nav></ac-nav>
        <main class="main">
          <div id="router-outlet"></div>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-app': AcApp;
  }
}
