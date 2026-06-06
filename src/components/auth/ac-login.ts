import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { signIn, signUp } from '@/services/auth.service';

type Mode = 'login' | 'register';

@customElement('ac-login')
export class AcLogin extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .card {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl, 16px);
      padding: var(--space-8);
    }

    .logo {
      font-size: var(--text-2xl);
      font-weight: 700;
      margin-bottom: var(--space-8);
      text-align: center;
    }
    .logo span { color: var(--color-primary-light); }

    .tabs {
      display: flex;
      background: var(--color-surface-raised);
      border-radius: var(--radius-md);
      padding: 3px;
      margin-bottom: var(--space-6);
      gap: 3px;
    }
    .tab {
      flex: 1;
      padding: var(--space-2);
      border: none;
      border-radius: calc(var(--radius-md) - 2px);
      background: transparent;
      color: var(--color-text-muted);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tab.active {
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: 0 1px 3px rgba(0,0,0,.3);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    label {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text);
    }

    input {
      padding: var(--space-3) var(--space-3);
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      transition: border-color var(--transition-fast);
    }
    input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .error {
      padding: var(--space-3);
      background: color-mix(in srgb, var(--color-danger) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
      border-radius: var(--radius-md);
      color: var(--color-danger);
      font-size: var(--text-sm);
    }

    .success {
      padding: var(--space-3);
      background: color-mix(in srgb, var(--color-success) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-success) 40%, transparent);
      border-radius: var(--radius-md);
      color: var(--color-success);
      font-size: var(--text-sm);
    }

    .submit-btn {
      width: 100%;
      padding: var(--space-3);
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: opacity var(--transition-fast);
      margin-top: var(--space-2);
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.88; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  @state() private _mode: Mode = 'login';
  @state() private _email = '';
  @state() private _password = '';
  @state() private _loading = false;
  @state() private _error = '';
  @state() private _success = '';

  private _setMode(mode: Mode) {
    this._mode = mode;
    this._error = '';
    this._success = '';
  }

  private async _submit(e: Event) {
    e.preventDefault();
    this._loading = true;
    this._error = '';
    this._success = '';

    if (this._mode === 'login') {
      const result = await signIn(this._email, this._password);
      if (result.error) {
        this._error = result.error;
      } else {
        Router.go('/dashboard');
      }
    } else {
      const result = await signUp(this._email, this._password);
      if (result.error) {
        this._error = result.error;
      } else if (!result.session) {
        // Supabase con confirmación de email: session es null hasta confirmar
        this._success = 'Revisá tu email para confirmar tu cuenta.';
        this._email = '';
        this._password = '';
      } else {
        Router.go('/dashboard');
      }
    }

    this._loading = false;
  }

  render() {
    const isLogin = this._mode === 'login';

    return html`
      <div class="card">
        <div class="logo">Asset<span>Central</span></div>

        <div class="tabs">
          <button
            class="tab ${isLogin ? 'active' : ''}"
            type="button"
            @click="${() => this._setMode('login')}"
          >Iniciar sesión</button>
          <button
            class="tab ${!isLogin ? 'active' : ''}"
            type="button"
            @click="${() => this._setMode('register')}"
          >Registrarse</button>
        </div>

        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
        ${this._success ? html`<div class="success">${this._success}</div>` : ''}

        <form @submit="${this._submit}">
          <label>
            Email
            <input
              type="email"
              placeholder="tu@email.com"
              .value="${this._email}"
              @input="${(e: InputEvent) => (this._email = (e.target as HTMLInputElement).value)}"
              required
              autocomplete="email"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              placeholder="${isLogin ? '••••••••' : 'Mínimo 6 caracteres'}"
              .value="${this._password}"
              @input="${(e: InputEvent) => (this._password = (e.target as HTMLInputElement).value)}"
              required
              minlength="6"
              autocomplete="${isLogin ? 'current-password' : 'new-password'}"
            />
          </label>
          <button class="submit-btn" type="submit" ?disabled="${this._loading}">
            ${this._loading
              ? (isLogin ? 'Ingresando...' : 'Creando cuenta...')
              : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-login': AcLogin;
  }
}
