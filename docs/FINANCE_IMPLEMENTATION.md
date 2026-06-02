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

## Phase 8 — Dashboard metrics using the engine — `implemented`

- **Purpose**: dashboard consumes the engine output end-to-end and exposes the
  explanation behind "Disponible" and the savings panels.
- **Main files**:
  - `src/app/page.tsx` — refactored. Uses `useFinanceSummary({ monthKey })`
    for all numbers, `getSavingsBreakdown(ctx)` for the per-target detail,
    and `useSalaryConfig` for the live salary value. Removed all duplicate
    inline calculations (`fixedMonthly`, `deferredMonthly`, `futureMonthly`,
    `totalExpensesWithFixed`, `availableBalance`, the legacy `savingsPlan`
    totals). The salary-auto-add effect now respects the `currentMonth` guard
    so navigating to a past month does not re-add the salary.
  - `src/components/dashboard/disponible-explanation-modal.tsx` — new.
    Reads `available` from the engine. Groups `explanation[]` by
    `income / expense / saving / provision / adjustment`. Shows a salary
    warning if salary is not configured, a pending-fixed warning that links
    to `/fixed-expenses/confirm`, and an action button to
    `/savings/monthly` when the month has no savings.
  - `src/components/dashboard/general-savings-breakdown-modal.tsx` — new.
    Reads `getSavingsBreakdown(ctx)` and shows per-target detail
    (reserves, goals, future payments) with totals, progress, remaining
    amount and monthly recommended.
  - `src/components/dashboard/monthly-savings-breakdown-modal.tsx` — new.
    Reads `summary.monthlySavings` (already filtered by `mesClave` and the
    `isLedgerEntry` guard from Phase 7). Shows the per-destination
    breakdown and the individual ledger rows of the month.
  - `src/app/transactions/page.tsx` — refactored. Now reads
    `?filterType=...&month=YYYY-MM` from the URL on mount and shows a banner
    that lets the user clear the query filters. The default `Transactions`
    navigation is preserved. Wrapped in `<Suspense>` for Next.js 16.
  - `src/components/dashboard/savings-panel-expanded.tsx` — removed.
    The new modals cover its responsibilities using the engine.
- **Card layout**:
  - Row 1: `Disponible` (clickable → modal).
  - Row 2: `Ingresos | Gastos variables` (clickable → /transactions with
    filters).
  - Row 3: `Ahorro general | Ahorro del mes` (clickable → modals).
  - Row 4: `Total obligaciones` (non-clickable summary).
  - Chart, plan and recent-transactions widgets follow the existing
    `isVisible` config and consume engine data where applicable.
- **Chart engine wiring**:
  - The category chart on the dashboard now consumes
    `calculateExpensesByCategory(transactions, categories)` — the same
    primitive the engine uses internally for the
    `savings.transactions.filter(Gasto)` slice. The legacy
    `getChartData("categories", ...)` path is left intact for other
    callers but is not used by the dashboard anymore.
  - Multi-source charts (`expenses`, `savings`, `income`, `total`, `fixed`,
    `deferred`, `future`) are still consumed through the customizer, but
    not on the default dashboard card. Migration is documented as a Phase
    11 polish item.
- **No double counting**: dashboard savings still use
  `summary.monthlySavings` which already applies the `isLedgerEntry` guard
  from Phase 7.
- **No generic `Ahorro` movement creation**: the dashboard no longer
  creates `Ahorro` movements from its UI. The only saving flow the
  dashboard now triggers is the link to `/savings/monthly`.
- **Template update required**: no.
- **See**: `FINANCE_AUDIT.md` A1, A7, A9.

## Phase 8.5 — Critical post-dashboard fixes — `implemented`

- **Purpose**: fix correctness bugs discovered after Phase 7 and Phase 8
  (ledger soft-delete, savings double counting, planned savings placeholder,
  movement edit, legacy reserve movement hook).
- **Fixes**:
  - **A1** — `src/lib/finance/savings-ledger.ts`: added `"Eliminado"` to the
    `TipoMovimientoReserva` enum and updated `normalizeTipoMovimiento` to
    preserve the sentinel instead of mapping it to `"aporte"`. Soft-deleted
    and unconfirmed ledger rows are now properly excluded from balances,
    monthly savings, and progress by `getActiveMovements`. `unconfirmMonthlyPlannedSaving`
    and `softDeleteReserveMovement` now write the sentinel literally.
  - **A2** — verified the existing `LEDGER-` id guard in `getMonthlySavings`
    and `getGeneralSavings` prevents double counting between generic
    `Ahorro` movements and ledger entries. No additional changes.
  - **A3** — `src/lib/finance/finance-engine.ts`: `getAvailableBalance` now
    uses the user's real monthly plan
    (`Reservas.aporteMensualSugerido + Objetivos.aporteMensual`) as
    `plannedSavings`. The 20% fallback is kept only when no real plan
    exists. The breakdown now exposes
    `plannedSavingsIsFallback` and `plannedSavingsRecommended`. The
    `DisponibleExplanationModal` shows a "20% fallback" hint when the flag
    is true. `getMonthlySavings.planned` no longer includes future payment
    `aporteMensual` (already in `futurePaymentProvisions`), so the same
    target is no longer subtracted twice.
  - **A4** — `src/app/transactions/page.tsx`: edit button now calls
    `setShowForm(true)` and resets `selectedType` so the dialog opens with
    the selected movement prefilled. The transaction form already accepted
    `initialData` correctly; only the trigger was broken.
  - **A5** — `src/features/reserve-movements/hooks/use-reserve-movements.ts`:
    `useCreateReserveMovement` now branches on `tipoMovimiento` and calls
    `useCreateSavingsWithdrawal` when the form says `retirada`. Legacy
    callers (e.g. `reserve-movement-form.tsx`) now save withdrawals
    correctly. Cache invalidation expanded to include
    `["goals", "futurePayments", "transactions", "savingsLedger"]`.
- **See**: `FINANCE_AUDIT.md` A1, A3, A4, A5, A7, A8, A9.

## Phase 9 — Forms and movement flows — `implemented`

- **Purpose**: tighten required fields per movement type, finalize the
  saving flow, ensure categories, accounts, filters and quick actions
  work end to end.
- **Main files**:
  - `src/features/transactions/components/transaction-form.tsx` — branches
    by `selectedType` (Ingreso / Gasto / Transferencia). Income form
    requires `cuentaDestino` and never shows `metodo`. Expense form
    requires `cuentaOrigen`, `metodo` selector and an expense-compatible
    category. Transfer form requires both accounts and rejects
    same-account. The form drops the "Ahorro" option from the type
    selector. When the caller passes `defaultType = "Ahorro"`, the form
    shows a banner pointing to `/savings/monthly`.
  - `src/schemas/transaction.ts` — `superRefine` rules enforce the
    required-field rules per type for both create and update.
  - `src/constants/payment-methods.ts` — added `normalizePaymentMethod`
    helper used on read and write.
  - `src/features/transactions/hooks/use-transactions.ts` — applies
    `normalizePaymentMethod` on read; clears `metodo` for income, forces
    `Transferencia` for transfer on write. Cache invalidation expanded to
    cover savings, reserves, goals, future payments.
  - `src/app/transactions/page.tsx` — "Ahorro" quick action redirects to
    `/savings/monthly`. Editing prefills the dialog. The
    `?filterType=...&month=...` banner now also clears when the user
    changes the month manually.
  - `src/app/page.tsx` — "Ahorro" FAB action redirects to
    `/savings/monthly`. The legacy `useReserveMovements` import is gone.
  - `src/hooks/use-finance-summary.ts` — switched to
    `useAllReserveMovements` so the dashboard and the savings form share
    one query key.
  - `src/features/categories/hooks/use-categories.ts` and
    `src/features/accounts/hooks/use-accounts.ts` — cache invalidation
    expanded to invalidate `["transactions"]` so dashboards and forms
    refresh after a category or account change.
- **See**: `FINANCE_AUDIT.md` A3, A11, A12, A13.

## Phase 10 — Google session and Sheet connection recovery — `implemented`

- **Purpose**: separate Google auth from Sheet connection; centralize
  token handling and 401/403 recovery; allow reconnecting a Sheet
  without re-doing Google login; recover from a session that is
  persisted on disk but whose token was lost (tab close, expiry).
- **Main files**:
  - `src/lib/sheets/client.ts` — added `SheetsAuthError` and
    `SheetsNetworkError` subclasses; wrapped every fetch call in
    `unwrapAuth` which on 401/403 clears the token, dispatches a
    `appfinanzas:auth-expired` window event and rethrows as
    `SheetsAuthError`. Other 4xx/5xx are rethrown as plain
    `SheetsApiError`.
  - `src/lib/query-client.ts` — new file. Centralised
    `queryClientDefaultOptions` that short-circuits `retry` on
    `SheetsAuthError` (no infinite loops) and caps other retries at 1.
  - `src/stores/app-store.ts` — added `authStatus` (mirrors
    sessionStorage token state), `lastConnectedAt`. New
    `logoutGoogle()` action. Persist `version` bumped to 3.
    `disconnect()` no longer touches the token. The persisted
    `sheetId`, `sheetUrl`, `templateVersion`, `appMinVersion`,
    `lastConnectedAt` are non-sensitive metadata only.
  - `src/hooks/use-finance-summary.ts` — reads `hasToken()` and
    passes `null` to all sub-hooks when no token is present, so the
    dashboard does not flash a "No access token" error when the user
    reopens the app after sessionStorage was cleared.
  - `src/components/client-layout.tsx` — extended redirect rules: a
    persisted `sheetId` with no token redirects to
    `/onboarding?error=auth_failed&step=google`; a missing `sheetId`
    with a token redirects to `/onboarding?step=sheet`; neither
    redirects to `/onboarding?error=auth_required`. Listens to
    `appfinanzas:auth-expired` and re-runs the same redirect. Bottom
    nav only renders when both `isConnected` and `hasToken()` are
    true. `/settings` and `/settings/preferencias` were removed from
    the public-route list so the redirect runs there too.
  - `src/app/onboarding/page.tsx` — accepts `?error=auth_failed`,
    `?error=auth_required`, `?step=sheet`. Prefills the Sheet input
    from `last_sheet_url` / `useAppStore.sheetUrl`. Shows a "Ultima
    Sheet conectada" card with a one-tap "Reutilizar" button. The
    Google button label switches to "Re-conectar sesion" when a
    token is still in `sessionStorage` so the user understands the
    state.
  - `src/app/auth/callback/page.tsx` — sets `authStatus =
    "authenticated"` after a successful login.
  - `src/app/settings/preferencias/page.tsx` — three actions, three
    different state effects:
    - "Desconectar" → `disconnect()` (no token touch) + redirect to
      `/onboarding?step=sheet`.
    - "Cambiar Sheet" → `disconnect()` (no token touch) + clear
      `last_sheet_url` + redirect to `/onboarding?step=sheet`.
    - "Cerrar sesion de Google" → `clearToken()` + `logoutGoogle()` +
      clear `last_sheet_url` + redirect to `/onboarding`.
    Shows `lastConnectedAt` and `templateVersion` for the connected
    Sheet.
  - `src/app/page.tsx` — gates the dashboard's queries by
    `dataReady = !!sheetId && hasToken()`. Renders a "Sesion de
    Google caducada" empty state with a "Reconectar" button when the
    user lands on `/` with a persisted `sheetId` but no token.
- **Auth / session behavior**:
  - Token expiry → `client.ts` clears the token and emits the event;
    `client-layout.tsx` redirects to the onboarding step that
    triggers `/auth/google` (real Google login, not just an
    animation). The previously connected Sheet is preserved in
    `zustand` and reconnected automatically once the callback
    succeeds.
  - The reconnect button on the dashboard and on the onboarding
    screen both call `window.location.href = "/auth/google"`. The
    `/auth/google` page calls `getGoogleAuthUrl()` (real OAuth URL)
    and replaces the location. There is no simulated animation.
  - React Query `retry` skips `SheetsAuthError`, so the failing
    query stops immediately instead of looping.
- **Disconnect vs Logout**:
  - Disconnect Sheet: keeps `google_access_token`; the user can
    paste a new Sheet URL on `/onboarding?step=sheet` without
    re-logging in. `isConnected` is reset to `false`.
  - Logout Google: clears the token, the Sheet state, the
    `authStatus` and the `hasSeenOnboarding` flag. Returns to the
    fresh onboarding flow.
  - Change Sheet: same as Disconnect Sheet but also clears the
    prefilled `last_sheet_url` so the user is forced to enter the
    new URL.
- **What is stored where**:
  - `sessionStorage.google_access_token` — Google access token
    (cleared on tab close, never persisted beyond a tab).
  - `localStorage.app_finanzas_state` (zustand) — non-sensitive
    Sheet metadata: `sheetId`, `sheetUrl`, `templateVersion`,
    `appMinVersion`, `lastConnectedAt`, plus UI state (active month,
    dashboard config, etc.).
  - `localStorage.last_sheet_url` — mirror of `sheetUrl` used to
    prefill the onboarding input. Cleared on disconnect, change and
    logout.
  - No Google refresh tokens are stored.
- **Remaining Phase 11 items** (not addressed in Phase 10):
  - Dashboard header polish.
  - Full chart customizer UX.
  - Onboarding visual cleanup.
  - Optional: `readSheetData` pagination beyond 1000 rows.
  - Optional: Sheets API quota throttling on 429.
- **See**: `FINANCE_AUDIT.md` A11, A12.

## Phase 11 — UI / design polish — `implemented`

- **Purpose**: improve the visual layer once the underlying logic is stable.
- **Resolved goals**:
  - Dashboard header: hierarchy improved (year eyebrow, larger month, subtitle, customizer + month picker aligned). Sticky bottom FAB preserved.
  - Charts: dashboard now calls `getChartData(chart.dataSource, ...)` for all 8 data sources. `deferredPayments` is fetched via `useDeferredPayments`. `accentColor`, `animations`, `showLabels` are respected. Source label shown next to chart name.
  - Widget customization: working (Switch + up/down arrows in customizer). Multi-chart layout is still the engine contract — single chart is rendered.
  - Dead code removal: `useWidgetReorder` and `ReorderOverlay` were unused; both removed.
  - Confirmation dialogs: `window.confirm` replaced by a new reusable `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`) in chart delete and fixed-expense unconfirm.
  - Forms polish: `category-form.tsx` and `reserve-form.tsx` updated to consistent `h-11` inputs and sticky bottom action bar matching `transaction-form.tsx`. Duplicate error block in `category-form.tsx` removed.
- **Likely files**:
  - `src/app/page.tsx`
  - `src/components/dashboard/chart-renderer.tsx`, `dashboard-customizer.tsx`
  - `src/components/ui/confirm-dialog.tsx` (new)
  - `src/features/categories/components/category-form.tsx`
  - `src/features/reserves/components/reserve-form.tsx`
  - `src/app/fixed-expenses/confirm/page.tsx`
- **See**: `FINANCE_AUDIT.md` A11, A14.

---

## Status snapshot

| Phase | Topic | Status |
|-------|-------|--------|
| 3 | Template / schema / validation | implemented |
| 4 | Central finance engine | implemented |
| 5 | Salary / payroll | implemented |
| 6 | Fixed expenses monthly confirmation | implemented |
| 7 | Savings ledger (`Mov_reservas`) | implemented |
| 8 | Dashboard metrics using the engine | implemented |
| 8.5 | Critical post-dashboard fixes | implemented |
| 9 | Forms and movement flows | implemented |
| 10 | Google session and Sheet connection recovery | implemented |
| 11 | UI / design polish | implemented |
