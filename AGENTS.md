# AppFinanzas - Agent Guide

## Quick Commands

```bash
npm install          # Install deps
npm run dev          # Dev server (Next.js)
npm run build        # Production build — MUST pass before commit
npx tsc --noEmit     # Typecheck
npm run lint         # ESLint (next/core-web-vitals + typescript)
```

No test suite. Verify with: `npx tsc --noEmit && npm run build`

## Architecture

- **Next.js 16 (App Router)** + React 19 + TypeScript
- **No backend** — Google Sheets API called directly from client
- **No Apps Script** — all business logic lives in the app
- **PWA** — installable from Safari on iOS
- **Deployed on Vercel** (auto-deploy from master)
- Google OAuth flow: `/auth/google` → Google → `/auth/callback` → saves token to `sessionStorage` → redirects

## Critical: Zustand Persist Migration

`src/stores/app-store.ts` uses `zustand/persist`. The schema changed in `b705cdc`:
- Old: `dashboardConfig.chartType: "categories" | "expenses" | "savings"`
- New: `dashboardConfig.charts: DashboardChart[]`

**BUG**: No `version`/`migrate` in persist config. Default shallow merge drops `charts` key for returning users. The `onRehydrateStorage` callback (line 278-298) patches missing `charts` but runs async.

**Fix**: Add `version` + `merge` option to the persist config, OR make `page.tsx` use `(dashboardConfig.charts ?? DEFAULT_DASHBOARD_CONFIG.charts)` as fallback everywhere.

## Data Flow

```
Google Sheet (source of truth)
  ↕ read/write
src/lib/sheets/ (adapters: parse rows → typed objects)
  ↕
src/features/*/hooks/ (React Query hooks: useTransactions, useCategories, etc.)
  ↕
src/app/page.tsx (dashboard) + other pages
  ↕
src/stores/app-store.ts (Zustand: connection state, config, salary tracking)
```

## File Structure

- `src/app/` — Next.js pages (App Router)
- `src/features/` — Domain modules (transactions, categories, accounts, etc.)
- `src/lib/sheets/` — Google Sheets API client + row adapters
- `src/lib/finance/` — Pure calculation functions (calculations.ts, salary.ts, chart-data.ts)
- `src/stores/` — Zustand store (single store, persist middleware)
- `src/components/` — Shared UI components
- `src/components/dashboard/` — Dashboard-specific components (chart-renderer, savings-panel, customizer)
- `src/types/` — Shared TypeScript types

## Conventions

- **Spanish UI**, English internal code (type names, function names)
- Sheet data uses Spanish headers: `Fecha`, `Concepto`, `Importe`, `Tipo`, `Categoría`
- Transaction types: `Ingreso`, `Gasto`, `Ahorro` (enum `TransactionType`)
- Payment methods: Tarjeta, Efectivo, Bizum, Transferencia, Domiciliación, Otro
- Currency: EUR (hardcoded in store default)
- All form validation via Zod schemas in `src/schemas/`

## OAuth Gotchas

- Token stored in `sessionStorage` (clears on tab close)
- No proactive token check in `client-layout.tsx` — app tries API calls, handles 401/403 at call site
- `SheetsApiError.isAuthError()` helper exists in `src/lib/sheets/client.ts`
- If user sees auth error → redirect to `/onboarding?error=auth_failed`
- Never commit `.env.local` or secrets

## Charts

- `ChartRenderer` component: bar/pie/area/line via Recharts
- `getChartData()` in `src/lib/finance/chart-data.ts` — 8 data sources
- `dashboardConfig.charts` is an array of `DashboardChart` objects
- Dashboard renders `charts[0]` only (single chart display)

## Deps Quirks

- All deps use `"latest"` in package.json (risky but current convention)
- `postcss` pinned to `8.5.15` via overrides
- `@tanstack/react-query@5` — `QueryClient` does NOT support `defaultOptions.queries.onError` in v5
- `zustand` latest — persist middleware default merge is **shallow** (not deep)

# Agent Rules — Finance Logic

Before modifying any of the following areas, read `docs/FINANCE_LOGIC.md`:

- financial calculations;
- dashboard metrics;
- available balance logic;
- salary/payroll logic;
- savings/reserves/goals logic;
- fixed expenses logic;
- future payments logic;
- deferred/installment payments logic;
- movement creation/editing logic;
- Google Sheet schema, readers, writers or validation;
- account balance or account role logic.

`docs/FINANCE_LOGIC.md` is the compact source of truth. Use the other files only
when you actually need them:

- `docs/FINANCE_AUDIT.md` — historical findings and "why was this changed" context.
  Read only when auditing old code or checking that a past finding is resolved.
- `docs/FINANCE_IMPLEMENTATION.md` — phase tracker, main files per phase,
  conventions, IDs and Config keys. Read only when checking phase status or
  implementation history.
- `docs/FINANCE_LOGIC.backup.md` — full snapshot of `FINANCE_LOGIC.md` from the
  last time the official logic was rewritten.

Do not read `FINANCE_AUDIT.md` or `FINANCE_IMPLEMENTATION.md` for purely visual
changes such as spacing, colors, minor layout tweaks or copy-only changes. Do
not read any finance doc when the change is purely visual.

When changing the official finance logic:

1. Copy the current content of `docs/FINANCE_LOGIC.md` into
   `docs/FINANCE_LOGIC.backup.md`.
2. Update `docs/FINANCE_LOGIC.md` with the new official logic. Keep it concise.
3. If the change resolves a known audit finding, update the status marker in
   `docs/FINANCE_AUDIT.md`.
4. If the change is part of a phase, update the phase status in
   `docs/FINANCE_IMPLEMENTATION.md`.

The official data source is the app Google Sheet template / connected Google
Sheet. The Sheet is the database; the app owns the business logic. Do not
reference any personal spreadsheet or user file in project docs.

