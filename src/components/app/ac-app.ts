import { LitElement, html, css, type PropertyValues } from 'lit';
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
import '@/components/common/ac-spinner';

@customElement('ac-app')
export class AcApp extends LitElement {
  static styles = css`
    :host { display: flex; height: 100%; }
    .shell { display: flex; width: 100%; height: 100%; }
    .main { flex: 1; overflow-y: auto; padding: var(--space-6); min-width: 0; }
    #outlet { width: 100%; }
    .centered { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
  `;

  @provide({ context: appContext })
  @state() private _state: AppState = { ...initialState };

  /** true mientras se verifica la sesión inicial */
  @state() private _authChecking = true;
  @state() private _authenticated = false;

  private _router?: Router;

  connectedCallback() {
    super.connectedCallback();

    supabase.auth.onAuthStateChange((event, session) => {
      const wasAuth = this._authenticated;
      this._authenticated = !!session;
      this._state = { ...this._state, session: session ?? null, user: session?.user ?? null };

      if (event === 'SIGNED_IN' && session && !wasAuth) {
        this._loadData();
      }
      if (event === 'SIGNED_OUT') {
        this._state = { ...initialState };
        this._authenticated = false;
        this._router = undefined;
      }
    });

    // Verificar sesión existente una sola vez al arrancar
    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          this._authenticated = true;
          this._state = { ...this._state, session: data.session, user: data.session.user };
          this._loadData();
        }
      })
      .catch(() => { /* sin sesión */ })
      .finally(() => { this._authChecking = false; });
  }

  updated(changed: PropertyValues) {
    // Inicializar el router la primera vez que el shell autenticado se renderiza
    // (#outlet existe en el DOM solo cuando _authenticated === true)
    if (changed.has('_authenticated') && this._authenticated && !this._router) {
      const outlet = this.shadowRoot!.querySelector('#outlet')!;
      this._router = new Router(outlet);
      this._router.setRoutes([
        { path: '/',               redirect: '/dashboard' },
        { path: '/dashboard',      component: 'ac-dashboard' },
        { path: '/assets',         component: 'ac-asset-list' },
        { path: '/accounts',       component: 'ac-accounts-page' },
        { path: '/portfolios',     component: 'ac-portfolio-manager' },
        { path: '/portfolios/:id', component: 'ac-portfolio-detail' },
      ]);
    }
  }

  private async _loadData() {
    this._state = { ...this._state, isLoading: true, error: null };
    try {
      const [assets, accounts, portfolios] = await Promise.all([
        fetchAssets(), fetchAccounts(), fetchPortfolios(),
      ]);
      const totalArs = assets.filter(a => a.currency === 'ARS').reduce((s, a) => s + (a.total_valuation ?? 0), 0);
      const totalUsd = assets.filter(a => a.currency === 'USD').reduce((s, a) => s + (a.total_valuation ?? 0), 0);
      this._state = { ...this._state, assets, accounts, portfolios, totalArs, totalUsd, isLoading: false, error: null };
    } catch (err) {
      this._state = { ...this._state, isLoading: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  }

  render() {
    // 1. Verificando sesión → spinner
    if (this._authChecking) {
      return html`<div class="centered"><ac-spinner></ac-spinner></div>`;
    }

    // 2. Sin sesión → login directamente (sin pasar por el router)
    if (!this._authenticated) {
      return html`<ac-login></ac-login>`;
    }

    // 3. Autenticado → shell con nav + router outlet
    return html`
      <div class="shell">
        <ac-nav .userEmail="${this._state.user?.email ?? ''}"></ac-nav>
        <main class="main">
          <div id="outlet"></div>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-app': AcApp; }
}
