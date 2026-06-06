import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchProfile, upsertProfile, type FinancialProfileData } from '@/services/profile.service';

const GOALS_OPTIONS = [
  { value: 'retiro', label: 'Retiro' },
  { value: 'vivienda', label: 'Vivienda' },
  { value: 'fondo_emergencia', label: 'Fondo de emergencia' },
  { value: 'educacion', label: 'Educación' },
  { value: 'otro', label: 'Otro' },
];

@customElement('ac-financial-profile')
export class AcFinancialProfile extends LitElement {
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

    .info-row {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      padding: var(--space-3) var(--space-4);
      background: color-mix(in srgb, var(--color-info) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-info) 25%, transparent);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-6);
    }
    .info-row .info-icon { color: var(--color-info); font-size: var(--text-base); flex-shrink: 0; margin-top: 1px; }
    .info-row p { margin: 0; color: var(--color-info); font-size: var(--text-xs); line-height: 1.5; }

    .section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .section-title {
      font-size: var(--text-base);
      font-weight: 600;
      margin-bottom: var(--space-5);
      color: var(--color-text);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    label {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text);
    }

    .hint {
      font-size: var(--text-xs);
      color: var(--color-text-subtle);
      margin-top: 2px;
    }

    input, select {
      padding: var(--space-3);
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      transition: border-color var(--transition-fast);
      width: 100%;
      box-sizing: border-box;
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .goals-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .goal-chip {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;
    }
    .goal-chip.selected {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
      color: var(--color-primary-light);
    }

    .actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      margin-top: var(--space-2);
    }

    .btn-primary {
      padding: var(--space-3) var(--space-6);
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-ghost {
      padding: var(--space-3) var(--space-4);
      background: transparent;
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-ghost:hover { color: var(--color-danger); border-color: color-mix(in srgb, var(--color-danger) 40%, transparent); }

    .success-msg {
      padding: var(--space-3) var(--space-4);
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-success) 35%, transparent);
      border-radius: var(--radius-md);
      color: var(--color-success);
      font-size: var(--text-sm);
    }

    .error-msg {
      padding: var(--space-3) var(--space-4);
      background: color-mix(in srgb, var(--color-danger) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
      border-radius: var(--radius-md);
      color: var(--color-danger);
      font-size: var(--text-sm);
    }
  `;

  @state() private _profile: FinancialProfileData = {};
  @state() private _loading = true;
  @state() private _saving = false;
  @state() private _success = false;
  @state() private _error = '';

  async connectedCallback() {
    super.connectedCallback();
    try {
      const { profile } = await fetchProfile();
      this._profile = profile ?? {};
    } catch {
      // perfil vacío si falla
    } finally {
      this._loading = false;
    }
  }

  private _set(field: keyof FinancialProfileData, value: unknown) {
    this._profile = { ...this._profile, [field]: value || undefined };
    this._success = false;
  }

  private _toggleGoal(value: string) {
    const current = this._profile.goals ?? [];
    const next = current.includes(value)
      ? current.filter(g => g !== value)
      : [...current, value];
    this._set('goals', next.length ? next : undefined);
  }

  private async _save(e: Event) {
    e.preventDefault();
    this._saving = true;
    this._error = '';
    this._success = false;
    try {
      await upsertProfile(this._profile);
      this._success = true;
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Error al guardar';
    } finally {
      this._saving = false;
    }
  }

  private async _clear() {
    this._saving = true;
    this._error = '';
    this._success = false;
    try {
      await upsertProfile({});
      this._profile = {};
      this._success = true;
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Error al borrar';
    } finally {
      this._saving = false;
    }
  }

  render() {
    if (this._loading) return html`<p style="color:var(--color-text-muted);font-size:var(--text-sm)">Cargando...</p>`;

    const p = this._profile;

    return html`
      <h1>Mi Perfil Financiero</h1>
      <p class="subtitle">Información personal para mejorar las recomendaciones del agente IA.</p>

      <div class="info-row">
        <span class="info-icon">ℹ</span>
        <p>
          Esta información es <strong>completamente opcional</strong> y solo vos podés verla.
          Ayuda al agente IA a darte recomendaciones más precisas y personalizadas según tu situación.
        </p>
      </div>

      <form @submit="${this._save}">
        <div class="section">
          <div class="section-title">Datos personales</div>
          <div class="grid-2">
            <div class="field">
              <label>Edad</label>
              <input
                type="number" min="18" max="99" placeholder="32"
                .value="${p.age?.toString() ?? ''}"
                @input="${(e: InputEvent) => this._set('age', parseInt((e.target as HTMLInputElement).value) || undefined)}"
              />
            </div>
            <div class="field">
              <label>Preferencia de moneda</label>
              <select
                .value="${p.currency_preference ?? ''}"
                @change="${(e: Event) => this._set('currency_preference', (e.target as HTMLSelectElement).value || undefined)}"
              >
                <option value="">Sin preferencia</option>
                <option value="ARS" ?selected="${p.currency_preference === 'ARS'}">Pesos (ARS)</option>
                <option value="USD" ?selected="${p.currency_preference === 'USD'}">Dólares (USD)</option>
                <option value="ambas" ?selected="${p.currency_preference === 'ambas'}">Ambas</option>
              </select>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Situación económica</div>
          <div class="grid-2">
            <div class="field">
              <label>Ingreso mensual (ARS)</label>
              <input
                type="number" min="0" placeholder="500000"
                .value="${p.monthly_income_ars?.toString() ?? ''}"
                @input="${(e: InputEvent) => this._set('monthly_income_ars', parseFloat((e.target as HTMLInputElement).value) || undefined)}"
              />
              <span class="hint">Ingreso neto aproximado</span>
            </div>
            <div class="field">
              <label>Capacidad de ahorro mensual (ARS)</label>
              <input
                type="number" min="0" placeholder="150000"
                .value="${p.savings_capacity_ars?.toString() ?? ''}"
                @input="${(e: InputEvent) => this._set('savings_capacity_ars', parseFloat((e.target as HTMLInputElement).value) || undefined)}"
              />
              <span class="hint">Cuánto podés destinar a inversiones por mes</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Perfil inversor</div>
          <div class="grid-2">
            <div class="field">
              <label>Aversión al riesgo</label>
              <select
                .value="${p.risk_aversion ?? ''}"
                @change="${(e: Event) => this._set('risk_aversion', (e.target as HTMLSelectElement).value || undefined)}"
              >
                <option value="">Sin definir</option>
                <option value="bajo" ?selected="${p.risk_aversion === 'bajo'}">Bajo — prefiero mayor rendimiento</option>
                <option value="medio" ?selected="${p.risk_aversion === 'medio'}">Medio — balance entre riesgo y retorno</option>
                <option value="alto" ?selected="${p.risk_aversion === 'alto'}">Alto — priorizo preservar capital</option>
              </select>
            </div>
            <div class="field">
              <label>Horizonte de inversión (meses)</label>
              <input
                type="number" min="1" placeholder="24"
                .value="${p.investment_horizon_months?.toString() ?? ''}"
                @input="${(e: InputEvent) => this._set('investment_horizon_months', parseInt((e.target as HTMLInputElement).value) || undefined)}"
              />
              <span class="hint">En cuánto tiempo necesitás los fondos</span>
            </div>
          </div>

          <div class="field" style="margin-top: var(--space-4)">
            <label>Objetivos financieros</label>
            <div class="goals-grid">
              ${GOALS_OPTIONS.map(g => html`
                <div
                  class="goal-chip ${(p.goals ?? []).includes(g.value) ? 'selected' : ''}"
                  @click="${() => this._toggleGoal(g.value)}"
                >
                  ${g.label}
                </div>
              `)}
            </div>
          </div>
        </div>

        ${this._success ? html`<div class="success-msg">Perfil guardado correctamente.</div>` : ''}
        ${this._error ? html`<div class="error-msg">${this._error}</div>` : ''}

        <div class="actions">
          <button class="btn-primary" type="submit" ?disabled="${this._saving}">
            ${this._saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
          <button class="btn-ghost" type="button" @click="${this._clear}" ?disabled="${this._saving}">
            Borrar perfil
          </button>
        </div>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-financial-profile': AcFinancialProfile;
  }
}
