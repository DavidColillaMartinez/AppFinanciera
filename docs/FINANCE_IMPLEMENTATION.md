# Finance Implementation — AppFinanciera

This file is the **implementation history and phase tracker** for AppFinanciera.
It records what each phase delivered, where the code lives, and what is still
pending.

**Read this file only when:**

- checking whether a phase is implemented or pending;
- finding the main files touched by a phase;
- remembering the convention, ID or Config key introduced by a phase.

**Do not read this file** for visual changes, copy edits or anything that does not
need a phase-level view.

The official current rules live in `docs/FINANCE_LOGIC.md`. Historical findings
live in `docs/FINANCE_AUDIT.md`.

---

## Phase 3 — Template / schema and validation — `implemented`

- **Purpose**: make the validator recognize the evolving schema without breaking
  legacy rows, and expose a template version on the Config sheet.
- **Main files**:
  - `src/constants/enums.ts` — new enums: `TipoDestinoReserva`, `TipoMovimientoReserva`, `AccountRole`.
  - `src/constants/sheet-structure.ts` — added `rol` to `CUENTAS_HEADERS`; added `mesClave`, `tipoDestino`, `destinoId`, `updatedAt` to `MOV_RESERVAS_HEADERS`; introduced `TEMPLATE_VERSION`, `APP_MIN_VERSION`.
  - `src/lib/sheets/reader.ts` — `validateSheetCompatibility` returns `valid`, `errors`, `warnings`, `missing` and `version`.
  - `src/lib/sheets/writer.ts` — `writeConfigValues` reads the Config sheet once and updates by `Clave`.
  - `src/stores/app-store.ts` — `setTemplateVersion` action (session-only).
  - `src/types/models.ts` — model fields updated to match the new headers.
  - Row adapters normalize legacy values.
- **Key conventions**:
  - Additive columns only (do not break existing rows).
  - `required` headers are enforced; `recommended` headers only warn.
- **Template update required**: yes — admin must add the new columns manually (or copy the app template).
- **See**: `FINANCE_AUDIT.md` A10.

## Phase 4 — Central finance engine — `implemented`

- **Purpose**: own all finance calculations in a single pure module.
- **Main files**:
  - `src/lib/finance/finance-engine.ts` — pure TypeScript engine (no React, no Zustand, no Sheets).
  - `src/lib/finance/index.ts` — re-exports both `calculations` and `finance-engine`.
  - `src/hooks/use-finance-summary.ts` — convenience hook that loads data via React Query and feeds the engine.
  - `src/lib/finance/calculations.ts` — primitives kept for compatibility.
- **Key conventions**:
  - `get*` prefix for engine functions (e.g. `getAvailableBalance`).
  - `calculate*` prefix kept for primitives in `calculations.ts`.
  - Balances prefer `Mov_reservas` ledger, fall back to the manual `saldoActual` / `saldoReservado` field.
  - `confirmedFixedExpenseIds` and `confirmedDeferredPaymentIds` are passed via `FinanceContext`.
- **Key formulas**: see `FINANCE_LOGIC.md` section 15.5.
- **See**: `FINANCE_AUDIT.md` A1, A2, A5, A6, A7, A8, A9, A15.

## Phase 5 — Salary — `implemented`

- **Purpose**: persist salary config in the Sheet, give salary a deterministic ID,
  remove the day-1 dependency, support variable salary, require a destination account.
- **Main files**:
  - `src/lib/finance/salary-config.ts` — `SalaryConfigRecord`, `parseSalaryConfig`, `serializeSalaryConfig`, `validateSalaryConfig`, `buildSalaryMovementId`, `isSalaryMovementId`, `extractMonthKeyFromSalaryId`, `buildSalaryDate`, `SALARY_MOVEMENT_ID_PREFIX`.
  - `src/lib/finance/salary.ts` — `readSalaryConfigFromSheet`, `writeSalaryConfigToSheet`, `ensureSalaryForMonth`, `saveVariableSalaryForMonth`.
  - `src/features/salary/hooks/use-salary.ts` — `useSalaryConfig`, `useUpdateSalaryConfig`, `useSaveVariableSalary`, `useEnsureSalaryForMonth`.
  - `src/app/more/salary/page.tsx` — full config UI (toggle, type, amount, day 1–28, account, variable-month panel, validation, explanation).
  - `src/app/page.tsx` — dashboard auto-add effect keyed off `useSalaryConfig`, runs on any day of the current month.
  - `src/hooks/use-finance-summary.ts` — reads `useSalaryConfig` instead of the Zustand cache.
- **Config keys**: `salary.enabled`, `salary.type`, `salary.fixedAmount`, `salary.day`, `salary.destinationAccount`, `salary.description`, `salary.updatedAt`.
- **Movement ID**: `TX-SALARY-YYYY-MM` (deterministic; upsert pattern).
- **Template update required**: no — Config sheet already exists, only key/value rows are added on first save.
- **See**: `FINANCE_AUDIT.md` A2.

## Phase 6 — Fixed expenses monthly confirmation — `implemented`

- **Purpose**: per-month confirmation flow for fixed expenses with deterministic
  movement IDs and an engine-friendly confirmation set.
- **Main files**:
  - `src/lib/finance/fixed-expense-confirmation.ts` — `buildFixedExpenseMovementId`, `isFixedExpenseMovementId`, `buildFixedExpenseConfirmationKey`, `readConfirmedFixedExpenseIds`, `addFixedExpenseConfirmation`, `removeFixedExpenseConfirmation`, `confirmFixedExpenseForMonth`, `unconfirmFixedExpenseForMonth`, `confirmAllPendingFixedExpensesForMonth`, `buildProposal`.
  - `src/features/fixed-expenses/hooks/use-fixed-confirmation.ts` — `useConfirmedFixedExpenseIds`, `useConfirmFixedExpense`, `useUnconfirmFixedExpense`, `useConfirmAllPendingFixedExpenses`.
  - `src/app/fixed-expenses/confirm/page.tsx` — review screen (month selector, pending list, confirmed list, inline edit, bulk confirm, per-item unconfirm).
  - `src/app/fixed-expenses/page.tsx` — entry card to the confirm screen.
  - `src/app/more/page.tsx` — second entry card to the confirm screen.
  - `src/hooks/use-finance-summary.ts` — auto-loads `confirmedFixedExpenseIds` and passes it to the engine.
  - `src/constants/sheet-structure.ts` — `FIXED_CONFIG_KEYS.CONFIRMED_PREFIX = "fixed.confirmed."`.
- **Movement ID**: `TX-FIJO-YYYY-MM-fijoId` (deterministic).
- **Config key**: `fixed.confirmed.YYYY-MM` — comma-separated `fijoId`s.
- **Frequencies handled**: `Mensual`, `Trimestral`, `Anual`, `Unico` (with date-range filter).
- **Template update required**: no — Config sheet already exists; row is added on first confirmation.
- **See**: `FINANCE_AUDIT.md` A4.

## Phase 7 — Savings ledger / `Mov_reservas` — `implemented`

- **Purpose**: make `Mov_reservas` the single source of truth for savings balances;
  switch the saving flows to write to the ledger; support contributions and
  withdrawals across reserves, goals and future payments; add monthly planned
  saving confirmation.
- **Main files**:
  - `src/lib/finance/savings-ledger.ts` — pure helpers (`buildContributionId`,
    `buildWithdrawalId`, `buildMonthlyPlannedSavingId`, `isLedgerEntry`,
    `isMonthlyPlannedSavingId`, `getEntriesForTarget`, `getEntriesForMonth`,
    `getEntriesForTargetAndMonth`, `calculateLedgerBalance`,
    `calculateLedgerMonthlyTotal`, `calculateLedgerBreakdownByMonth`,
    `hasMonthlyPlannedSaving`, `getActiveMovements`, `normalizeTipoMovimiento`,
    `normalizeTipoDestino`, `rowToReserveMovement`) and service functions
    (`readAllReserveMovements`, `createSavingsContribution`,
    `createSavingsWithdrawal`, `confirmMonthlyPlannedSaving`,
    `unconfirmMonthlyPlannedSaving`, `updateReserveMovement`,
    `softDeleteReserveMovement`).
  - `src/features/savings/hooks/use-savings.ts` — React Query wrappers
    (`useAllReserveMovements`, `useTargetReserveMovements`,
    `useCreateSavingsContribution`, `useCreateSavingsWithdrawal`,
    `useConfirmMonthlyPlannedSaving`, `useUnconfirmMonthlyPlannedSaving`,
    `useUpdateReserveMovement`, `useDeleteReserveMovement`,
    `useMonthlySavingStatus`, `usePlannedMonthlyTargets`, `useTargetBalances`,
    `useTargetBalance`) plus the pure `computeTargetBalances` helper.
  - `src/features/savings/components/savings-movement-form.tsx` — generic
    form used for any target type (reserve, goal, future payment). Handles
    aporte and retirada.
  - `src/app/savings/monthly/page.tsx` — monthly planned saving confirmation
    screen (month selector, per-target edit, bulk confirm, per-target
    unconfirm, deterministic ID).
  - `src/features/reserve-movements/hooks/use-reserve-movements.ts` — legacy
    hook re-exports + `useReserveMovements(sheetId, reservaId)` filter kept
    for backward compatibility; new ledger hooks are re-exported from
    `@/features/savings/hooks/use-savings`.
  - `src/lib/finance/finance-engine.ts` — added `isLedgerEntry` predicate;
    `getMonthlySavings` and the per-target balance helpers use
    `getActiveMovements` and exclude `Ahorro` movements whose `id` starts with
    `LEDGER-` to prevent double counting.
  - `src/components/dashboard/savings-panel-expanded.tsx` — refactored to
    read balances from the engine, replace the legacy "Ahorro del mes" button
    with links to `/savings/monthly` and `/savings`.
  - `src/app/savings/page.tsx`, `src/app/goals/page.tsx`,
    `src/app/future-payments/page.tsx` — added an `Aportar` button per item
    that opens the generic `SavingsMovementForm` dialog; the per-item balance
    is now derived from the ledger.
- **ID conventions**:
  - `LEDGER-CONTRIB-<tipoDestino>-YYYY-MM-<destinoId>-<timestamp>` — one-off
    aporte (timestamp-based, no duplicate prevention needed).
  - `LEDGER-WITHDRAW-<tipoDestino>-YYYY-MM-<destinoId>-<timestamp>` — one-off
    retirada.
  - `LEDGER-MONTHLY-YYYY-MM-<tipoDestino>-<destinoId>` — monthly planned
    saving confirmation (deterministic; upsert on confirm).
  - Soft-delete: `tipoMovimiento = "Eliminado"`. The engine ignores these rows.
- **Reuses**: the engine already preferred the ledger; the existing headers
  (`mesClave`, `tipoDestino`, `destinoId`) were in place since Phase 3.
- **Template update required**: no.
- **See**: `FINANCE_AUDIT.md` A5, A7, A8.

## Phase 8 — Dashboard metrics using the engine — `pending`

- **Purpose**: dashboard consumes the engine output end-to-end and exposes the
  explanation behind "Disponible" and the savings panels.
- **Pending goals**:
  - `Disponible` is `getAvailableBalance` result; clicking it opens a modal with `explainAvailableBalance`.
  - `Ahorro general` and `Ahorro del mes` are two separate cards; each click opens a different breakdown.
  - `Ahorro general` shows totals across reserves, goals and future payment provisions.
  - `Ahorro del mes` shows how this month was distributed.
  - `Disponible` filters by account role when the user has more than one role.
  - The transactions page filter via `/transactions?filterType=...` is verified (or moved to Phase 9).
- **Likely files**:
  - `src/app/page.tsx`
  - `src/components/dashboard/savings-panel-expanded.tsx`
  - `src/components/dashboard/explainable-metric-card.tsx` (new)
- **See**: `FINANCE_AUDIT.md` A1, A7, A9.

## Phase 9 — Forms and movement flows — `pending`

- **Purpose**: tighten required fields per movement type and finalize the saving
  flow once Phase 7 is in place.
- **Pending goals**:
  - `TransactionForm` branches by type:
    - `Ingreso` → required `cuentaDestino`, no `metodo`.
    - `Gasto` → required `cuentaOrigen`, `metodo` from the fixed selector.
    - `Transferencia interna` → required `cuentaOrigen` and `cuentaDestino`.
    - `Ahorro` → required destination reserve / goal / future payment (or `general` fallback).
  - Required fields enforced at the Zod level.
  - `/transactions?filterType=Ingreso|Gasto` applies the filter at the hook level.
  - Movement edit re-fetches after update.
  - `useSeedDefaultCategories` does not duplicate.
  - Payment method list (`Tarjeta / Efectivo / Bizum / Transferencia / Domiciliación / Otro`) is either narrowed or explicitly documented as a superset of the spec.
- **Likely files**:
  - `src/features/transactions/components/transaction-form.tsx`
  - `src/schemas/transaction*.ts`
  - `src/features/transactions/hooks/use-transactions.ts`
  - `src/app/transactions/page.tsx`
- **See**: `FINANCE_AUDIT.md` A3, A13.

## Phase 10 — Google session and Sheet connection recovery — `pending`

- **Purpose**: separate Google auth from Sheet connection; centralize token
  handling and 401 recovery; allow reconnecting a Sheet without re-doing Google
  login.
- **Pending goals**:
  - Sheets request layer in `src/lib/sheets/client.ts` reads the token from `sessionStorage`.
  - On 401, the layer clears the token, fires a global event, and the user is redirected to `/onboarding?error=auth_required` (preserving the previous `sheetId` if any).
  - `disconnectSheet()` action: clears `sheetId` and `sheetUrl` but does NOT touch the Google token.
  - `logoutGoogle()` action: clears the token and the Sheet connection.
  - Reconnect flow: the user can re-paste a Sheet URL without re-doing Google login, as long as the token is still valid.
  - Optional: Sheets API quota throttling.
  - Optional: `readSheetData` pagination beyond 1000 rows.
- **Likely files**:
  - `src/lib/sheets/client.ts`
  - `src/stores/app-store.ts`
  - `src/lib/sheets/writer.ts`, `src/lib/sheets/reader.ts`
  - `src/app/onboarding/page.tsx`
- **See**: `FINANCE_AUDIT.md` A11, A12.

## Phase 11 — UI / design polish — `pending`

- **Purpose**: improve the visual layer once the underlying logic is stable.
- **Pending goals**:
  - Improve the dashboard header.
  - Improve forms (consistent spacing, sticky footer).
  - Improve charts (use `getChartData` for the active data source; respect `accentColor`, `animations`, `showLabels`).
  - Improve widget customization (multi-chart layout deferred — single-chart display is the engine contract for now).
  - Wire the long-press widget reorder hook (`useWidgetReorder`) or remove the dead code.
  - Polish the "Desconfirmar" dialog in `/fixed-expenses/confirm`.
- **Likely files**:
  - `src/app/page.tsx`
  - `src/components/dashboard/*`
  - `src/components/forms/*`
  - `src/hooks/use-drag-reorder.ts`, `src/hooks/use-long-press.ts`
- **See**: `FINANCE_AUDIT.md` A14.

---

## Status snapshot

| Phase | Topic | Status |
|-------|-------|--------|
| 3 | Template / schema / validation | implemented |
| 4 | Central finance engine | implemented |
| 5 | Salary / payroll | implemented |
| 6 | Fixed expenses monthly confirmation | implemented |
| 7 | Savings ledger (`Mov_reservas`) | implemented |
| 8 | Dashboard metrics using the engine | pending |
| 9 | Forms and movement flows | pending |
| 10 | Google session and Sheet connection recovery | pending |
| 11 | UI / design polish | pending |
