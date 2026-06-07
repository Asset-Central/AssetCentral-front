import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',  label: 'Dashboard',  icon: '◎' },
  { path: '/assets',     label: 'Activos',    icon: '◈' },
  { path: '/market',     label: 'Mercado',    icon: '◱' },
  { path: '/accounts',   label: 'Cuentas',    icon: '◉' },
  { path: '/portfolios', label: 'Portfolios', icon: '❏' },
  { path: '/mcp',        label: 'MCP',        icon: '⬡' },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { path: '/profile',  label: 'Mi Perfil',     icon: '◷' },
  { path: '/settings', label: 'Configuración', icon: '⚙' },
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

    /* Logo — explicit hover without background box */
    .logo {
      display: block;
      padding: 0 var(--space-6) var(--space-6);
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-text);
      letter-spacing: -0.02em;
      text-decoration: none;
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .logo span { color: var(--color-primary-light); }
    .logo:hover { opacity: 0.8; }

    nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: 0 var(--space-3);
      flex: 1;
    }

    /* Scope hover/active ONLY to nav links, never the logo */
    nav a {
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
    nav a:hover {
      background: var(--color-surface-raised);
      color: var(--color-text);
    }
    nav a.active {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      color: var(--color-primary-light);
    }

    .icon {
      font-size: var(--text-lg);
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    /* Push bottom items to the bottom */
    .spacer { flex: 1; min-height: var(--space-4); }

    .nav-divider {
      height: 1px;
      background: var(--color-border);
      margin: var(--space-2) 0;
    }
  `;

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

  render() {
    return html`
      <a class="logo" href="/dashboard">Asset<span>Central</span></a>
      <nav>
        ${MAIN_NAV_ITEMS.map(item => html`
          <a
            href="${item.path}"
            class="${this.activePath.startsWith(item.path) ? 'active' : ''}"
          >
            <span class="icon">${item.icon}</span>
            ${item.label}
          </a>
        `)}

        <div class="spacer"></div>
        <div class="nav-divider"></div>

        ${BOTTOM_NAV_ITEMS.map(item => html`
          <a
            href="${item.path}"
            class="${this.activePath.startsWith(item.path) ? 'active' : ''}"
          >
            <span class="icon">${item.icon}</span>
            ${item.label}
          </a>
        `)}
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-nav': AcNav;
  }
}
