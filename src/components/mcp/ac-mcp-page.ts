import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { supabase } from '@/lib/supabase';

@customElement('ac-mcp-page')
export class AcMcpPage extends LitElement {
  @state() private _token = '<supabase-jwt>';
  @state() private _copied = false;

  private get _backendUrl(): string {
    const env = import.meta.env.VITE_API_URL as string | undefined;
    return env ? env.replace(/\/$/, '') : window.location.origin;
  }

  private get _mcpUrl(): string {
    return `${this._backendUrl}/mcp`;
  }

  async connectedCallback() {
    super.connectedCallback();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) this._token = data.session.access_token;
  }

  private async _copy(text: string) {
    await navigator.clipboard.writeText(text);
    this._copied = true;
    setTimeout(() => { this._copied = false; }, 1500);
  }
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
      margin-bottom: var(--space-6);
    }

    .section-title {
      font-size: var(--text-lg);
      font-weight: 600;
      margin-bottom: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .section-title .icon {
      font-size: var(--text-xl);
    }

    p {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      line-height: 1.6;
      margin-bottom: var(--space-4);
    }

    p:last-child { margin-bottom: 0; }

    .url-block {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-4);
    }

    .url-block code {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-primary-light);
      flex: 1;
    }

    .badge {
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-primary) 20%, transparent);
      color: var(--color-primary-light);
      border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
      flex-shrink: 0;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);
    }

    .tool-card {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
    }

    .tool-name {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-primary-light);
      font-weight: 600;
      margin-bottom: var(--space-2);
    }

    .tool-desc {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      line-height: 1.5;
      margin-bottom: var(--space-3);
    }

    .tool-params {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .param {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-surface-raised) 80%, transparent);
      color: var(--color-text-subtle);
      border: 1px solid var(--color-border);
    }

    .param.required {
      color: var(--color-warning);
      border-color: color-mix(in srgb, var(--color-warning) 30%, transparent);
      background: color-mix(in srgb, var(--color-warning) 10%, transparent);
    }

    .code-block {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      line-height: 1.7;
      overflow-x: auto;
      white-space: pre;
    }

    .code-block .key   { color: var(--color-primary-light); }
    .code-block .str   { color: var(--color-success); }
    .code-block .punct { color: var(--color-text-subtle); }

    .info-row {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      padding: var(--space-3) var(--space-4);
      background: color-mix(in srgb, var(--color-info) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-info) 25%, transparent);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
    }

    .info-row .info-icon {
      color: var(--color-info);
      font-size: var(--text-base);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .info-row p {
      margin: 0;
      color: var(--color-info);
      font-size: var(--text-xs);
      line-height: 1.5;
    }

    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .endpoint-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .method {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      min-width: 44px;
      text-align: center;
    }
    .method.get  { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 12%, transparent); }
    .method.post { color: var(--color-warning);  background: color-mix(in srgb, var(--color-warning) 12%, transparent); }
    .method.patch{ color: var(--color-info);     background: color-mix(in srgb, var(--color-info) 12%, transparent); }
    .method.del  { color: var(--color-danger);   background: color-mix(in srgb, var(--color-danger) 12%, transparent); }

    .endpoint-path {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      flex: 1;
    }

    .endpoint-label {
      font-size: var(--text-xs);
      color: var(--color-text-subtle);
    }

    .copy-btn {
      font-size: var(--text-xs);
      padding: 3px var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      flex-shrink: 0;
    }
    .copy-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }
  `;

  render() {
    return html`
      <h1>MCP</h1>
      <p class="subtitle">
        Model Context Protocol — conecta tu agente de IA a los datos financieros de AssetCentral.
      </p>

      <!-- Conexión -->
      <div class="section">
        <div class="section-title">
          <span class="icon">⬡</span> Cómo conectarse
        </div>

        <div class="info-row">
          <span class="info-icon">ℹ</span>
          <p>
            El servidor MCP está montado directamente sobre la API de AssetCentral usando
            <strong>fastapi-mcp</strong>. Se expone en el mismo host que el backend,
            en el path <code>/mcp</code>.
          </p>
        </div>

        <p>URL del servidor:</p>
        <div class="url-block">
          <code>${this._mcpUrl}</code>
          <span class="badge">Streamable HTTP</span>
          <button class="copy-btn" @click="${() => this._copy(this._mcpUrl)}">
            ${this._copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <p>Configuración en Claude Code o cualquier cliente MCP compatible:</p>
        <div class="code-block"><span class="punct">{</span>
  <span class="key">"mcpServers"</span><span class="punct">:</span> <span class="punct">{</span>
    <span class="key">"assetcentral"</span><span class="punct">:</span> <span class="punct">{</span>
      <span class="key">"type"</span><span class="punct">:</span> <span class="str">"http"</span><span class="punct">,</span>
      <span class="key">"url"</span><span class="punct">:</span>  <span class="str">"${this._mcpUrl}"</span>
    <span class="punct">}</span>
  <span class="punct">}</span>
<span class="punct">}</span></div>
        <button class="copy-btn" style="margin-top:var(--space-2)" @click="${() => this._copy(`{\n  "mcpServers": {\n    "assetcentral": {\n      "type": "http",\n      "url": "${this._mcpUrl}"\n    }\n  }\n}`)}">
          Copiar configuración
        </button>

        <p>
          La autenticación es automática vía OAuth: la primera vez que conectes, Claude Code
          abrirá el navegador para que autorices el acceso. La sesión se renueva sola.
        </p>
      </div>

      <!-- Tools dedicados -->
      <div class="section">
        <div class="section-title">
          <span class="icon">◈</span> Tools financieros
        </div>

        <p>
          Además de los endpoints REST, el servidor expone tres tools de alto nivel
          diseñados específicamente para que un agente de IA consulte el contexto financiero del usuario.
        </p>

        <div class="tools-grid">
          <div class="tool-card">
            <div class="tool-name">get_financial_summary</div>
            <div class="tool-desc">
              Resumen financiero total: totales en ARS y USD, distribución por tipo de activo
              y cantidad de posiciones activas.
            </div>
            <div class="tool-params">
              <span class="param required">user_id*</span>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-name">get_assets</div>
            <div class="tool-desc">
              Lista de activos con posición actual: ticker, nombre, plataforma, moneda,
              cantidad, precio unitario y valuación total. Filtrable por tipo.
            </div>
            <div class="tool-params">
              <span class="param required">user_id*</span>
              <span class="param">asset_type?</span>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-name">get_portfolios</div>
            <div class="tool-desc">
              Lista los portfolios del usuario con su valuación consolidada en ARS y USD,
              cantidad de activos y metadata.
            </div>
            <div class="tool-params">
              <span class="param required">user_id*</span>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-name">get_user_financial_profile</div>
            <div class="tool-desc">
              Perfil financiero personal del usuario: edad, ingresos, capacidad de ahorro,
              aversión al riesgo, horizonte de inversión y objetivos. Usar como contexto
              para recomendaciones personalizadas.
            </div>
            <div class="tool-params">
              <span class="param required">user_id*</span>
            </div>
          </div>
        </div>

        <p style="margin-top: var(--space-4); margin-bottom: 0;">
          Los tipos de activo válidos para el filtro de <code>get_assets</code> son:
          <code>cedear</code>, <code>bono</code>, <code>fci</code>, <code>cash</code>,
          <code>crypto</code>, <code>stock</code>.
        </p>
      </div>

      <!-- Endpoints REST auto-expuestos -->
      <div class="section">
        <div class="section-title">
          <span class="icon">◎</span> Endpoints REST auto-expuestos
        </div>

        <p>
          <strong>fastapi-mcp</strong> convierte automáticamente todos los endpoints de la API
          en tools MCP, incluyendo sus esquemas de request/response.
          El agente puede invocarlos directamente sin configuración adicional.
        </p>

        <div class="endpoint-list">
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/assets</span>
            <span class="endpoint-label">Activos consolidados del usuario</span>
          </div>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/accounts</span>
            <span class="endpoint-label">Cuentas vinculadas</span>
          </div>
          <div class="endpoint-row">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/accounts</span>
            <span class="endpoint-label">Vincular nueva cuenta</span>
          </div>
          <div class="endpoint-row">
            <span class="method del">DELETE</span>
            <span class="endpoint-path">/api/accounts/{id}</span>
            <span class="endpoint-label">Desvincular cuenta</span>
          </div>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/portfolios</span>
            <span class="endpoint-label">Lista de portfolios</span>
          </div>
          <div class="endpoint-row">
            <span class="method post">POST</span>
            <span class="endpoint-path">/api/portfolios</span>
            <span class="endpoint-label">Crear portfolio</span>
          </div>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/portfolios/{id}/summary</span>
            <span class="endpoint-label">Valuación de un portfolio</span>
          </div>
          <div class="endpoint-row">
            <span class="method patch">PATCH</span>
            <span class="endpoint-path">/api/portfolios/{id}</span>
            <span class="endpoint-label">Editar portfolio</span>
          </div>
          <div class="endpoint-row">
            <span class="method del">DELETE</span>
            <span class="endpoint-path">/api/portfolios/{id}</span>
            <span class="endpoint-label">Eliminar portfolio</span>
          </div>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <span class="endpoint-path">/api/profile</span>
            <span class="endpoint-label">Perfil financiero del usuario</span>
          </div>
          <div class="endpoint-row">
            <span class="method patch">PUT</span>
            <span class="endpoint-path">/api/profile</span>
            <span class="endpoint-label">Guardar perfil financiero</span>
          </div>
        </div>
      </div>

      <!-- System prompt -->
      <div class="section">
        <div class="section-title">
          <span class="icon">✦</span> System prompt para el agente
        </div>
        <p>
          Copiá este system prompt al configurar tu agente de IA (Claude, GPT, etc.) para que entienda
          cómo usar el MCP Server de AssetCentral.
        </p>
        <div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-2)">
          <button class="copy-btn" @click="${() => this._copy(this._systemPrompt)}">
            ${this._copied ? 'Copiado ✓' : 'Copiar system prompt'}
          </button>
        </div>
        <div class="code-block" style="white-space:pre-wrap;max-height:320px;overflow-y:auto">${this._systemPrompt}</div>
      </div>
    `;
  }

  private get _systemPrompt(): string {
    return `---
  Eres un asistente financiero integrado a AssetCentral, una plataforma argentina de gestión de inversiones. Tenés
  acceso a un MCP Server (Model Context Protocol) que te conecta en tiempo real con los datos del usuario autenticado.

  ## Autenticación

  Cada request al MCP llega con un JWT de Supabase Auth del usuario que inició sesión. El servidor extrae el \`sub\` del
  JWT y lo usa internamente como \`user_id\` en todas las queries. Nunca se te pasa ni se te pide el \`user_id\` como
  argumento — ya está implícito en la sesión. Si llamás una tool sin JWT válido, devuelve \`Unauthorized\`.

  ## Tools disponibles

  ### \`get_user_financial_profile\` — sin argumentos
  Devuelve el perfil financiero auto-declarado del usuario autenticado desde \`public.users.financial_profile\` (JSONB):
  - \`age\`: edad
  - \`monthly_income_ars\`: ingreso mensual en ARS
  - \`savings_capacity_ars\`: capacidad de ahorro mensual en ARS
  - \`risk_aversion\`: \`"bajo"\` | \`"medio"\` | \`"alto"\`
  - \`investment_horizon_months\`: horizonte de inversión en meses
  - \`goals\`: lista de objetivos (ej: \`["retiro", "vivienda"]\`)
  - \`currency_preference\`: \`"ARS"\` | \`"USD"\` | \`"ambas"\`

  Devuelve \`_Financial profile not completed yet._\` si el usuario no lo llenó. Usá este perfil para personalizar
  cualquier recomendación.

  ### \`get_user_portfolio_summary\` — argumentos opcionales: \`limit\` (default 50), \`cursor\`
  Devuelve una tabla Markdown con el snapshot financiero del usuario autenticado desde la vista desnormalizada
  \`llm_user_account_balances_view\`. Cada fila es una posición. Campos relevantes incluyen \`asset_ticker\`, \`asset_type\`,
  \`platform\`, \`currency\`, \`quantity\`, \`unit_price\`, \`total_valuation\`.

  Si la respuesta incluye \`**nextCursor:** \\\`xxx\\\`\`, paginá con ese valor en el próximo llamado. Iterá hasta obtener
  todas las posiciones antes de analizar.

  Valores de \`asset_type\`: \`stock\` (acciones BYMA), \`cedear\` (acciones extranjeras en ARS), \`bono\` (bonos
  soberanos/corporativos), \`fci\` (fondos comunes), \`crypto\`, \`cash\`.
  Valores de \`platform\`: \`cocos\`, \`iol\`, \`mercadopago\`, \`nacion\`.
  Valores de \`currency\`: \`ARS\`, \`USD\`.

  ### \`search_global_assets\` — argumento requerido: \`query\`; opcionales: \`limit\` (1–50, default 10), \`cursor\`, \`query_embedding\`
  Búsqueda híbrida RRF (BM25 + pgvector semántico) sobre el catálogo global de activos. Devuelve tabla Markdown con
  resultados. Usá para encontrar instrumentos concretos cuando necesitás sugerir alternativas o completar un análisis.
  Admite paginación con \`nextCursor\`.

  ### \`get_database_schema\` — sin argumentos
  Devuelve el esquema completo de la base de datos de AssetCentral (tablas, columnas, tipos, comentarios semánticos).
  Usalo solo si necesitás entender el modelo de datos antes de interpretar resultados.

  ## Recursos MCP (si el host los inyecta)

  - \`docs://schema/assetcentral\` — mismo contenido que \`get_database_schema\`
  - \`docs://reference/enums\` — valores canónicos de plataformas, tipos de activo, monedas
  - \`docs://users/{user_id}/profile\` — perfil e identidad del usuario (solo el propio UUID)

  ## Prompts disponibles (templates pre-armados)

  Podés invocarlos vía \`prompts/get\`:

  | Nombre | Argumentos requeridos | Qué hace |
  |---|---|---|
  | \`hedge_instrument\` | \`instrument\` | Plan de cobertura frente a un activo (dólar, GGAL, BTC, etc.) |
  | \`liquidity_analysis\` | — | Análisis t+0 / t+1 / t+2 del mercado argentino |
  | \`portfolio_diversification\` | — (opcional: \`portfolio_id\`) | HHI + análisis en 4 dimensiones |
  | \`investment_recommendations\` | \`risk_profile\` (\`conservador\`/\`moderado\`/\`agresivo\`) | Recomendaciones vs asignación objetivo |

  ## Reglas de comportamiento

  1. **Nunca inventes datos financieros.** Toda información de posiciones o perfil debe venir de las tools. Si devuelven vacío, reportalo.
  2. **Siempre paginá** \`get_user_portfolio_summary\` si hay \`nextCursor\` antes de hacer cálculos agregados.
  3. **Llamá \`get_user_financial_profile\` primero** en cualquier análisis o recomendación para personalizar por perfil de riesgo, horizonte e ingresos.
  4. **Contexto argentino:** los montos en ARS son nominales y se deprecian rápido. Cuando sea posible, expresá valuaciones también en USD. Los plazos de liquidación locales son t+0 (cash/FCIs), t+1 (acciones BYMA/LECAP), t+2 (CEDEARs/bonos USD).
  5. **Al recomendar**, siempre terminá con una advertencia sobre volatilidad del mercado argentino y que se recomienda consultar un asesor financiero matriculado (CNV).
  6. **No podés leer datos de otro usuario.** El servidor enforce esto a nivel de JWT — todas las queries ya filtran por el usuario autenticado.

  ---
  Este prompt le explica a otro modelo exactamente qué herramientas tiene, cómo funciona la auth, qué esperar como
  output de cada tool, y las reglas de uso. No incluye nada que deba mantenerse secreto (claves, IDs, etc.).`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ac-mcp-page': AcMcpPage;
  }
}
