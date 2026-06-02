# Finance Audit — AppFinanciera

This file is the **historical implementation audit** of AppFinanciera. It captures the
findings that were surfaced while reviewing the codebase and indicates which ones are
already fixed.

**Read this file only when:**

- auditing old code or understanding why a past decision was made;
- verifying that a previous finding is actually resolved;
- preparing a refactor that touches legacy code.

**Do not read this file** for simple visual changes, copy edits, or anything that does
not touch finance logic.

The official current rules live in `docs/FINANCE_LOGIC.md`. The phase history lives in
`docs/FINANCE_IMPLEMENTATION.md`.

## Status legend

- `resolved` — fixed in a completed phase.
- `partially resolved` — main gap is fixed, only cosmetic or follow-up work remains.
- `pending` — known gap, scheduled for a future phase.
- `obsolete` — finding no longer applies (renamed file, refactored module, etc.).

---

## A1. Dashboard calculations — `pending` (Phase 8)

- **Source**: `src/app/page.tsx`, `src/components/dashboard/savings-panel-expanded.tsx`, `src/lib/finance/calculations.ts`, `src/lib/finance/chart-data.ts`.
- **Original finding**:
  - The "Disponible" formula lived inline in `page.tsx:260-262`.
  - Different components recomputed their own slices.
  - The "Plan de ahorro" widget used 20% of a single base, ignoring already-executed savings.
  - The chart `dataSource: "categories"` was hardcoded in `page.tsx:292-296`.
  - No explanation modal behind "Disponible".
- **Current state**:
  - The central engine now owns the formula (`src/lib/finance/finance-engine.ts`, `getAvailableBalance`).
  - `useFinanceSummary` wires the engine into the dashboard.
  - "Disponible" still does not open an in-app explanation modal.
  - The dashboard still does not render the engine output end-to-end.
- **Next step**: Phase 8 — dashboard consumes the engine output and exposes the explanation.

## A2. Salary / payroll logic — `resolved` (Phase 5)

- **Source**: `src/lib/finance/salary.ts`, `src/features/salary/*`, `src/app/more/salary/page.tsx`, `src/stores/app-store.ts`.
- **Original finding**:
  - `shouldAddSalaryToday` only added the salary on day 1.
  - The ID was timestamp-based (`TX-SALARY-${Date.now()}`), not deterministic.
  - Duplicate prevention relied on a local Zustand array.
  - Config was only in localStorage / Zustand, not in the Sheet.
  - Variable salary had no UI.
  - The salary movement had no `cuentaDestino`.
- **Current state**:
  - Config lives in the `Config` sheet (`salary.*` keys).
  - ID is the deterministic `TX-SALARY-YYYY-MM`.
  - `ensureSalaryForMonth` runs on any day the user opens the app for the current month.
  - `saveVariableSalaryForMonth` upserts the same deterministic ID.
  - Destination account is required and validated.
  - Zustand keeps a cache only; the Sheet is the source of truth.
- **See**: `FINANCE_LOGIC.md` sections 4.1, 4.2 and 4.3.

## A3. Movements / transactions — `pending` (Phase 9)

- **Source**: `src/features/transactions/hooks/use-transactions.ts`, `src/features/transactions/components/transaction-form.tsx`, `src/schemas/transaction*`.
- **Original finding**:
  - Form had no required differentiation per type (Income / Expense / Saving / Transfer).
  - Saving did not require a `reservaId` or destination.
  - Edit did not refetch.
  - Query-param filters in `/transactions` (e.g. `?filterType=Ingreso`) were not implemented.
- **Current state**:
  - Hooks and schemas unchanged.
  - Form branches by type remain in Phase 9 scope.
- **Next step**: Phase 9.

## A4. Fixed expenses — `resolved` (Phase 6)

- **Source**: `src/features/fixed-expenses/*`, `src/lib/finance/fixed-expense-confirmation.ts`, `src/app/fixed-expenses/confirm/page.tsx`, `src/hooks/use-finance-summary.ts`.
- **Original finding**:
  - There was no confirmation flow. The app only stored the definition; it never created a monthly movement.
  - The model had no per-month confirmation state.
  - There was no pending vs. confirmed split.
- **Current state**:
  - `/fixed-expenses/confirm` review screen exists and is reachable from `/fixed-expenses` and `/more`.
  - Confirmation creates a deterministic `Movimientos` row with `id = TX-FIJO-YYYY-MM-fijoId`.
  - `Config.fixed.confirmed.YYYY-MM` is the fast cache of confirmed `fijoId`s.
  - `useFinanceSummary` passes `confirmedFixedExpenseIds` to the engine, so dashboard `Disponible` correctly splits confirmed from pending.
  - Bulk confirm and per-item unconfirm both work.
- **Known follow-up (cosmetic)**:
  - "Desconfirmar" still uses `window.confirm`. Will be replaced by a styled dialog in Phase 11.
  - Stale `Config` keys for past months are not pruned. Acceptable because reads only run for the selected month.
- **See**: `FINANCE_LOGIC.md` section 5.2.

## A5. Future payments — `resolved` (Phase 7)

- **Source**: `src/features/future-payments/*`, `src/features/savings/*`, `src/lib/finance/savings-ledger.ts`, `src/lib/finance/finance-engine.ts`.
- **Original finding**:
  - `mesesRestantes` and `aporteMensual` were stored manually.
  - `saldoReservado` was not incremented automatically when the user logged a contribution.
  - Contributions were not written to `Mov_reservas` with `tipoDestino = "pago_futuro"`.
- **Current state**:
  - The engine has `getFuturePaymentProvisions`, `getFuturePaymentProgress` and a fallback to derive `aporteMensual` from `importeObjetivo` and `mesesRestantes` when the field is missing.
  - The future-payments page (`/future-payments`) exposes an `Aportar` button per item that opens the generic `SavingsMovementForm` and writes a `Mov_reservas` row with `tipoDestino = "pago_futuro"`.
  - The engine reads the ledger (`getFuturePaymentMovements` + `sumMovementsBalance`) and falls back to the manual `saldoReservado` field for backward compatibility.
  - `/savings/monthly` lists every active future payment with a non-zero `aporteMensual` and supports bulk / per-target confirmation.
- **See**: `FINANCE_LOGIC.md` §6.

## A6. Deferred / installment payments — `partially resolved` (engine done, monthly auto-create `pending`)

- **Source**: `src/features/deferred-payments/*`, `src/lib/finance/finance-engine.ts`.
- **Original finding**:
  - No automatic creation of a monthly expense movement.
  - `importePagado` was not incremented automatically.
- **Current state**:
  - The engine has `getDeferredPayments` and surfaces the active installments in `Disponible`.
  - The monthly movement is still not auto-created. There is no `TX-DEFER-YYYY-MM-aplazadoId` flow yet.
- **Next step**: mirror the Phase 6 fixed-expenses pattern for installments. Tracked under Phase 7 (savings + installments share the same month-by-month confirmation design).

## A7. Savings / reserves / goals — `resolved` (Phase 7)

- **Source**: `src/features/reserves/*`, `src/features/goals/*`, `src/features/savings/*`, `src/components/dashboard/savings-panel-expanded.tsx`, `src/app/savings/monthly/page.tsx`.
- **Original finding**:
  - `saldoActual` on `Reservas` and `Objetivos` was updated manually.
  - The saving form could not allocate a contribution to a specific reserve or goal.
  - General savings and monthly savings were mixed in the dashboard panel.
- **Current state**:
  - The engine prefers `Mov_reservas` for balances and falls back to the manual `saldoActual` field (now derived via `getTargetLedgerBalance` in `finance-engine.ts`).
  - `useTargetBalances` computes per-target balances from the ledger for the dashboard and per-item screens.
  - `/savings` and `/goals` expose an `Aportar` button per item that opens the generic `SavingsMovementForm` and writes a `Mov_reservas` row with the right `tipoDestino`.
  - The dashboard panel links to `/savings/monthly` for monthly confirmation and to `/savings` for one-off contributions; the legacy "Ahorro del mes" generic-movement button has been removed.
  - `getMonthlySavings` no longer double counts: it ignores `Ahorro` movements whose `id` starts with `LEDGER-`.
- **Next step**: Phase 8 will split the dashboard panel into "Ahorro general" and "Ahorro del mes" cards, expose an explanation modal behind "Disponible", and add account-role filters.

## A8. `Mov_reservas` handling — `resolved` (Phase 7)

- **Source**: `src/features/reserve-movements/*`, `src/features/savings/*`, `src/lib/finance/savings-ledger.ts`, `src/lib/finance/finance-engine.ts`, `src/constants/sheet-structure.ts` (`MOV_RESERVAS_HEADERS`).
- **Original finding**:
  - The header was missing `mesClave` and `tipoDestino` (required by the official model).
  - The savings form did not write a `Mov_reservas` row.
  - `Reservas.saldoActual` was not derived from `Mov_reservas`.
- **Current state**:
  - The headers include `mesClave`, `tipoDestino`, `destinoId` and `updatedAt` (added in Phase 3).
  - All contribution and withdrawal flows now write to `Mov_reservas` through `createSavingsContribution` / `createSavingsWithdrawal`. Reserve, goal and future payment flows use the same generic form.
  - `Mov_reservas` is the source of truth: per-target balances, monthly planned savings, and dashboard "Ahorro general" all read from the ledger.
  - The engine exposes `isLedgerEntry` and `getTargetLedgerBalance` to surface the ledger in calculations.
- **See**: `FINANCE_LOGIC.md` §6.

## A9. Account logic — `partially resolved` (header added in Phase 3, role filter `pending` Phase 8)

- **Source**: `src/features/accounts/hooks/use-accounts.ts`, `src/types/models.ts` (`AccountRow`), `src/constants/enums.ts` (`AccountType`).
- **Original finding**:
  - There was no `rol` field on `AccountRow` (only `tipo`).
  - "Disponible" was global, not per role.
- **Current state**:
  - The header has `rol` and the row adapter normalizes legacy values to `general`.
  - The dashboard still does not filter by role.
- **Next step**: Phase 8.

## A10. Google Sheet validation — `partially resolved` (template version still `pending`)

- **Source**: `src/lib/sheets/reader.ts` (`validateSheetCompatibility`), `src/constants/sheet-structure.ts`, `src/app/onboarding/page.tsx`.
- **Original finding**:
  - The "advanced" check was only a console warning.
  - `Config.templateVersion` was not actually read; `TEMPLATE_VERSION` was hardcoded.
  - The validator assumed Spanish sheet names.
- **Current state**:
  - The validator now returns `SheetVersionInfo` and separates required vs. recommended headers.
  - Onboarding reads the Config sheet and exposes the version.
  - Sheet `templateVersion` write-back is session-only at the moment.
- **Next step**: optional Phase 11 polish — accept translated sheet names, surface a soft warning.

## A11. Google Sheets readers / writers — `pending` (Phase 10)

- **Source**: `src/lib/sheets/client.ts`, `src/lib/sheets/reader.ts`, `src/lib/sheets/writer.ts`, `src/lib/sheets/adapters.ts`.
- **Original finding**:
  - `getToken()` was read inside the writers with no central request layer.
  - No throttling for the Sheets API quota.
  - `readSheetData` capped at 1000 rows.
- **Current state**:
  - The surface is unchanged.
- **Next step**: Phase 10.

## A12. Google auth / session handling — `pending` (Phase 10)

- **Source**: `src/lib/google/auth.ts`, `src/app/auth/google/page.tsx`, `src/app/auth/callback/page.tsx`, `src/components/client-layout.tsx`, `src/app/onboarding/page.tsx`.
- **Original finding**:
  - No token refresh (implicit flow has none).
  - No proactive 401 handler.
  - Onboarding mixed "Google login state" and "Sheet connected" into a single flow.
  - "Disconnect Sheet only" was not available.
- **Current state**:
  - Token is in `sessionStorage`; the proactive check in `client-layout.tsx` was removed (it caused false positives on first paint).
  - `SheetsApiError.isAuthError()` exists for call-site detection.
  - A `disconnectSheet()` action is not yet split from the global disconnect.
- **Next step**: Phase 10.

## A13. Movement forms and selectors — `pending` (Phase 9)

- **Source**: `src/features/transactions/components/transaction-form.tsx`, `src/constants/payment-methods.ts`, `src/schemas/transaction*`.
- **Original finding**:
  - No required destination account for `Ingreso`.
  - Saving flow did not require a `reservaId` or destination.
  - Payment method list (card / cash / Bizum / Transferencia / Domiciliación / Otro) was broader than the spec — spec needs confirmation.
- **Current state**:
  - Form now hides the payment method for `Ingreso`.
  - Type-specific required fields are still Phase 9 work.
- **Next step**: Phase 9.

## A14. Zustand persisted dashboard configuration — `partially resolved`

- **Source**: `src/stores/app-store.ts`, `src/components/dashboard/dashboard-customizer.tsx`, `src/app/page.tsx`.
- **Original finding**:
  - Persist had no `version` field; the old `chartType` schema broke for returning users.
  - `onRehydrateStorage` patched the missing `charts` array but ran async — first render could read `undefined`.
  - `useWidgetReorder` was destructured in `page.tsx` but its handlers were never wired.
  - The dashboard only rendered `dashboardConfig.charts[0]` even though the customizer allowed multiple.
- **Current state**:
  - `version: 2` was added to the persist config.
  - `page.tsx` uses `(dashboardConfig.charts ?? [])` fallbacks.
  - `useWidgetReorder` is still dead code (handlers never wired).
  - The single-chart display is the engine contract for now; multi-chart layout is deferred to Phase 11.
- **Next step**: Phase 11 — wire the reorder hook or remove it, polish the customizer.

## A15. `src/lib/finance/` inventory — `obsolete`

The earlier audit listed each file with a "what to do" verdict. That inventory is now
obsolete because the engine has been built and the module layout is stable:

- `calculations.ts` — primitives. Kept.
- `salary.ts` — implemented Phase 5.
- `chart-data.ts` — kept; consumed by the engine.
- `finance-engine.ts` — implemented Phase 4.
- `salary-config.ts` — implemented Phase 5.
- `fixed-expense-confirmation.ts` — implemented Phase 6.
- `index.ts` — re-exports both `calculations` and `finance-engine`.

## A16. Summary of historical conflicts

| # | Area | Original conflict | Resolved in |
|---|------|-------------------|-------------|
| 1 | Salary day-1 dependency | `shouldAddSalaryToday` only ran on day 1 | Phase 5 |
| 2 | Salary not stored in Sheet | Config was Zustand-only | Phase 5 |
| 3 | No destination account on salary movement | `cuentaDestino` empty | Phase 5 |
| 4 | No deterministic ID for salary | `TX-SALARY-${Date.now()}` | Phase 5 |
| 5 | Fixed expenses had no monthly confirmation flow | Definition-only, no movement | Phase 6 |
| 6 | `Mov_reservas` not used as savings ledger | Generic `Ahorro` movements | Phase 7 (pending) |
| 7 | `Reservas.saldoActual` manual | Not derived from `Mov_reservas` | Phase 7 (pending) |
| 8 | "Disponible" global, not per account role | No `rol` filter on dashboard | Phase 8 (pending) |
| 9 | Zustand persist schema change has no `migrate` | `version: 2` added, `merge` reverted (broke generics) | Phase 11 (pending polish) |
| 10 | `useWidgetReorder` is dead code | Handlers not wired | Phase 11 (pending) |
| 11 | `mesClave` / `tipoDestino` missing on `Mov_reservas` | Headers added | Phase 3 |
| 12 | `rol` missing on `Cuentas` | Column added | Phase 3 |
| 13 | `/transactions` query param filter not implemented | Filter at hook level | Phase 9 (pending) |
| 14 | No 401-recovery in the Sheets request layer | Centralized client | Phase 10 (pending) |
