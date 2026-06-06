import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { signOut } from '@/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',  label: 'Dashboard',  icon: '◎' },
  { path: '/assets',     label: 'Activos',    icon: '◈' },
  { path: '/accounts',   label: 'Cuentas',    icon: '◉' },
  { path: '/portfolios', label: 'Portfolios', icon: '❏' },
];

@customElement('ac-nav')
export class AcNav extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: var(--nav-width);
      min-height: 100%;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: var(--space-6) 0;
      flex-shrink: 0;
    }

    .logo {
      padding: 0 var(--space-6) var(--space-8);
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-text);
      letter-spacing: -0.02em;
    }
    .logo span { color: var(--color-primary-light); }

    nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: 0 var(--space-3);
      flex: 1;
    }

    a {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: var(--text-sm);
      font-weight: 500;
      transition: background var(--transition-fast), color var(--transition-fast);
    }
    a:hover {
      background: var(--color-surface-raised);
      color: var(--color-text);
    }
    a.active {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      color: var(--color-primary-light);
    }

    .icon {
      font-size: var(--text-lg);
      width: 20px;
      text-align: center;
    }

    .user-section {
      padding: var(--space-3) var(--space-4);
      margin: 0 var(--space-3);
      border-top: 1px solid var(--color-border);
    }

    .user-email {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: var(--space-2);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: left;
    }
    .logout-btn:hover {
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
      color: var(--color-danger);
    }
  `;

  @property({ type: String }) userEmail = '';

  @property({ type: String })
  activePath = window.location.pathname;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('vaadin-router-location-changed', this._onRouteChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('vaadin-router-location-changed', this._onRouteChange);
  }

  private _onRouteChange = () => {
    this.activePath = window.location.pathname;
  };

  private async _logout() {
    await signOut();
    Router.go('/login');
  }

  render() {
    return html`
      <div class="logo">Asset<span>Central</span></div>
      <nav>
        ${NAV_ITEMS.map(
          (item) => html`
            <a
              href="${item.path}"
              class="${this.activePath.startsWith(item.path) ? 'active' : ''}"
            >
              <span class="icon">${item.icon}</span>
              ${item.label}
            </a>
          `
        )}
      </nav>
      <div class="user-section">
        ${this.userEmail ? html`<div class="user-email">${this.userEmail}</div>` : ''}
        <button class="logout-btn" @click="${this._logout}">
          <span>⎋</span> Cerrar sesión
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-nav': AcNav;
  }
}
