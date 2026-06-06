import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { saveUserProfile, signOut } from '@/services/auth.service';

@customElement('ac-profile-complete')
export class AcProfileComplete extends LitElement {
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
      margin-bottom: var(--space-2);
      text-align: center;
    }
    .logo span { color: var(--color-primary-light); }

    .subtitle {
      text-align: center;
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      margin-bottom: var(--space-8);
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

    .logout-link {
      text-align: center;
      margin-top: var(--space-4);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .logout-link button {
      background: none;
      border: none;
      color: var(--color-text-muted);
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
      font-family: var(--font-sans);
    }
    .logout-link button:hover { color: var(--color-text); }
  `;

  @state() private _nombre = '';
  @state() private _apellido = '';
  @state() private _dni = '';
  @state() private _loading = false;
  @state() private _error = '';

  private async _submit(e: Event) {
    e.preventDefault();
    this._loading = true;
    this._error = '';
    const error = await saveUserProfile(this._nombre, this._apellido, this._dni);
    if (error) {
      this._error = error;
      this._loading = false;
    } else {
      this.dispatchEvent(new CustomEvent('profile-saved', { bubbles: true, composed: true }));
    }
  }

  private async _logout() {
    await signOut();
  }

  render() {
    return html`
      <div class="card">
        <div class="logo">Asset<span>Central</span></div>
        <p class="subtitle">Completá tu perfil para continuar</p>

        ${this._error ? html`<div class="error">${this._error}</div>` : ''}

        <form @submit="${this._submit}">
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
          <button class="submit-btn" type="submit" ?disabled="${this._loading}">
            ${this._loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>

        <div class="logout-link">
          <button @click="${this._logout}">Salir con otra cuenta</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-profile-complete': AcProfileComplete;
  }
}
