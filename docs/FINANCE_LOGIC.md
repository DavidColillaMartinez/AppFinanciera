# Finance Logic — AppFinanciera

> **Compact source of truth.** This file contains only the official rules that
> the app must follow. Historical findings live in `docs/FINANCE_AUDIT.md`.
> Phase status and main files live in `docs/FINANCE_IMPLEMENTATION.md`.

## 0. Source of truth

- The official data source is the **app Google Sheet template / connected Google
  Sheet**. The Sheet is the database; the app owns the business logic.
- Google Apps Script is not required.
- All calculations live in TypeScript. The Sheet stores structured data only.
- The app validates the connected Sheet by structure (sheet names, headers,
  template version), not by visual formatting.

## 1. Main principle

The dashboard must let the user know:

1. What money came in.
2. What money is already spent.
3. What money is committed.
4. What money must be reserved for future obligations.
5. What money should be saved to meet goals.
6. What money is truly available to spend this month.

Numbers must come with an explanation behind them, not be a black box.

## 2. Core architecture

```
Google Sheet (database, source of truth)
   ↕  read / write
src/lib/sheets/        (API client + row adapters)
   ↕
src/features/*/hooks/  (React Query hooks)
   ↕
src/hooks/use-finance-summary.ts  (assembles FinanceContext)
   ↕
src/lib/finance/finance-engine.ts  (pure functions, get* prefix)
   ↕
src/app/* pages + src/components/*
```

- React Query owns caching. Zustand only caches UI / connection state.
- The finance engine is pure TypeScript: no React, no Zustand, no Sheets API.
- Pages and components MUST consume the engine via `useFinanceSummary` instead
  of recomputing their own slices.

## 3. Income model

Income includes fixed salary, variable salary, extra income, Bizum received,
refunds and other positive inflows.

### 3.1 Salary (implemented Phase 5)

- Salary config lives in the `Config` sheet as key/value rows. Zustand keeps a
  local cache for fast UI access; the Sheet is the source of truth.
- Config keys:
  - `salary.enabled` — `true` | `false`.
  - `salary.type` — `fixed` | `variable`.
  - `salary.fixedAmount` — number, used when type is `fixed`.
  - `salary.day` — integer 1–28 (safe for all months). Default 1.
  - `salary.destinationAccount` — `cuentaId` of the receiving account.
  - `salary.description` — concept of the income movement. Default `Nomina mensual`.
  - `salary.updatedAt` — ISO timestamp of the last save.
- Validation: enabled + `fixed` requires `fixedAmount > 0`; enabled requires
  `1 <= day <= 28`; enabled + `destinationAccount` set requires the account to
  exist and be active.
- Movement ID: `TX-SALARY-YYYY-MM` (deterministic).
- Fixed salary: created once per month if missing. Runs on **any day of the
  month**, not only day 1. The app looks up the existing ID and skips if found.
- Variable salary: user enters the amount for the current month in `/more/salary`.
  The same deterministic ID is upserted; saving twice never duplicates.
- Destination account is required for both fixed and variable.
- Implementation: `src/lib/finance/salary-config.ts` + `src/lib/finance/salary.ts`.

### 3.2 Other income

All other `Ingreso` movements are entered by the user as regular transactions.

## 4. Expense model

### 4.1 Variable expenses

Day-to-day expenses (food, fuel, restaurants, leisure, shopping, health, transport).

- Added as `Movimientos` rows with `tipo = Gasto`.
- Reduce available money, count against category budgets, show in expense charts.

### 4.2 Fixed expenses (implemented Phase 6)

Recurring obligations (rent, subscriptions, phone bill, utilities, loans, insurance
installments, etc.).

- The app proposes each month. The user reviews, edits, and confirms.
- Until confirmed, the row is a **pending obligation** that still reduces
  available money.
- When confirmed, the app creates a real `Movimientos` row.
- Duplicates per month are impossible: the movement uses a deterministic ID.
- Editing the template AFTER confirming the current month does NOT modify the
  already-confirmed movement. Future months use the new template; the current
  month's movement stays as historical truth.

#### 4.2.1 Confirmation flow

- Screen: `/fixed-expenses/confirm` (reachable from `/fixed-expenses` and `/more`).
- The user picks a month. The app lists every active `Gastos_fijos` row whose
  `frecuencia` and date range (`fechaInicio` / `fechaFin`) belong to that month.
- Each proposal shows the template amount, category, account, and proposed charge
  date (default = `diaCargo`, clamped to 1–28).
- The user can edit amount, account, category, date and notes inline.
- "Confirmar" creates a `Movimientos` row and persists the `fijoId` in Config.
- "Confirmar todos los pendientes" performs the bulk action.
- "Desconfirmar" soft-deletes the movement and removes the `fijoId` from Config.

#### 4.2.2 Movement ID

```
id = "TX-FIJO-" + monthKey + "-" + fijoId
example = "TX-FIJO-2026-06-FIX-1700000000"
```

- Deterministic per month + `fijoId`.
- Duplicate prevention uses `findRowIndexByColumnValue("id", ...)`.

#### 4.2.3 Config persistence

- Key: `fixed.confirmed.YYYY-MM`.
- Value: comma-separated `fijoId`s (no spaces). e.g. `FIX-1700000000,FIX-1700000001`.
- Read by `useConfirmedFixedExpenseIds(sheetId, monthKey)`.
- Used by `useFinanceSummary` to compute `confirmedFixedExpenseIds`, which the
  engine receives in `FinanceContext`.

#### 4.2.4 Frequencies

- `Mensual` → always.
- `Unico` → only the month of `fechaInicio`.
- `Trimestral` → every 3 months from `fechaInicio` (month 0, 3, 6, …).
- `Anual` → only the month of `fechaInicio`.
- `fechaInicio` / `fechaFin` always take precedence.

#### 4.2.5 Engine integration

- `isConfirmedFixedMovement(t)` matches `id.startsWith("TX-FIJO-")`. The engine
  trusts the ID prefix even if the Config key is stale.
- `getFixedExpensesConfirmed(ctx)` sums the `importe` of confirmed movements.
- `getFixedExpensesPending(ctx)` sums active fixed expenses not yet confirmed.
- `getVariableExpenses(ctx)` excludes any movement whose `id` starts with `TX-FIJO-`.

### 4.3 Future payments

Non-monthly obligations that must be prepared in advance (car insurance, ITV, yearly
subscriptions, vehicle tax, planned maintenance).

- Not normal expenses until paid.
- Reduce recommended available money through monthly provisions.
- Behave as mandatory savings / provisions.
- `getFuturePaymentProvisions(ctx)` sums `aporteMensual` for active items. If the
  field is missing and `mesesRestantes > 0`, derive as
  `(importeObjetivo − saldoReservado) / mesesRestantes`.

### 4.4 Deferred / installment payments

Already contracted expenses split into several payments (financing, split insurance,
installment purchases, debt payments).

- Active installments reduce available money via `getDeferredPayments(ctx)`
  (sum of `cuotaMensual`).
- Deferred/installment payments should follow a month-by-month confirmation
  pattern similar to fixed expenses, using deterministic IDs such as
  `TX-DEFER-YYYY-MM-aplazadoId`. This remains pending for a future functional
  phase unless already implemented elsewhere.

### 4.5 Unexpected expenses

Track fines, repairs, urgent purchases separately when possible (affects stability
analysis).

## 5. Savings model

Savings are not normal expenses. They reduce spendable available money but must
not be mixed with normal spending.

- Destinations: emergency fund, safety cushion, reserves, goals, future payments,
  investment fund, personal wants.
- The app stores historical contributions and withdrawals in the
  `Mov_reservas` ledger (see §6). The manual `saldoActual` / `saldoReservado`
  fields on the parent rows are kept for backward compatibility; the engine
  prefers the ledger when it has entries for a target.

### 5.1 General savings (dashboard card)

- Total saved across reserves, goals and future payment provisions.
- Total target amount and progress percentage.
- Click → breakdown by reserve, goal and future payment.

### 5.2 Monthly savings (dashboard card)

- Planned for this month, saved so far, distribution across reserves, goals and
  future payments, completion status.
- "Ahorro del mes" no longer creates a generic `Ahorro` movement; the monthly
  confirmation flow writes ledger rows directly (see §5.3).

### 5.3 Monthly saving confirmation (implemented Phase 7)

- Screen: `/savings/monthly` (reachable from `/savings` and from the dashboard
  savings panel).
- The user picks a month. The app lists every active target (reserve, goal,
  future payment) with a non-zero `aporteMensual*` field.
- Each row shows the planned amount; the user can edit the amount inline and
  confirm. "Confirmar todos los pendientes" performs the bulk action.
- "Desconfirmar" soft-deletes the monthly row and re-runs the dashboard.
- IDs are deterministic per `(monthKey, tipoDestino, destinoId)` to make
  confirmation idempotent.

## 6. `Mov_reservas` ledger (implemented Phase 7)

- The official savings ledger. Source of truth for `Reservas.saldoActual`,
  `Objetivos.saldoActual` and `Pagos_futuros.saldoReservado`.
- Fields: `id`, `fecha`, `mesClave`, `tipoDestino`, `destinoId`, `reservaId`,
  `tipoMovimiento`, `importe`, `cuentaOrigen`, `cuentaDestino`, `notas`,
  `createdAt`, `updatedAt`.
- `tipoDestino` ∈ `reserva | objetivo | pago_futuro`.
- `tipoMovimiento` ∈ `aporte | retirada`.
- Soft-deletes use `tipoMovimiento = "Eliminado"` (sentinel). The engine
  detects the sentinel **before** normalizing into `aporte | retirada`, so
  soft-deleted rows are never counted as active savings. The normalization
  step is the only place that owns the mapping.
- The engine prefers the ledger and falls back to the manual `saldoActual` /
  `saldoReservado` field for backward compatibility.

### 6.1 ID conventions

```
One-off aporte reserve:  LEDGER-CONTRIB-reserva-YYYY-MM-<reservaId>-<timestamp>
One-off aporte goal:     LEDGER-CONTRIB-objetivo-YYYY-MM-<objetivoId>-<timestamp>
One-off aporte pago:     LEDGER-CONTRIB-pago_futuro-YYYY-MM-<pagoId>-<timestamp>
One-off retirada:        LEDGER-WITHDRAW-<tipoDestino>-YYYY-MM-<destinoId>-<timestamp>
Monthly planned saving:  LEDGER-MONTHLY-YYYY-MM-<tipoDestino>-<destinoId>
```

- One-off contributions and withdrawals use timestamp-based IDs (no duplicate
  prevention needed because the timestamp is unique per click).
- Monthly planned savings use deterministic IDs; saving twice updates the same
  row instead of duplicating.
- `isLedgerEntry(m)` matches `id.startsWith("LEDGER-")`. Used by
  `getMonthlySavings` to exclude ledger audit rows from the generic `Ahorro`
  bucket and prevent double counting.

### 6.2 Reads and writes

- Pure helpers in `src/lib/finance/savings-ledger.ts`:
  `buildContributionId`, `buildWithdrawalId`, `buildMonthlyPlannedSavingId`,
  `isLedgerEntry`, `isMonthlyPlannedSavingId`, `getEntriesForTarget`,
  `getEntriesForMonth`, `getEntriesForTargetAndMonth`, `calculateLedgerBalance`,
  `calculateLedgerMonthlyTotal`, `calculateLedgerBreakdownByMonth`,
  `hasMonthlyPlannedSaving`, `getActiveMovements`, `normalizeTipoMovimiento`,
  `normalizeTipoDestino`, `rowToReserveMovement`.
- Service functions in `src/lib/finance/savings-ledger.ts`:
  `readAllReserveMovements`, `createSavingsContribution`,
  `createSavingsWithdrawal`, `confirmMonthlyPlannedSaving`,
  `unconfirmMonthlyPlannedSaving`, `updateReserveMovement`,
  `softDeleteReserveMovement`.
- React Query hooks in `src/features/savings/hooks/use-savings.ts`:
  `useAllReserveMovements`, `useTargetReserveMovements`,
  `useCreateSavingsContribution`, `useCreateSavingsWithdrawal`,
  `useConfirmMonthlyPlannedSaving`, `useUnconfirmMonthlyPlannedSaving`,
  `useUpdateReserveMovement`, `useDeleteReserveMovement`,
  `useMonthlySavingStatus`, `usePlannedMonthlyTargets`,
  `useTargetBalances`, `useTargetBalance`.
- A generic contribution form (`SavingsMovementForm`) is used for reserves,
  goals and future payments, picking the right `tipoDestino`.

## 7. Accounts model

Accounts are real or user-defined money containers.

- Required roles (`AccountRole`):
  - `diario` — daily spending.
  - `fijos` — fixed expenses.
  - `ahorro` — savings.
  - `general` — default / fallback.
- Salary uses a selected destination account.
- Expenses use a selected source account.
- Savings move money from the source account to the selected saving destination.

### 7.1 Account balance (saldo de cuenta)

The current balance of an account is **derived from movements**, never typed
by the user.

```
saldo = saldoInicial
      + ingresos (Movimientos.cuentaDestino == cuentaId, tipo = Ingreso)
      - gastos (Movimientos.cuentaOrigen == cuentaId, tipo = Gasto)
      + transferenciasEntrantes (cuentaDestino, tipo = Transferencia interna)
      - transferenciasSalientes (cuentaOrigen, tipo = Transferencia interna)
```

- `saldoInicial` is the only editable number; it is the starting point.
- `saldoActualManual` is read from the Sheet for legacy compatibility but is
  not shown in the UI. The schema accepts it so older rows keep loading.
- `Mov_reservas` rows are internal to the savings ledger and do NOT change
  account balances. Money that leaves an account to feed a reserve is a
  `Transferencia interna` from the source account to the savings account.
- Implementation: `src/lib/finance/account-balances.ts` with
  `computeAccountBalance(account, transactions)` and
  `computeAllAccountBalances(accounts, transactions)`.

## 8. Available balance

```
available = income
          − variableExpenses
          − fixedExpensesConfirmed
          − fixedExpensesPending
          − deferredPayments
          − futurePaymentProvisions
          − plannedSavings
```

- `plannedSavings` is the user's real monthly plan: the sum of
  `Reservas.aporteMensualSugerido + Objetivos.aporteMensual` from active
  rows. `Pagos_futuros.aporteMensual` is **not** included here because it is
  already represented by `futurePaymentProvisions`. This avoids double
  counting the same target.
- If the user has no active reserves/goals with a monthly plan, the engine
  falls back to a 20% recommendation of `(income − variable − fixedConfirmed
  − fixedPending − deferred)`. The breakdown flags
  `plannedSavingsIsFallback: true` so the UI can label it as "Ahorro
  recomendado (20% fallback)" instead of "Ahorro planificado".
- The `Disponible` card must be clickable and reveal the breakdown behind the
  number (`explainAvailableBalance`).
- Pending fixed obligations are still part of the formula (the user must know
  they are committed money).

## 9. Dashboard metrics (implemented Phase 8)

The dashboard must show at least:

- Disponible
- Ingresos
- Gastos variables
- Gastos fijos (confirmed / pending)
- Total obligations
- Ahorro general
- Ahorro del mes
- Future payment provisions
- Month status

The dashboard consumes the engine via `useFinanceSummary({ monthKey })`. It does
**not** recompute any financial formula locally. All cards read from
`summary.available`, `summary.savings`, `summary.monthlySavings` and
`getSavingsBreakdown(ctx)`.

### 9.1 Card interactions

- `Disponible` → opens `DisponibleExplanationModal` (engine result
  `available` with `explanation[]`). The modal groups lines by
  `income / expense / saving / provision / adjustment` and shows the
  warnings (salary not configured, pending fixed expenses).
- `Ingresos` → `/transactions?filterType=Ingreso&month=YYYY-MM`.
- `Gastos` → `/transactions?filterType=Gasto&month=YYYY-MM`.
- `Ahorro general` → opens `GeneralSavingsBreakdownModal`. Reads
  `getSavingsBreakdown(ctx)` (reserves + goals + future payments) and shows
  the per-target progress and totals.
- `Ahorro del mes` → opens `MonthlySavingsBreakdownModal`. Reads
  `summary.monthlySavings` (filtering by `mesClave` and the
  `isLedgerEntry` guard). Shows by-destination breakdown and the
  individual ledger rows of the month.
- `Total obligaciones` → non-clickable card showing
  `variable + fixedConfirmed + fixedPending + deferred + futureProvisions`
  (the engine components that reduce spendable money). Replaces the old
  misleading "Total gastos" card.

### 9.2 Transactions page filters (implemented Phase 8)

- `/transactions` reads `filterType` and `month` from the URL and applies
  them on mount. A banner shows which filters came from the dashboard and
  offers a "Limpiar" action that strips the query params.
- Unknown or invalid `filterType` values are ignored. Months are validated
  against the `YYYY-MM` regex.
- The page is wrapped in `<Suspense>` because `useSearchParams` requires it
  in Next.js 16.

## 10. Forms and movements (implemented Phase 9)

- `Ingreso` requires `cuentaDestino`. No `metodo` is shown or saved (the
  column is left empty). `metodo` is auto-cleared when the user switches to
  the income type.
- `Gasto` requires `cuentaOrigen`, `metodo` (selector) and a category
  compatible with `tipoHabitual = Gasto`.
- `Transferencia interna` requires `cuentaOrigen` and `cuentaDestino` and
  rejects same-account transfers. `metodo` is auto-set to `Transferencia`.
- `Ahorro` is **not** a valid type in the form. If a caller passes
  `defaultType = "Ahorro"`, the form opens a banner that points to
  `/savings/monthly`. The dashboard FAB and the `/transactions` page
  redirect "Ahorro" to `/savings/monthly` directly. Generic `Ahorro`
  movements are kept for legacy/audit but are excluded from
  `getMonthlySavings` via the `LEDGER-` id guard.
- Categories are filtered by `tipoHabitual` so an income form only shows
  income categories and an expense form only shows expense categories.
- Accounts are loaded from the sheet (`useAccounts`). If the list is empty,
  the form shows an inline empty state with a link to `/accounts`.
- Payment method is a fixed selector: `Tarjeta / Efectivo / Bizum /
  Transferencia / Domiciliación / Otro`. `normalizePaymentMethod` in
  `src/constants/payment-methods.ts` maps old/informal values to the
  canonical label (case-insensitive) and falls back to `Otro` only for
  truly unknown values. The hook writes the normalized value.
- `/transactions?filterType=Ingreso|Gasto|Ahorro|Transferencia%20interna&month=YYYY-MM`
  applies the filter via `useSearchParams`. A banner shows active filters
  with a "Limpiar" action that strips the query params.

## 11. Google session and Sheet connection (implemented Phase 10)

These are two separate states and are persisted / cleared independently.

### 11.1 State model

- **Google session** (`googleSession`):
  - Token lives in `sessionStorage` under `google_access_token`.
  - Survives reloads of the same tab, dies on tab close.
  - Never written to `localStorage` or any long-lived store.
  - `useAppStore.authStatus` mirrors the in-memory state
    (`unknown | authenticated | expired | missing`) for UI purposes.
- **Sheet connection** (`sheetConnection`):
  - Persisted in `zustand` `persist` middleware: `spreadsheetId`,
    `sheetUrl`, `templateVersion`, `appMinVersion`, `lastConnectedAt`.
  - Source of truth: the connected Google Sheet. The app keeps the
    metadata in storage so it can re-validate and pre-fill the form on
    reopen.
  - `localStorage.last_sheet_url` mirrors `sheetUrl` for the prefill
    input. It is treated as a cache, not a source of truth: the store
    wins when both exist.

### 11.2 Token expiration recovery

- 401 and auth-related 403 errors trigger auth recovery. Sheet
  permission 403 errors must be shown as Sheet access / permission
  errors when distinguishable and must not force Google logout if the
  Google session is still valid.
- Practical classification (see `SheetsApiError.isAuthError()` and
  `SheetsApiError.isPermissionError()` in `src/lib/sheets/client.ts`):
  - `401` → auth recovery.
  - `403` → Sheet permission / scope error. The Google session stays
    valid; the user keeps the token and must re-share the Sheet or
    re-grant scopes manually.
  - `404` → "Sheet not found". The Google session stays valid.
- Auth recovery path for `401`:
  1. `clearToken()` removes the bad token from `sessionStorage`.
  2. A `appfinanzas:auth-expired` custom event is dispatched.
  3. A `SheetsAuthError` is thrown to the caller.
- `client-layout.tsx` listens to that event and redirects to
  `/onboarding?error=auth_failed&step=google`. The user does not need
  to clear browser data.
- React Query's `retry` callback short-circuits on `SheetsAuthError`
  (`src/lib/query-client.ts`). No infinite loops.
- The "Re-conectar" / "Iniciar sesion" buttons trigger a real full
  Google OAuth flow via `/auth/google` → Google →
  `/auth/callback?#access_token=...` → store token → redirect.
- After successful login the callback redirects to `/` if a Sheet is
  still connected, or to `/onboarding?step=sheet` to reconnect one.

### 11.3 Disconnect Sheet (keeps Google session)

- Trigger: "Desconectar" in `/settings/preferencias`.
- Action: `useAppStore.disconnect()` clears `sheetId`, `sheetUrl`,
  `templateVersion`, `appMinVersion`, `lastConnectedAt`. The token in
  `sessionStorage` is NOT touched. `localStorage.last_sheet_url` is
  removed.
- Result: the user lands on `/onboarding?step=sheet` and can paste a
  new URL without re-authenticating with Google.

### 11.4 Logout from Google (clears session AND Sheet)

- Trigger: "Cerrar sesion de Google" in `/settings/preferencias`.
- Action: `clearToken()` + `useAppStore.logoutGoogle()` (which clears
  Sheet state and `authStatus`) + `localStorage.removeItem("last_sheet_url")`.
- Result: full reset. The user lands on `/onboarding` step 1
  (Google login) with no prefilled Sheet.

### 11.5 Change Sheet (no logout)

- Trigger: "Cambiar Sheet" in `/settings/preferencias`.
- Action: `disconnect()` (same as 11.3) without touching the token.
  `localStorage.last_sheet_url` is removed so the user can paste a new
  URL. After validating, the new Sheet is stored and `lastConnectedAt`
  is updated.

### 11.6 Reopen the app

- `zustand` rehydrates `sheetConnection` from `localStorage`
  automatically (storage key `app_finanzas_state`, version 3).
- `client-layout.tsx` checks `hasToken()`:
  - if missing and a `sheetId` was restored → redirect to
    `/onboarding?error=auth_failed&step=google`;
  - if missing and no `sheetId` → redirect to
    `/onboarding?error=auth_required`;
  - if present and `isConnected` is false → redirect to
    `/onboarding?step=sheet` (prefill from `last_sheet_url`).
- The onboarding form pre-fills the URL field from
  `localStorage.last_sheet_url` and shows a "Ultima Sheet conectada"
  card with a "Reutilizar" button.

### 11.7 What is NOT stored

- The Google access token is never written to `localStorage` or
  persisted in `zustand`. Only the non-sensitive Sheet metadata is.

## 12. Template validation

The app validates the connected Sheet by structure:

- required sheet names;
- required headers;
- template version (`Config.templateVersion` vs `TEMPLATE_VERSION`);
- minimum compatible schema.

A `.xlsx` upload is acceptable if the Google Sheets API can access it and the
required structure is present. Visual formatting is irrelevant.

## 13. Finance engine contract

- File: `src/lib/finance/finance-engine.ts`.
- Re-exported from `src/lib/finance/index.ts`.
- Pure TypeScript: no React, no Zustand, no Google Sheets API.
- Does not mutate input arrays. All data is passed in as arguments.
- Naming:
  - `get*` for engine functions (e.g. `getAvailableBalance`).
  - `calculate*` kept for primitives in `src/lib/finance/calculations.ts`.
- Exposed surface (non-exhaustive):
  - Income: `getMonthlyIncome`, `getSalaryForMonth`, `getExtraIncome`.
  - Expenses: `getVariableExpenses`, `getFixedExpensesConfirmed`,
    `getFixedExpensesPending`, `getDeferredPayments`, `getTotalExpenses`.
  - Future payments: `getFuturePaymentProvisions`.
  - Savings: `getGeneralSavings`, `getMonthlySavings`, `getSavingsBreakdown`.
  - Balance: `getAvailableBalance`, `explainAvailableBalance`.
  - Progress: `getReserveProgress`, `getGoalProgress`, `getFuturePaymentProgress`.
  - Top level: `getDashboardSummary`, `buildFinanceContext`.
- Consumption: `useFinanceSummary({ monthKey?, confirmedFixedExpenseIds?,
  confirmedDeferredPaymentIds? })` in `src/hooks/use-finance-summary.ts`.
- `confirmedFixedExpenseIds` is the `Set<string>` of `fijoId`s confirmed for
  the month (already wired from `useConfirmedFixedExpenseIds`).
- Predicate: `isConfirmedFixedMovement(t)` matches `id.startsWith("TX-FIJO-")`.

## 14. Phase status

- Phase 3 — schema and template validation — **implemented**.
- Phase 4 — central finance engine — **implemented**.
- Phase 5 — salary / payroll — **implemented**.
- Phase 6 — fixed expenses monthly confirmation — **implemented**.
- Phase 7 — `Mov_reservas` savings ledger — **implemented**.
- Phase 8 — dashboard metrics using the engine — **implemented**.
- Phase 8.5 — critical post-dashboard fixes — **implemented**.
- Phase 9 — forms and movement flows — **implemented**.
- Phase 10 — Google session and Sheet connection recovery — **implemented**.
- Phase 11 — UI / design polish — implemented.
- Phase 12 — emergency functional repair and mobile responsive sweep — pending.

Full phase details, files touched and conventions: `docs/FINANCE_IMPLEMENTATION.md`.

## 15. Next phase pointer

**Phase 12 — emergency functional repair and mobile responsive sweep.**
