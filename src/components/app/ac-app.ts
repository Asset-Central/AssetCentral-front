import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit-labs/context';
import { Router } from '@vaadin/router';
import { appContext, initialState, type AppState } from '@/store/app.context';
import { supabase } from '@/lib/supabase';
import { fetchAssets } from '@/services/asset.service';
import { fetchAccounts } from '@/services/account.service';
import { fetchPortfolios } from '@/services/portfolio.service';

import '@/components/app/ac-nav';
import '@/components/auth/ac-login';
import '@/components/dashboard/ac-dashboard';
import '@/components/assets/ac-asset-list';
import '@/components/accounts/ac-accounts-page';
import '@/components/portfolios/ac-portfolio-manager';
import '@/components/portfolios/ac-portfolio-detail';

@customElement('ac-app')
export class AcApp extends LitElement {
  static styles = css`
    :host { display: flex; height: 100%; }
    .shell { display: flex; width: 100%; height: 100%; }
    .main { flex: 1; overflow-y: auto; padding: var(--space-6); min-width: 0; }
    .main.full { padding: 0; }
    #outlet { width: 100%; }
  `;

  @provide({ context: appContext })
  @state()
  private _state: AppState = { ...initialState };

  @state() private _authenticated = false;

  private _router!: Router;

  connectedCallback() {
    super.connectedCallback();

    supabase.auth.onAuthStateChange((event, session) => {
      const wasAuth = this._authenticated;
      this._authenticated = !!session;
      this._state = { ...this._state, session: session ?? null, user: session?.user ?? null };

      // Login nuevo → cargar datos y navegar al dashboard
      if (event === 'SIGNED_IN' && session && !wasAuth) {
        this._loadData();
        Router.go('/dashboard');
      }

      // Logout → limpiar estado y mandar al login
      if (event === 'SIGNED_OUT') {
        this._state = { ...initialState };
        this._authenticated = false;
        Router.go('/login');
      }
    });
  }

  firstUpdated() {
    // Las rutas NO tienen guards: @vaadin/router v2 no resuelve correctamente
    // commands.redirect() hacia rutas de nivel raíz desde un action.
    // En su lugar, se verifica la sesión UNA VEZ acá y se navega con Router.go().
    this._setupRouter();

    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          this._authenticated = true;
          this._state = { ...this._state, session: data.session, user: data.session.user };
          this._loadData();
        } else {
          Router.go('/login');
        }
      })
      .catch(() => Router.go('/login'));
  }

  private _setupRouter() {
    const outlet = this.shadowRoot!.querySelector('#outlet')!;
    this._router = new Router(outlet);

    this._router.setRoutes([
      { path: '/login',          component: 'ac-login' },
      { path: '/',               redirect: '/dashboard' },
      { path: '/dashboard',      component: 'ac-dashboard' },
      { path: '/assets',         component: 'ac-asset-list' },
      { path: '/accounts',       component: 'ac-accounts-page' },
      { path: '/portfolios',     component: 'ac-portfolio-manager' },
      { path: '/portfolios/:id', component: 'ac-portfolio-detail' },
    ]);
  }

  private async _loadData() {
    this._state = { ...this._state, isLoading: true, error: null };
    try {
      const [assets, accounts, portfolios] = await Promise.all([
        fetchAssets(),
        fetchAccounts(),
        fetchPortfolios(),
      ]);
      const totalArs = assets
        .filter((a) => a.currency === 'ARS')
        .reduce((sum, a) => sum + (a.total_valuation ?? 0), 0);
      const totalUsd = assets
        .filter((a) => a.currency === 'USD')
        .reduce((sum, a) => sum + (a.total_valuation ?? 0), 0);
      this._state = { ...this._state, assets, accounts, portfolios, totalArs, totalUsd, isLoading: false, error: null };
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
      <div class="shell">
        ${this._authenticated
          ? html`<ac-nav .userEmail="${this._state.user?.email ?? ''}"></ac-nav>`
          : ''}
        <main class="main ${this._authenticated ? '' : 'full'}">
          <div id="outlet"></div>
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
