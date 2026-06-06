import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit-labs/context';
import { Router } from '@vaadin/router';
import { appContext, initialState, type AppState } from '@/store/app.context';
import { supabase } from '@/lib/supabase';
import { profileIsComplete } from '@/services/auth.service';
import { fetchAssets } from '@/services/asset.service';
import { fetchAccounts } from '@/services/account.service';
import { fetchPortfolios } from '@/services/portfolio.service';

import { signOut } from '@/services/auth.service';
import '@/components/app/ac-nav';
import '@/components/auth/ac-login';
import '@/components/auth/ac-profile-complete';
import '@/components/dashboard/ac-dashboard';
import '@/components/assets/ac-asset-list';
import '@/components/accounts/ac-accounts-page';
import '@/components/portfolios/ac-portfolio-manager';
import '@/components/portfolios/ac-portfolio-detail';
import '@/components/mcp/ac-mcp-page';
import '@/components/profile/ac-financial-profile';
import '@/components/common/ac-spinner';

@customElement('ac-app')
export class AcApp extends LitElement {
  static styles = css`
    :host { display: flex; height: 100%; }
    .shell { display: flex; width: 100%; height: 100%; }
    .content { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
      flex-shrink: 0;
    }
    .topbar-email {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 220px;
    }
    .topbar-logout {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-muted);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .topbar-logout:hover {
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
      border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
      color: var(--color-danger);
    }
    .main { flex: 1; overflow-y: auto; padding: var(--space-6); min-width: 0; }
    #outlet { width: 100%; }
    .centered { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
  `;

  @provide({ context: appContext })
  @state() private _state: AppState = { ...initialState };

  @state() private _authChecking = true;
  @state() private _authenticated = false;
  @state() private _needsProfile = false;

  private _router?: Router;

  connectedCallback() {
    super.connectedCallback();

    supabase.auth.onAuthStateChange((event, session) => {
      const wasAuth = this._authenticated;
      this._authenticated = !!session;
      this._state = { ...this._state, session: session ?? null, user: session?.user ?? null };

      if (event === 'SIGNED_IN' && session) {
        this._needsProfile = !profileIsComplete(session.user);
        if (!this._needsProfile && !wasAuth) {
          this._loadData();
        }
      }
      if (event === 'SIGNED_OUT') {
        this._state = { ...initialState };
        this._authenticated = false;
        this._needsProfile = false;
        this._router = undefined;
      }
    });

    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          this._authenticated = true;
          this._needsProfile = !profileIsComplete(data.session.user);
          this._state = { ...this._state, session: data.session, user: data.session.user };
          if (!this._needsProfile) this._loadData();
        }
      })
      .catch(() => { /* sin sesión */ })
      .finally(() => { this._authChecking = false; });
  }

  updated(changed: PropertyValues) {
    // Inicializar el router solo cuando el shell está completamente renderizado:
    // _authenticated === true Y _authChecking === false Y perfil completo (sin overlay)
    if ((changed.has('_authenticated') || changed.has('_authChecking') || changed.has('_needsProfile'))
        && this._authenticated && !this._authChecking && !this._needsProfile && !this._router) {
      const outlet = this.shadowRoot!.querySelector('#outlet');
      if (!outlet) return;
      this._router = new Router(outlet);
      this._router.setRoutes([
        { path: '/',               redirect: '/dashboard' },
        { path: '/dashboard',      component: 'ac-dashboard' },
        { path: '/assets',         component: 'ac-asset-list' },
        { path: '/accounts',       component: 'ac-accounts-page' },
        { path: '/portfolios',     component: 'ac-portfolio-manager' },
        { path: '/portfolios/:id', component: 'ac-portfolio-detail' },
        { path: '/mcp',            component: 'ac-mcp-page' },
        { path: '/profile',        component: 'ac-financial-profile' },
      ]);
    }
  }

  private _onProfileSaved() {
    this._needsProfile = false;
    this._loadData();
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
    if (this._authChecking) {
      return html`<div class="centered"><ac-spinner></ac-spinner></div>`;
    }

    if (!this._authenticated) {
      return html`<ac-login></ac-login>`;
    }

    if (this._needsProfile) {
      return html`<ac-profile-complete @profile-saved="${this._onProfileSaved}"></ac-profile-complete>`;
    }

    return html`
      <div class="shell">
        <ac-nav></ac-nav>
        <div class="content">
          <div class="topbar">
            ${this._state.user?.email ? html`
              <span class="topbar-email">${this._state.user.email}</span>
            ` : ''}
            <button class="topbar-logout" @click="${() => signOut()}">
              <span>⎋</span> Cerrar sesión
            </button>
          </div>
          <main class="main">
            <div id="outlet"></div>
          </main>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-app': AcApp; }
}
