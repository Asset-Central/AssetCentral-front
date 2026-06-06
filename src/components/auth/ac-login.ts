import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { signIn, signUp, signInWithGoogle } from '@/services/auth.service';

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
      max-width: 420px;
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

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
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
      padding: var(--space-3);
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

    .divider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      margin: var(--space-2) 0;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }

    .google-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-surface-raised);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .google-btn:hover:not(:disabled) {
      background: var(--color-bg);
      border-color: var(--color-text-muted);
    }
    .google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .google-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
  `;

  @state() private _mode: Mode = 'login';
  @state() private _email = '';
  @state() private _password = '';
  @state() private _nombre = '';
  @state() private _apellido = '';
  @state() private _dni = '';
  @state() private _loading = false;
  @state() private _googleLoading = false;
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
      const result = await signUp(this._email, this._password, this._nombre, this._apellido, this._dni);
      if (result.error) {
        this._error = result.error;
      } else if (!result.session) {
        this._success = 'Revisá tu email para confirmar tu cuenta.';
        this._email = '';
        this._password = '';
        this._nombre = '';
        this._apellido = '';
        this._dni = '';
      } else {
        Router.go('/dashboard');
      }
    }

    this._loading = false;
  }

  private async _googleSignIn() {
    this._googleLoading = true;
    this._error = '';
    const error = await signInWithGoogle();
    if (error) {
      this._error = error;
      this._googleLoading = false;
    }
    // Si no hay error, la página redirige a Google — no se llega acá
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

        <button
          class="google-btn"
          type="button"
          ?disabled="${this._googleLoading || this._loading}"
          @click="${this._googleSignIn}"
        >
          <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          ${this._googleLoading ? 'Redirigiendo...' : (isLogin ? 'Continuar con Google' : 'Registrarse con Google')}
        </button>

        <div class="divider">o con email</div>

        <form @submit="${this._submit}">
          ${!isLogin ? html`
            <div class="row">
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Juan"
                  .value="${this._nombre}"
                  @input="${(e: InputEvent) => (this._nombre = (e.target as HTMLInputElement).value)}"
                  required
                  autocomplete="given-name"
                />
              </label>
              <label>
                Apellido
                <input
                  type="text"
                  placeholder="Pérez"
                  .value="${this._apellido}"
                  @input="${(e: InputEvent) => (this._apellido = (e.target as HTMLInputElement).value)}"
                  required
                  autocomplete="family-name"
                />
              </label>
            </div>
            <label>
              DNI
              <input
                type="text"
                placeholder="12345678"
                .value="${this._dni}"
                @input="${(e: InputEvent) => (this._dni = (e.target as HTMLInputElement).value)}"
                required
                pattern="[0-9]{7,8}"
                title="Ingresá tu DNI (7 u 8 dígitos)"
              />
            </label>
          ` : ''}
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
          <button class="submit-btn" type="submit" ?disabled="${this._loading || this._googleLoading}">
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
