# AssetCentral — Frontend

Frontend del proyecto AssetCentral. Web Components con Lit 3, TypeScript y Vite.

## Requisitos

- Node.js >= 18
- npm >= 9

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Levanta el dev server en `http://localhost:3000`.

Las llamadas a `/api/*` se redirigen automáticamente al backend en `http://localhost:8000`. El backend debe estar corriendo para que los datos carguen.

## Build para producción

```bash
npm run build
```

La salida queda en `dist/`. Para previsualizarla localmente:

```bash
npm run preview
```

## Estructura del proyecto

```
src/
├── main.ts               # Punto de entrada, inicializa el router
├── types/                # Interfaces TypeScript compartidas
├── services/             # Llamadas HTTP al backend (fetch)
├── store/                # Estado global con @lit-labs/context
├── styles/               # Design tokens y CSS global
└── components/
    ├── app/              # Root component + navegación
    ├── dashboard/        # Vista principal con métricas y gráfico
    ├── assets/           # Lista y detalle de activos
    ├── accounts/         # Vinculación de cuentas de brokers
    └── portfolios/       # Gestión de portfolios
```

## Stack

| Herramienta | Rol |
|---|---|
| Vite | Dev server y bundler |
| Lit 3 + TypeScript | Web Components |
| `@vaadin/router` | Routing declarativo |
| `@lit-labs/context` | Estado global reactivo |
| Chart.js | Gráficos del dashboard |
| `@supabase/supabase-js` | Autenticación |
