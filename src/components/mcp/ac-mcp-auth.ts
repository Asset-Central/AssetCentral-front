import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { supabase } from '@/lib/supabase';

const BACKEND = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

@customElement('ac-mcp-auth')
export class AcMcpAuth extends LitElement {
  static styles = css`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--color-bg); }
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-8);
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    .logo { font-size: var(--text-2xl); font-weight: 700; color: var(--color-primary-light); margin-bottom: var(--space-2); }
    .sub  { color: var(--color-text-muted); font-size: var(--text-sm); margin-bottom: var(--space-6); }
    .status-ok   { color: #6ee7b7; font-size: var(--text-sm); margin-bottom: var(--space-4); }
    .status-err  { color: #f87171; font-size: var(--text-sm); margin-bottom: var(--space-4); }
    textarea {
      width: 100%; min-height: 80px; background: var(--color-bg);
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      color: var(--color-text); font-family: var(--font-mono); font-size: 11px;
      padding: var(--space-2); resize: vertical; box-sizing: border-box;
    }
    button {
      margin-top: var(--space-3); padding: var(--space-2) var(--space-6);
      background: var(--color-primary); color: #fff; border: none;
      border-radius: var(--radius-md); font-size: var(--text-sm);
      font-weight: 600; cursor: pointer;
    }
    button:hover { background: var(--color-primary-dark); }
    .hint { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-3); }
  `;

  @state() private _status = 'Buscando sesión activa...';
  @state() private _isError = false;
  @state() private _showManual = false;
  @state() private _manualJwt = '';

  private _redirectUri = '';
  private _state = '';

  connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this._redirectUri = params.get('redirect_uri') ?? '';
    this._state = params.get('state') ?? '';
    this._tryAutoAuth();
  }

  private async _tryAutoAuth() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.access_token) {
      this._status = '✓ Sesión encontrada';
      await this._authorize(session.access_token, session.refresh_token ?? '');
    } else {
      this._status = 'No se encontró sesión activa. Iniciá sesión en AssetCentral primero.';
      this._isError = true;
      this._showManual = true;
    }
  }

  private async _authorize(jwt: string, refreshToken = '') {
    this._status = 'Autorizando...';
    this._isError = false;
    try {
      const resp = await fetch(`${BACKEND}/oauth/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt, refresh_token: refreshToken }),
      });
      const data = await resp.json();
      if (!data.code) throw new Error('No se recibió código');

      const url = new URL(this._redirectUri);
      url.searchParams.set('code', data.code);
      if (this._state) url.searchParams.set('state', this._state);

      this._status = '✓ Autorizado. Redirigiendo a Claude Code...';
      setTimeout(() => { window.location.href = url.toString(); }, 800);
    } catch (e: any) {
      this._status = `Error: ${e.message}`;
      this._isError = true;
      this._showManual = true;
    }
  }

  render() {
    return html`
      <div class="card">
        <div class="logo">AssetCentral</div>
        <div class="sub">Autorizar acceso MCP</div>
        <div class="${this._isError ? 'status-err' : 'status-ok'}">${this._status}</div>
        ${this._showManual ? html`
          <textarea
            placeholder="Pegá tu JWT de Supabase (sin 'Bearer')..."
            .value="${this._manualJwt}"
            @input="${(e: InputEvent) => (this._manualJwt = (e.target as HTMLTextAreaElement).value)}"
          ></textarea>
          <br>
          <button @click="${() => this._authorize(this._manualJwt.trim(), '')}">Autorizar</button>
          <div class="hint">
            Podés obtener tu JWT desde la página MCP de AssetCentral → "Copiar configuración completa"
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'ac-mcp-auth': AcMcpAuth; } }
