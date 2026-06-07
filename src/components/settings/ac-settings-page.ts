import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { appContext, type AppState } from '@/store/app.context';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/services/auth.service';

@customElement('ac-settings-page')
export class AcSettingsPage extends LitElement {
  static styles = css`
    :host { display: block; }

    h1 {
      font-size: var(--text-2xl);
      font-weight: 700;
      margin-bottom: var(--space-2);
    }
    .subtitle {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-8);
    }

    .section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-5);
      max-width: 600px;
    }
    .section-title {
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: var(--space-5);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-bottom: var(--space-5);
    }
    .field:last-child { margin-bottom: 0; }
    .field label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: 600;
    }
    .field-value {
      font-size: var(--text-sm);
      color: var(--color-text);
      padding: var(--space-2) var(--space-3);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      flex-wrap: wrap;
    }
    .row-label { font-size: var(--text-sm); color: var(--color-text); }
    .row-hint { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-muted);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .btn:hover {
      background: var(--color-surface-raised);
      color: var(--color-text);
      border-color: var(--color-primary);
    }
    .btn:disabled { opacity: 0.5; cursor: default; pointer-events: none; }

    .btn-danger {
      border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
      color: var(--color-danger);
    }
    .btn-danger:hover {
      background: color-mix(in srgb, var(--color-danger) 10%, transparent);
      border-color: var(--color-danger);
      color: var(--color-danger);
    }

    .alert {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      margin-top: var(--space-3);
    }
    .alert-ok  { background: color-mix(in srgb, #34d399 15%, transparent); color: #34d399; }
    .alert-err { background: color-mix(in srgb, #f87171 15%, transparent); color: #f87171; }

    .divider { height: 1px; background: var(--color-border); margin: var(--space-4) 0; }
  `;

  @consume({ context: appContext, subscribe: true })
  @state() private _app?: AppState;

  @state() private _pwMsg: string | null = null;
  @state() private _pwErr = false;
  @state() private _pwLoading = false;

  private async _sendPasswordReset() {
    const email = this._app?.user?.email;
    if (!email) return;
    this._pwLoading = true;
    this._pwMsg = null;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    this._pwLoading = false;
    if (error) {
      this._pwMsg = error.message;
      this._pwErr = true;
    } else {
      this._pwMsg = `Se envió un enlace de restablecimiento a ${email}`;
      this._pwErr = false;
    }
  }

  render() {
    const user = this._app?.user;
    const meta = user?.user_metadata ?? {};
    const nombre = [meta.nombre, meta.apellido].filter(Boolean).join(' ') || '—';

    return html`
      <h1>Configuración</h1>
      <p class="subtitle">Administrá tu cuenta y preferencias.</p>

      <!-- Cuenta -->
      <div class="section">
        <div class="section-title">Cuenta</div>

        <div class="field">
          <label>Email</label>
          <div class="field-value">${user?.email ?? '—'}</div>
        </div>

        <div class="field">
          <label>Nombre completo</label>
          <div class="field-value">${nombre}</div>
        </div>

        <div class="field">
          <label>DNI</label>
          <div class="field-value">${meta.dni ?? '—'}</div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <div>
            <div class="row-label">Contraseña</div>
            <div class="row-hint">Recibirás un email con un enlace para cambiarla.</div>
          </div>
          <button
            class="btn"
            ?disabled="${this._pwLoading}"
            @click="${this._sendPasswordReset}"
          >
            ${this._pwLoading ? '…' : '🔑 Restablecer contraseña'}
          </button>
        </div>

        ${this._pwMsg ? html`
          <div class="alert ${this._pwErr ? 'alert-err' : 'alert-ok'}">
            ${this._pwMsg}
          </div>
        ` : ''}
      </div>

      <!-- Perfil financiero -->
      <div class="section">
        <div class="section-title">Perfil financiero</div>
        <div class="row">
          <div>
            <div class="row-label">Perfil de inversión</div>
            <div class="row-hint">Editá tus objetivos y tolerancia al riesgo.</div>
          </div>
          <a href="/profile" class="btn">✏ Editar perfil</a>
        </div>
      </div>

      <!-- Sesión -->
      <div class="section">
        <div class="section-title">Sesión</div>
        <div class="row">
          <div>
            <div class="row-label">Cerrar sesión</div>
            <div class="row-hint">Se cerrará la sesión en este dispositivo.</div>
          </div>
          <button class="btn btn-danger" @click="${() => signOut()}">⎋ Cerrar sesión</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-settings-page': AcSettingsPage; }
}
