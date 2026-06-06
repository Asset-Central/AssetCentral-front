# Plan de Arquitectura Frontend — AssetCentral

## Stack

| Herramienta | Rol |
|---|---|
| **Vite** | Build tool / dev server (soporte nativo para Lit) |
| **Lit 3 + TypeScript** | Framework de Web Components |
| **`@vaadin/router`** | Router declarativo, diseñado para Web Components |
| **`@lit-labs/context`** | Estado global reactivo sin Redux ni stores externos |
| **`chart.js`** | Gráficos del dashboard |
| **`@supabase/supabase-js`** | Cliente de Supabase para auth y datos |

---

## Estructura de carpetas

```
front/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
│
└── src/
    ├── main.ts                    # Punto de entrada, instancia el router
    │
    ├── types/                     # Interfaces TypeScript compartidas
    │   ├── asset.ts               # Asset, AssetType, AssetGroup
    │   ├── account.ts             # LinkedAccount, Platform
    │   └── portfolio.ts           # Portfolio, PortfolioSummary
    │
    ├── services/                  # Capa de acceso a datos (fetch al backend FastAPI)
    │   ├── asset.service.ts
    │   ├── account.service.ts
    │   └── portfolio.service.ts
    │
    ├── store/                     # Estado global con @lit-labs/context
    │   └── app.context.ts         # Contexto raíz: activos, cuentas, portfolios
    │
    ├── styles/                    # Design tokens y CSS global
    │   ├── tokens.css             # Variables: colores, spacing, tipografía
    │   └── global.css
    │
    └── components/
        ├── app/
        │   ├── ac-app.ts          # Root component: router outlet + contexto
        │   └── ac-nav.ts          # Navegación lateral/superior
        │
        ├── dashboard/             # MÓDULO 1
        │   ├── ac-dashboard.ts           # Página principal (contenedor)
        │   ├── ac-total-valuation.ts     # Tarjeta: valor total consolidado
        │   ├── ac-performance-badge.ts   # Variación diaria/mensual (+/- %)
        │   └── ac-distribution-chart.ts  # Chart.js: torta por tipo de activo
        │
        ├── assets/                # MÓDULO 2
        │   ├── ac-asset-list.ts          # Lista filtrable y ordenable de activos
        │   ├── ac-asset-card.ts          # Tarjeta individual de un activo
        │   └── ac-asset-type-badge.ts    # Badge: CEDEAR | BONO | FCI | USD | etc.
        │
        ├── accounts/              # MÓDULO 3
        │   ├── ac-accounts-page.ts       # Página de cuentas vinculadas
        │   ├── ac-account-card.ts        # Tarjeta con estado de una cuenta
        │   ├── ac-link-wizard.ts         # Wizard paso a paso para vincular
        │   └── ac-credential-form.ts     # Formulario de credenciales por plataforma
        │
        ├── portfolios/            # MÓDULO 4
        │   ├── ac-portfolio-manager.ts   # Página: lista de portfolios del usuario
        │   ├── ac-portfolio-card.ts      # Tarjeta resumen de un portfolio
        │   ├── ac-portfolio-detail.ts    # Vista detallada de un portfolio
        │   └── ac-portfolio-form.ts      # Modal/form para crear/editar portfolio
        │
        └── common/                # Componentes atómicos reutilizables
            ├── ac-spinner.ts
            ├── ac-button.ts
            ├── ac-modal.ts
            └── ac-empty-state.ts
```

---

## Jerarquía de componentes y rutas

```
<ac-app>  ← contexto global, router outlet
 ├── /dashboard      → <ac-dashboard>
 │     ├── <ac-total-valuation>
 │     ├── <ac-performance-badge>
 │     ├── <ac-distribution-chart>
 │     └── <ac-asset-list> (resumen, top 5)
 │
 ├── /assets         → <ac-asset-list> (completa)
 │     └── <ac-asset-card> × N
 │           └── <ac-asset-type-badge>
 │
 ├── /accounts       → <ac-accounts-page>
 │     ├── <ac-account-card> × N
 │     └── <ac-link-wizard>
 │           └── <ac-credential-form>
 │
 └── /portfolios     → <ac-portfolio-manager>
       ├── <ac-portfolio-card> × N
       └── /portfolios/:id → <ac-portfolio-detail>
             └── <ac-asset-list> (filtrada por portfolio)
```

---

## Estado global con `@lit-labs/context`

`app.context.ts` define un `Context<AppState>` con:
- `assets: Asset[]` — todos los activos consolidados
- `accounts: LinkedAccount[]` — cuentas vinculadas
- `portfolios: Portfolio[]` — portfolios del usuario
- `isLoading: boolean`

`<ac-app>` es el **provider** del contexto. Hace los fetches iniciales y los almacena.
Cualquier componente hijo usa `@consume({ context: appContext })` para leer o mutar el estado sin prop-drilling.

---

## Flujo de datos

```
FastAPI Backend
     ↓  HTTP (fetch)
services/*.service.ts
     ↓  popula
app.context.ts  (provider en <ac-app>)
     ↓  @consume
Cualquier componente que lo necesite
```

Supabase se usa **solo** para autenticación de usuario (JWT). Los datos de activos vienen del backend FastAPI.

---

## División del trabajo

| Miembro | Módulo | Componentes |
|---|---|---|
| **Dev 1** | Dashboard + Charts | `ac-dashboard`, `ac-total-valuation`, `ac-performance-badge`, `ac-distribution-chart` |
| **Dev 2** | Activos | `ac-asset-list`, `ac-asset-card`, `ac-asset-type-badge` |
| **Dev 3** | Vinculación de cuentas | `ac-accounts-page`, `ac-account-card`, `ac-link-wizard`, `ac-credential-form` |
| **Dev 4** | Portfolios + infraestructura | `ac-portfolio-manager`, `ac-portfolio-card`, `ac-portfolio-detail`, `ac-portfolio-form` + setup de `store/` y `services/` |

---

## Pasos de inicialización

- [x] Guardar este plan
- [ ] Crear proyecto con Vite (`lit-ts` template)
- [ ] Instalar dependencias
- [ ] Configurar `tsconfig.json` y `vite.config.ts`
- [ ] Crear design tokens CSS
- [ ] Implementar `ac-app.ts` con router y contexto
- [ ] Implementar `ac-nav.ts`
- [ ] Generar stubs de cada módulo
