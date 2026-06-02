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
- Will follow the same month-by-month confirmation pattern as fixed expenses
  (deterministic ID `TX-DEFER-YYYY-MM-aplazadoId`). Tracked under Phase 7.

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
- Soft-deletes use `tipoMovimiento = "Eliminado"`. The engine ignores
  soft-deleted rows.
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

- `plannedSavings = max(0, (income − variableExpenses − fixedConfirmed
  − fixedPending − deferred) × 0.2)`. The 20% rate is a placeholder; a
  user-configurable savings goal will replace it in a later phase.
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

## 10. Forms and movements

- `Ingreso` requires `cuentaDestino`. No `metodo`.
- `Gasto` requires `cuentaOrigen` and `metodo` from the fixed selector.
- `Transferencia interna` requires `cuentaOrigen` and `cuentaDestino`.
- `Ahorro` requires a destination reserve / goal / future payment (general fallback
  allowed). Phase 9 enforces this at the Zod level.
- Payment method is a fixed selector: `Tarjeta / Efectivo / Bizum / Transferencia
  / Domiciliación / Otro`. (To be confirmed or narrowed in Phase 9.)
- `/transactions?filterType=Ingreso|Gasto` must apply the filter at the hook
  level. (Phase 9.)

## 11. Google session and Sheet connection

These are two separate states.

- Google token expiry:
  - clear the invalid token;
  - keep the saved `sheetId` / `sheetUrl` if possible;
  - trigger a fresh Google login;
  - restore the Sheet connection once the user logs in again.
- "Disconnect Sheet" → clears the Sheet connection, keeps Google auth.
- "Logout Google" → clears the token and the Sheet connection.
- Changing the Sheet must not log the user out from Google.
- Implementation details live in Phase 10.

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
- Phase 9 — forms and movement flows — pending.
- Phase 10 — Google session and Sheet connection recovery — pending.
- Phase 11 — UI / design polish — pending.

Full phase details, files touched and conventions: `docs/FINANCE_IMPLEMENTATION.md`.

## 15. Next phase pointer

**Phase 9 — Forms and movement flows.**
