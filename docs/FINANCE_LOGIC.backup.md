# Finance Logic — AppFinanciera

## 1. Purpose

This document is the official financial logic source of truth for the app.

The Google Sheet is only the user database. The app contains all business logic, calculations, validations and user flows.

The official Sheet/template for the app is `plantilla_base_finanzas_app.xlsx`. The user's personal `Finanzas.xlsx` is only a reference example and must not be used as the technical source of truth.

## 2. Core architecture

- The app connects to Google Sheets through Google OAuth and Google Sheets API.
- Google Apps Script is not required for the official app logic.
- The app must calculate everything in TypeScript.
- The Sheet must store structured data only.
- The app must validate Sheet compatibility by structure, not by visual formatting.
- A Sheet converted from `.xlsx` is acceptable if Google Sheets API can access it and it contains the required sheets, headers and template version.

## 3. Main financial principle

The app must help the user know:

1. What money came in.
2. What money is already spent.
3. What money is committed.
4. What money must be reserved for future obligations.
5. What money should be saved to meet goals.
6. What money is truly available to spend this month.

The dashboard must not only show numbers. It must explain the logic behind them.

## 4. Income model

Income includes:

- fixed salary;
- variable salary;
- extra income;
- Bizum received;
- refunds or other positive inflows.

### 4.1 Salary

Salary must be stored in the Google Sheet, not only in Zustand/localStorage.

Salary configuration must include:

- salary type: fixed or variable;
- amount, when fixed;
- month-specific amount, when variable;
- destination account;
- active status;
- createdAt and updatedAt when possible.

### 4.2 Fixed salary

Fixed salary must be added once per month as an income movement.

Rules:

- Do not depend only on day 1.
- If the user opens the app on any day of the month and the fixed salary movement for that month does not exist, create it.
- Avoid duplicates using deterministic IDs such as `SALARY-YYYY-MM` or `TX-SALARY-YYYY-MM`.
- The salary movement must use the configured destination account.
- It must count as income for the selected month.

### 4.3 Variable salary

Variable salary is entered manually by the user for each month.

Rules:

- When the user saves the variable salary for a month, create or update the corresponding income movement.
- The amount must remain saved for that month so future calculations remain correct.
- It must not be auto-created unless the user confirms/saves it.

## 5. Expense model

The app must distinguish these expense types clearly:

### 5.1 Variable expenses

Day-to-day expenses such as food, fuel, restaurants, leisure, shopping, health and transport.

They must:

- be added as movements;
- reduce available money;
- count against category budgets;
- appear in expense movement filters and charts.

### 5.2 Fixed expenses

Recurring obligations such as rent, subscriptions, phone bill, utilities, loans, insurance installments or other regular payments.

Confirmed rule:

- Fixed expenses are proposed by the app each month.
- The user reviews them.
- If correct, the user confirms them.
- When confirmed, the app creates real expense movements for that month.
- If not correct, the user can edit amount/account/category before confirming.
- The app must avoid duplicates per month.
- Until confirmed, they are obligations/pending commitments.
- Once confirmed, they become real movements.

### 5.3 Future payments

Future obligations that are not monthly but must be prepared in advance.

Examples:

- car insurance;
- motorcycle insurance;
- ITV;
- vehicle tax;
- yearly subscription;
- planned maintenance.

Rules:

- They are not normal expenses until paid.
- They must reduce recommended available money through monthly provisions.
- They behave as mandatory savings/provisions.
- If the user does not have the money when due, they lose access, coverage or the ability to pay an obligation.

### 5.4 Deferred/installment payments

Already contracted expenses split into several payments.

Examples:

- financing;
- split insurance payment;
- installment purchases;
- debt payments.

Rules:

- Monthly/periodic installment must be treated as committed money.
- Active installments reduce available money.
- They may also be registered as fixed expense movements when confirmed.

### 5.5 Unexpected expenses

Unexpected or emergency expenses such as fines, repairs or urgent purchases.

They must be trackable separately if possible, because they affect financial stability analysis.

## 6. Savings model

Savings are not normal expenses.

Savings reduce spendable available money but must not be mixed with normal spending.

Savings can be assigned to:

- emergency fund;
- safety cushion;
- reserves;
- goals;
- future payments;
- investment fund;
- personal wants.

Savings can last years, so the app must store historical movements correctly.

### 6.1 General savings

Dashboard must show general savings:

- total saved across reserves, goals and future payment provisions;
- total target amount;
- progress percentage;
- breakdown when clicked.

When the user clicks general savings, the app must show how savings are divided.

### 6.2 Monthly savings

Dashboard must show monthly savings:

- how much was planned for this month;
- how much has already been saved this month;
- how it was divided this month across goals, reserves and future payments;
- whether the monthly saving has been completed.

### 6.3 Monthly saving confirmation

There must be a flow such as "Mark this month's saving as done".

When the user confirms:

- the app creates the required saving records;
- target balances are updated;
- that money is no longer considered available;
- the same monthly saving should not be confirmed twice unless the user explicitly edits/reverts it.

## 7. Savings ledger / Mov_reservas

`Mov_reservas` should be used as the savings ledger.

It should track historical saving contributions and withdrawals.

Recommended fields:

- id;
- fecha;
- mesClave;
- tipoDestino: reserva / objetivo / pago_futuro;
- destinoId;
- tipoMovimiento: aporte / retirada;
- importe;
- cuentaOrigen;
- cuentaDestino;
- notas;
- createdAt;
- updatedAt.

Purpose:

- know what was saved;
- know when it was saved;
- know what it was assigned to;
- support multi-year savings;
- keep dashboard and goals auditable.

## 8. Accounts model

Accounts are real or user-defined money containers.

Examples:

- BBVA;
- Imagin;
- Revolut;
- PayPal;
- cash;
- user-created bank accounts.

The app must support users with one account or many accounts.

Accounts should include an account usage/role field:

- daily spending;
- fixed expenses;
- savings;
- general.

This role is not the same as the bank name. It helps the app calculate available money correctly.

Salary must enter a selected destination account.
Expenses must leave a selected source account.
Savings must move money from available/spending money to the selected saving destination.

## 9. Available balance logic

Dashboard "Disponible" must show the money the user can still spend this month.

It must consider:

- monthly income;
- salary movement of the month;
- variable expenses already made;
- fixed expenses confirmed or expected;
- active deferred/installment payments;
- future payment monthly provisions;
- planned monthly savings;
- savings already made this month;
- account roles.

Suggested formula:

```text
Available to spend this month =
monthly income
- variable expenses already made
- confirmed fixed expenses
- pending fixed obligations if not yet confirmed
- active deferred payment installments
- required future payment provisions
- planned savings contributions
+/- corrections from savings already executed when needed
```

The available card must be clickable.

When clicked, it must show a detailed explanation of the calculation, including each component.

## 10. Dashboard metrics

Dashboard must show at least:

- Disponible;
- Ingresos;
- Gastos variables;
- Gastos fijos confirmed/pending;
- Gastos totales or total obligations;
- Ahorro general;
- Ahorro del mes;
- Future payment provisions;
- Month status.

### 10.1 Interactions

- Clicking Disponible opens calculation details.
- Clicking Ingresos opens movements filtered by income for the selected month.
- Clicking Gastos opens movements filtered by expenses for the selected month.
- Clicking Ahorro general expands savings breakdown by reserves, goals and future payments.
- Clicking Ahorro del mes shows this month's saving distribution.

## 11. Forms and movements

Payment method must never be free text.

Allowed payment method options for expenses:

- card;
- cash;
- Bizum.

Income should not use "payment method" as if it were a payment. It should require destination account and optionally an income channel if needed.

Rules:

- Income requires destination account.
- Expense requires source account.
- Transfer requires source and destination account.
- Saving uses its own flow and must not behave exactly like income/expense.
- Saving should allocate money to general savings by default, unless the user chooses a specific destination.

## 12. Google session and Sheet connection

Google auth state and Sheet connection state must be separate.

If Google token expires:

- clear invalid token;
- keep saved Sheet URL/ID if possible;
- trigger full Google login again;
- do not block the user;
- after login, restore the previous Sheet if still valid.

Disconnect Sheet:

- clears Sheet connection;
- keeps Google session active.

Log out Google:

- clears Google token/session;
- clears Sheet connection if appropriate;
- returns user to login/onboarding.

Changing Sheet must not log the user out from Google.

## 13. Template validation

The app must validate the official template by structure:

- required sheet names;
- required headers;
- template version;
- minimum compatible schema.

Do not reject a valid Sheet only because it originated from `.xlsx`.

If Google Sheets API can access it and the required structure exists, it is valid.

## 14. Implementation priorities

Priority order:

1. Create/maintain this finance logic document.
2. Audit current distributed calculations.
3. Centralize calculations in a finance engine.
4. Fix salary logic.
5. Fix fixed expense confirmation logic.
6. Redefine savings ledger.
7. Fix dashboard metrics.
8. Fix forms and movements.
9. Fix Google session recovery.
10. Improve dashboard design and customization.

## 15. Finance engine requirement

The central finance engine lives in:

`src/lib/finance/finance-engine.ts`

It is re-exported from `src/lib/finance/index.ts`.

### 15.1 Contract

- Pure TypeScript functions. No React, no Zustand, no Google Sheets API.
- Do not mutate input arrays.
- All data is passed in as arguments; functions only compute and return.
- The input shape is `FinanceContext`, built via `buildFinanceContext(input)`.

### 15.2 Exposed functions

- Income
  - `getMonthlyIncome(ctx)` — total `Ingreso` movements for the month.
  - `getSalaryForMonth(ctx)` — sum of salary movements (id prefix `TX-SALARY-` or `SALARY-`).
  - `getExtraIncome(ctx)` — `getMonthlyIncome − getSalaryForMonth`.
- Expenses
  - `getVariableExpenses(ctx)` — `Gasto` movements excluding confirmed fixed expense movements.
  - `getFixedExpensesConfirmed(ctx)` — sum of `Gastos_fijos` whose `fijoId` is in `confirmedFixedExpenseIds`.
  - `getFixedExpensesPending(ctx)` — sum of active `Gastos_fijos` not yet confirmed.
  - `getDeferredPayments(ctx)` — sum of `cuotaMensual` for active installments.
  - `getTotalExpenses(ctx)` — sum of the four above.
- Future payment provisions
  - `getFuturePaymentProvisions(ctx)` — sum of `aporteMensual` for active future payments; if missing and `mesesRestantes > 0`, derive as `(importeObjetivo − saldoReservado) / mesesRestantes`.
- Savings
  - `getGeneralSavings(ctx)` — aggregated savings state across reserves, goals and future payment provisions.
  - `getMonthlySavings(ctx)` — savings contributions for the month, split by `tipoDestino` and a `general` bucket for legacy `Ahorro` movements without `reservaId`.
  - `getSavingsBreakdown(ctx)` — per-target detail (reserves, goals, future payments).
- Available balance
  - `getAvailableBalance(ctx)` — full breakdown with `explanation` array.
  - `explainAvailableBalance(values)` — produces the `explanation` array.
- Progress
  - `getReserveProgress(reserveId, ctx)`, `getGoalProgress(goalId, ctx)`, `getFuturePaymentProgress(pagoId, ctx)` — return `SavingsTargetDetail | null`.
- Top level
  - `getDashboardSummary(ctx)` — `DashboardFinanceSummary` aggregating the above.
  - `buildFinanceContext(input)` — assembles a `FinanceContext` with sane defaults.

### 15.3 Naming convention

- Primitives in `src/lib/finance/calculations.ts` keep the `calculate*` prefix (e.g. `calculateExpensesByCategory`).
- Engine functions in `src/lib/finance/finance-engine.ts` use the `get*` prefix (e.g. `getMonthlyIncome`). This avoids name collisions between primitive and engine APIs and matches the canonical spec.

### 15.4 Balance source of truth

For `Reservas`, `Objetivos` and `Pagos_futuros`, the engine derives the saved amount from `Mov_reservas` when at least one matching movement exists. When the ledger is empty for a target, the engine falls back to the `saldoActual` (or `saldoReservado`) field on the model. This keeps the engine backward compatible with rows that pre-date the `Mov_reservas` ledger (Phase 7 will switch writes to the ledger).

### 15.5 Available balance formula

```
available = income
          − variableExpenses
          − fixedExpensesConfirmed
          − fixedExpensesPending
          − deferredPayments
          − futurePaymentProvisions
          − plannedSavings
```

`plannedSavings` is derived as `max(0, (income − variableExpenses − fixedConfirmed − fixedPending − deferred) × 0.2)`. This default 20% rate is a placeholder until a user-configurable savings goal is added in a later phase.

### 15.6 Consumption

Dashboard and other screens MUST consume the engine instead of implementing their own calculations. A convenience hook `useFinanceSummary({ monthKey?, confirmedFixedExpenseIds?, confirmedDeferredPaymentIds? })` is provided in `src/hooks/use-finance-summary.ts`. It loads all the necessary data via the existing React Query hooks, builds a `FinanceContext` and returns a memoized `DashboardFinanceSummary`.

## 16. Current Implementation Audit

This section documents what already exists in the codebase, what is incomplete or wrong, and what future phase should fix it. Source files are referenced with `path:line` for traceability.

### 16.1 Dashboard calculations

- **Current files**: `src/app/page.tsx`, `src/components/dashboard/savings-panel-expanded.tsx`, `src/lib/finance/calculations.ts`, `src/lib/finance/chart-data.ts`.
- **What currently works**:
  - Ingresos / Gastos / Ahorro are computed by filtering `Movimientos` by `tipo` (`page.tsx:216-237`).
  - Disponible formula exists in `page.tsx:260-262`:
    `Available = totalIncome - (fixedMonthly + deferredMonthly + futureMonthly + totalExpenses) - userSavingsThisMonth`.
  - A "Plan de ahorro" widget proposes 20% of net (`page.tsx:276-290`).
  - Click on Ingresos navigates to `/transactions?filterType=Ingreso` and Gastos to `/transactions?filterType=Gasto` (`page.tsx:311-317`).
- **What is incomplete or wrong**:
  - The formula lives inline in the page component. Different components (`savings-panel-expanded.tsx`, `dashboard-customizer`, `chart-data.ts`) recompute their own slices.
  - Disponible is shown but the user cannot open a detailed explanation modal yet.
  - The "Plan de ahorro" widget uses 20% of a single base; it does not consider that the user already executed monthly savings.
  - The chart `dataSource: "categories"` is hardcoded in `page.tsx:292-296`; the memo returns the same value regardless of which chart is active.
- **Verdict**: refactor into a central engine. Keep `calculations.ts` as helper primitives; add `finance-engine.ts` to orchestrate.
- **Fix in**: Phase 4 + Phase 8.

### 16.2 Salary / payroll logic

- **Current files**: `src/lib/finance/salary.ts`, `src/features/savings/SavingsPanelExpanded` (button adds savings, not salary), `src/app/more/salary/page.tsx`, `src/app/more/page.tsx`, `src/stores/app-store.ts` (state for `monthlyIncome`, `incomeType`, `lastIncomeSetMonth`, `salaryAddedMonths`).
- **What currently works**:
  - Configured salary type (fixed/variable) and amount saved via `/more/salary` and persisted in `app-store.ts`.
  - `ensureMonthlySalary` builds a `TX-SALARY-...` movement and appends it to `Movimientos`.
- **What is incomplete or wrong**:
  - `shouldAddSalaryToday` (`salary.ts:74-87`) only adds the salary when the day of month is 1. This violates rule 4.2: salary must be added on any day if the monthly movement is missing.
  - ID is `TX-SALARY-${Date.now()}` (timestamp-based), not the deterministic `TX-SALARY-YYYY-MM` required by rule 4.2. This means duplicate prevention relies on the `salaryAddedMonths` local array in Zustand, not on a real server-side check. If the user clears localStorage, the salary is duplicated.
  - Salary config is only in localStorage / Zustand, not in the Sheet. Rule 4.1 requires salary to live in the Sheet.
  - Variable salary is not implemented: the user has no UI to save/update the monthly variable amount as a real income movement.
  - Salary movement has empty `cuentaDestino` (`salary.ts:36-52`); destination account is not wired.
- **Verdict**: rewrite. Keep `ensureMonthlySalary` and `shouldAddSalaryToday` signatures but fix the logic.
- **Fix in**: Phase 5.

### 16.3 Movements / transactions

- **Current files**: `src/features/transactions/hooks/use-transactions.ts`, `src/features/transactions/components/transaction-form.tsx`, `src/schemas/transaction*`.
- **What currently works**:
  - Create / read / update / soft-delete movements via `useTransactions`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`.
  - Schema validation with Zod (`transactionCreateSchema`, `transactionUpdateSchema`).
  - Filters by `mesClave` and `deletedAt` (soft delete).
- **What is incomplete or wrong**:
  - Transaction form has no required differentiation: Income does not require destination account; Saving does not require `reservaId` or a specific destination.
  - The saving flow is identical to expense/income. The user cannot choose "this saving is for Reserve X" from the form.
  - Edit does not refetch; the form `reset(defaultValues)` reuses the same initial data only.
  - Query-param filters in `/transactions` (e.g. `?filterType=Ingreso`) are not yet implemented / verified.
- **Verdict**: keep the hook structure, refactor the form to branch by type.
- **Fix in**: Phase 9.

### 16.4 Fixed expenses

- **Current files**: `src/features/fixed-expenses/hooks/use-fixed-expenses.ts`, `src/features/fixed-expenses/components/fixed-expense-form.tsx`, `src/app/savings/page.tsx` (the "Fijos" tab), `src/components/dashboard/savings-panel-expanded.tsx`.
- **What currently works**:
  - CRUD on `Gastos_fijos` sheet.
  - Computed monthly equivalent using `Mensual / Trimestral / Anual` in `savings-panel-expanded.tsx:92-98` and `page.tsx:239-246`.
- **What is incomplete or wrong**:
  - There is no confirmation flow. Rule 5.2 requires: app proposes → user reviews → user confirms → real movements created. The current code only stores the fixed expense definition; it never creates the monthly expense movement.
  - No `Movimientos_fijos_confirmados` / monthly confirmation state. The model does not track which month has been confirmed.
  - There is no "pending confirmation" list separate from "confirmed" list.
- **Verdict**: extend the existing module. Add a confirmation screen and a per-month confirmation ledger.
- **Fix in**: Phase 6.

### 16.5 Future payments

- **Current files**: `src/features/future-payments/hooks/use-future-payments.ts`, `src/features/future-payments/components/future-payment-form.tsx`, `src/lib/finance/chart-data.ts` (`"future"` data source).
- **What currently works**:
  - CRUD on `Pagos_futuros` sheet with `importeObjetivo`, `saldoReservado`, `mesesRestantes`, `aporteMensual`.
  - Dashboard "total" chart aggregates `future.aporteMensual` for active items.
- **What is incomplete or wrong**:
  - `mesesRestantes` and `aporteMensual` are stored manually by the user instead of being calculated from `fechaVencimiento` and `importeObjetivo - saldoReservado`.
  - There is no automatic increment of `saldoReservado` when the user records a contribution. The user has to update the future payment manually.
  - Contributions are not currently written to `Mov_reservas` with `tipoDestino = "pago_futuro"`. The savings ledger is not connected to future payments.
- **Verdict**: keep the model, compute `mesesRestantes` and `aporteMensual` automatically, connect to `Mov_reservas`.
- **Fix in**: Phase 4 + Phase 7.

### 16.6 Deferred / installment payments

- **Current files**: `src/features/deferred-payments/hooks/use-deferred-payments.ts`, `src/features/deferred-payments/components/deferred-payment-form.tsx`, `src/app/savings/page.tsx` ("Aplazados" tab).
- **What currently works**:
  - CRUD on `Pagos_aplazados` sheet.
  - Dashboard includes `cuotaMensual` of active installments in Disponible via `page.tsx:248-252`.
- **What is incomplete or wrong**:
  - There is no automatic movement creation when a month passes. The user has to add a manual `Movimiento` of type `Gasto` each month.
  - `importePagado` is updated only manually; not incremented when the user logs a payment.
- **Verdict**: keep the model, but auto-create the monthly expense movement (with deterministic ID like `DEFER-YYYY-MM-APL-id`) and update `importePagado`.
- **Fix in**: Phase 4 + Phase 6 (reuse confirmation flow for installments).

### 16.7 Savings / reserves / goals

- **Current files**: `src/features/reserves/*`, `src/features/goals/*`, `src/components/dashboard/savings-panel-expanded.tsx`.
- **What currently works**:
  - CRUD on `Reservas` and `Objetivos` sheets.
  - `SavingsPanelExpanded` shows total saved, total target, and per-item progress.
  - "Ahorro del mes" button creates an `Ahorro` movement for `20%` of (income - fixed).
- **What is incomplete or wrong**:
  - `saldoActual` on `Reservas` and `Objetivos` is updated manually by the user. The app does not read `Mov_reservas` to compute the real balance.
  - There is no way to allocate a contribution to a specific reserve or goal from the saving form. All savings become a generic `Ahorro` movement with empty `reservaId`.
  - General savings and monthly savings are mixed: the `SavingsPanelExpanded` shows both as a single block. Rule 10.1 requires them to be clickable and split.
- **Verdict**: keep the model, wire `saldoActual` to `Mov_reservas`, split the dashboard panel into General vs. Monthly.
- **Fix in**: Phase 7 + Phase 8.

### 16.8 `Mov_reservas` handling

- **Current files**: `src/features/reserve-movements/*`, `src/constants/sheet-structure.ts` (`MOV_RESERVAS_HEADERS`).
- **What currently works**:
  - The sheet is read and written via `ReserveMovements` list (visible from the savings screen "History" button).
  - Headers include `id, fecha, reservaId, tipoMovimiento, importe, cuentaOrigen, cuentaDestino, notas, createdAt`.
- **What is incomplete or wrong**:
  - The header is missing `mesClave` and `tipoDestino` (rule 7 requires both). Adding them does not break compatibility because Google Sheets accepts new columns.
  - The savings form does not write a `Mov_reservas` row. The "Ahorro del mes" button writes a generic `Ahorro` in `Movimientos` instead.
  - `Reservas.saldoActual` is not derived from `Mov_reservas`. They can drift apart.
- **Verdict**: extend the header (add `mesClave`, `tipoDestino` as new columns), redirect all contributions to `Mov_reservas`, derive balances from it.
- **Fix in**: Phase 4 + Phase 7.

### 16.9 Account logic

- **Current files**: `src/features/accounts/hooks/use-accounts.ts`, `src/types/models.ts` (`AccountRow`), `src/constants/enums.ts` (`AccountType`).
- **What currently works**:
  - CRUD on `Cuentas` sheet.
  - `AccountRow` already has `saldoInicial` and `saldoActualManual` fields.
- **What is incomplete or wrong**:
  - There is no `rol` (role) field on `AccountRow` — only `tipo` (Banco / Efectivo / Virtual / Otro). Rule 8 requires a role field (daily / fixed / savings / general).
  - The dashboard does not filter Disponible by account role. Currently Disponible is global.
- **Verdict**: extend `AccountRow` with an optional `rol` column. Backward compatible (additive). Filter Disponible per role when user has more than one role.
- **Fix in**: Phase 3 + Phase 8.

### 16.10 Google Sheet validation

- **Current files**: `src/lib/sheets/reader.ts` (`validateSheetCompatibility`), `src/constants/sheet-structure.ts`, `src/app/onboarding/page.tsx`.
- **What currently works**:
  - `validateSheetCompatibility` checks required sheets and required headers.
  - Onboarding distinguishes between "essential" sheets and "advanced" sheets.
  - Error messages are user-friendly (missing sheet, missing columns, permission denied).
- **What is incomplete or wrong**:
  - The "advanced" check is a console warning, not enforced.
  - `Config.templateVersion` is not actually read. `TEMPLATE_VERSION` is hardcoded in `sheet-structure.ts`.
  - The validation assumes Spanish sheet names from the template. If the user has a translated Sheet, validation will fail.
- **Verdict**: keep the validator. Add version checking, add the new columns to `SHEET_REQUIRED_HEADERS` when they are introduced (`mesClave`, `tipoDestino` in `Mov_reservas`, `rol` in `Cuentas`).
- **Fix in**: Phase 3.

### 16.11 Google Sheets readers / writers

- **Current files**: `src/lib/sheets/client.ts`, `src/lib/sheets/reader.ts`, `src/lib/sheets/writer.ts`, `src/lib/sheets/adapters.ts`.
- **What currently works**:
  - `batchGetSheet`, `batchUpdateSheet`, `appendRowToSheet`, `updateCell` cover the common operations.
  - `readSheetData` is a generic reader with row adapters.
  - `appendModelRow`, `updateRowByColumn`, `softDeleteRow`, `findRowIndexByColumnValue` are reusable writers.
  - `SheetsApiError` exposes `isAuthError`, `isPermissionError`, `isNotFoundError`, `isQuotaError`.
- **What is incomplete or wrong**:
  - `getToken()` reads from `sessionStorage` directly inside the writers. There is no central request layer that would let us add retry / 401-recovery easily.
  - No throttling for the Sheets API quota.
  - `readSheetData` reads up to row 1000 only. If the user has more than ~1000 movements, the rest are ignored.
- **Verdict**: keep the surface, add a thin request layer in `client.ts` that centralizes `getToken()` and 401 handling. Extend range limit or paginate.
- **Fix in**: Phase 10.

### 16.12 Google auth / session handling

- **Current files**: `src/lib/google/auth.ts`, `src/app/auth/google/page.tsx`, `src/app/auth/callback/page.tsx`, `src/components/client-layout.tsx`, `src/app/onboarding/page.tsx`.
- **What currently works**:
  - OAuth implicit flow with `access_token` returned in URL hash.
  - Token stored in `sessionStorage` (`getToken` / `setToken` / `clearToken`).
  - Onboarding reads token to decide which step to show.
  - `disconnect()` is the only place that clears connection state.
- **What is incomplete or wrong**:
  - No token refresh (implicit flow has no refresh token). When the token expires, the user has to re-login.
  - There is no proactive 401 handler. The `client-layout.tsx` only checks `isConnected` from the store; it does not validate the token.
  - Onboarding mixes "Google login state" and "Sheet connected" into a single flow. The user cannot disconnect the Sheet without re-doing Google login.
  - Rule 12 is partially met: changing Sheet does not log out Google (good), but the current implementation does not have a "Disconnect Sheet only" action.
- **Verdict**: split the actions. Add a "Disconnect Sheet" action that preserves Google auth. Add a token-aware 401 recovery in the request layer.
- **Fix in**: Phase 10.

### 16.13 Movement forms and selectors

- **Current files**: `src/features/transactions/components/transaction-form.tsx`, `src/constants/payment-methods.ts`, `src/schemas/transaction*`.
- **What currently works**:
  - Zod schema validation.
  - Payment method as a fixed selector (`PAYMENT_METHOD_OPTIONS`).
  - Form branches: payment method is hidden for `Ingreso`; `cuentaDestino` is shown only for transfers.
- **What is incomplete or wrong**:
  - No required destination account for `Ingreso` (rule 11).
  - Saving flow does not require a `reservaId` or a destination reserve/goal.
  - `metodo` is still a string select; rule 11 only allows `card / cash / Bizum` but the current options also include `Transferencia, Domiciliación, Otro` (kept in `payment-methods.ts`). The rule 11 narrow list should be confirmed and either narrowed or documented as a superset.
- **Verdict**: tighten required fields per type. Confirm the allowed payment method set.
- **Fix in**: Phase 9.

### 16.14 Zustand persisted dashboard configuration

- **Current files**: `src/stores/app-store.ts`, `src/components/dashboard/dashboard-customizer.tsx`, `src/app/page.tsx`.
- **What currently works**:
  - `dashboardConfig.widgets` and `dashboardConfig.charts` are persisted to localStorage.
  - `onRehydrateStorage` patches missing `charts` or `widgets` arrays.
  - `DashboardCustomizer` allows the user to add/edit/remove charts.
- **What is incomplete or wrong**:
  - **Known risk (AGENTS.md)**: persist has no `version` field. The old `chartType` schema had no `charts` array. `onRehydrateStorage` patches this but the patch is async — the first render of `page.tsx` may read `dashboardConfig.charts` as undefined. Hotfixed with `(dashboardConfig.charts ?? [])` fallbacks in `page.tsx:414,433` and `dashboard-customizer.tsx:453,463,502`. A `version: 2` was added but no `migrate` function.
  - `useWidgetReorder` is destructured in `page.tsx:161-171` but its handlers are never wired to any DOM element. The reorder UX is not functional.
  - Dashboard only renders `dashboardConfig.charts[0]` (single chart), although the customizer allows multiple.
- **Verdict**: finish the persist migration (add `merge` to handle the `chartType → charts` transition). Either wire the reorder hook or remove the dead code. Multi-chart rendering is out of scope for Phases 0-2.
- **Fix in**: Phase 4 (engine uses `dashboardConfig.charts[0]` only; multi-chart is a UI concern deferred to Phase 11).

### 16.15 `src/lib/finance/` current files

- `calculations.ts`: pure helpers for monthly income/expenses/savings, category breakdown, goal/reserve progress, completion date, health status. These are primitives. **Keep.**
- `salary.ts`: implements `ensureMonthlySalary` and `shouldAddSalaryToday`. Logic is incomplete (day-1 only, no destination account, no deterministic ID). **Refactor in Phase 5.**
- `chart-data.ts`: aggregates transactions/fixed/future/deferred into chart series by `dataSource`. Already used by `ChartRenderer`. **Keep but consume from the engine.**
- `index.ts`: only re-exports `calculations`. **Extend to also re-export the new engine.**

### 16.16 Summary of conflicts found

1. **Salary day-1 dependency vs rule 4.2** (`salary.ts:74-87`). Critical.
2. **Salary not stored in Sheet vs rule 4.1** (`app-store.ts`, `salary.ts`). Critical.
3. **No destination account on salary movement** (`salary.ts:36-52`). Critical for Available by account role.
4. **No deterministic ID for salary** (`salary.ts:33`). Critical for duplicate prevention when localStorage is cleared.
5. **Fixed expenses have no monthly confirmation flow** (`use-fixed-expenses.ts`, `savings/page.tsx`). Critical for rule 5.2.
6. **`Mov_reservas` not used as the savings ledger** (`savings-panel-expanded.tsx:107-131`). Critical for rule 7.
7. **`Reservas.saldoActual` is manual, not derived from `Mov_reservas`**. Critical for rule 6.1.
8. **Dashboard "Disponible" is global, not per account role** (`page.tsx:262`). Compliance with rule 8 partial.
9. **Zustand persist schema change has no `migrate`** (`app-store.ts:261-263`). Hotfixed in UI but the underlying state is still risky. Mitigated by `version: 2`.
10. **`useWidgetReorder` is dead code** (`page.tsx:161-171`, `widget-reorder.tsx`). Not financial, but it lives in the dashboard surface and is a maintainability risk.
11. **`mesClave` and `tipoDestino` missing on `Mov_reservas` header** (`sheet-structure.ts:111-121`). Required by rule 7. Backward compatible (additive).
12. **`rol` missing on `Cuentas`** (`types/models.ts:52-65`, rule 8). Backward compatible (additive).
13. **`/transactions` query param filter is not yet implemented** (`page.tsx:312,316` navigates with `?filterType=...` but the transactions page may not consume it). Not financial, but a UX risk.
14. **No 401-recovery in the Sheets request layer** (`client.ts`). Means expired tokens surface as a generic error to the user.

## 17. Implementation Plan

This section defines the next phases clearly. Each phase must end with `npx tsc --noEmit && npm run build` passing and the relevant parts of this document updated.

### Phase 3 — Template / schema and validation

- Review official template structure and confirm it matches `SHEET_NAMES` and `*_HEADERS` in `src/constants/sheet-structure.ts`.
- Add two new columns to `Mov_reservas`: `mesClave` and `tipoDestino` (additive; do not break existing rows).
- Add `rol` column to `Cuentas` (additive).
- Update TypeScript models (`src/types/models.ts`).
- Update `SHEET_REQUIRED_HEADERS` in `src/lib/sheets/reader.ts` so the validator recognizes the new columns without failing.
- Read `Config.templateVersion` from the Sheet and compare with `TEMPLATE_VERSION` constant. Warn on mismatch but do not block.
- Confirm `.xlsx` upload is still accepted if Sheets API can access it (current behavior — keep it).

### Phase 4 — Central finance engine

- Audit `src/lib/finance/` (already done in section 16.15).
- Create `src/lib/finance/finance-engine.ts` exporting pure functions. Each function takes the required data (`transactions`, `categories`, `fixedExpenses`, `futurePayments`, `deferredPayments`, `reserves`, `goals`, `reserveMovements`, salary state) and returns a typed result. No React, no Zustand.
- Functions to expose:
  - `getMonthlyIncome(monthKey, transactions, salaryConfig, salaryMovements)` — total income including auto salary.
  - `getSalaryForMonth(monthKey, transactions, salaryConfig)` — salary movements for the month.
  - `getVariableExpenses(monthKey, transactions)` — sum of `Gasto` excluding confirmed fixed movements if applicable.
  - `getFixedExpensesConfirmed(monthKey, transactions)` — confirmed monthly fixed expense movements.
  - `getFixedExpensesPending(monthKey, fixedExpenseDefinitions, confirmedSet)` — fixed definitions not yet confirmed for the month.
  - `getDeferredMonthly(deferredPayments)` — sum of `cuotaMensual` for `estado = Activo`.
  - `getFuturePaymentProvisions(futurePayments)` — sum of `aporteMensual` for `activo = S`.
  - `getGeneralSavings(reserves, goals, futurePayments, reserveMovements)` — aggregated savings state.
  - `getMonthlySavings(monthKey, reserveMovements, transactions)` — savings contributions for the month, split by destination.
  - `getAvailableBalance(monthKey, ctx)` — the full Disponible formula.
  - `explainAvailableBalance(monthKey, ctx)` — array of `{ label, value, sign }` describing the formula.
  - `getGoalProgress(goalId, ctx)`, `getReserveProgress(reserveId, ctx)`, `getFuturePaymentProgress(pagoId, ctx)`.
- `src/lib/finance/index.ts` re-exports the engine.
- Existing `calculations.ts` helpers stay as primitives; the engine uses them.

**Status (Phase 4)**: implemented. See section 15 for the actual function list, naming convention and balance source of truth. Dashboard consumption is scheduled for Phase 8.

### Phase 5 — Salary

- Move salary config to the Sheet: add a `Config_Salary` row in `Config` (key/value form) OR a new `Nomina` sheet. Pick the simpler one (key/value in `Config`).
- Salary movement ID becomes `TX-SALARY-YYYY-MM` (deterministic).
- `shouldAddSalaryToday` becomes `ensureSalaryForMonth(monthKey)`:
  - If a movement with `id = TX-SALARY-YYYY-MM` exists, do nothing.
  - Else, create it on the user's destination account with the configured amount.
- `ensureSalaryForMonth` runs on any day the user opens the app for that month (not only day 1).
- Variable salary: add UI in `/more/salary` to save the current month amount; this creates/updates `TX-SALARY-YYYY-MM-VAR` (or reuses the same deterministic id pattern).
- Wire `cuentaDestino` to the salary movement.

### Phase 6 — Fixed expenses confirmation

- Add a `Config_Fijos_Confirmados` sheet (or a new column on `Movimientos` like `origenFijoId`) to track which fixed expense has been confirmed for which month.
- Flow:
  - On dashboard, show a "Pendientes" card listing the proposed fixed expenses for the current month.
  - User reviews and can edit each proposed expense.
  - User taps "Confirmar mes". For each confirmed fixed expense, the app creates a real `Gasto` movement in `Movimientos` with `id = TX-FIJO-YYYY-MM-fijoId` and marks the fixed expense as confirmed for the month.
  - Duplicates are impossible because the id is deterministic.
- Installments (`Pagos_aplazados`) follow the same pattern: each active installment creates a `TX-DEFER-YYYY-MM-aplazadoId` movement when confirmed for the month.

### Phase 7 — Savings and `Mov_reservas`

- `Mov_reservas` is the single source of truth for savings balances.
- `Reservas.saldoActual` and `Objetivos.saldoActual` are derived columns: they are the sum of `Mov_reservas` for that `destinoId` where `tipoMovimiento = Aportacion` minus where `tipoMovimiento = Disposicion`.
- The `Reservas` / `Objetivos` `saldoActual` field becomes optional or read-only (kept for display only).
- Saving flow: when the user records a saving from any form, the app writes to `Mov_reservas` with `tipoDestino`, `destinoId`, `tipoMovimiento = Aportacion`. The corresponding `Movimientos` row is no longer the source of truth (kept only as audit).
- Future payment contributions: a contribution to a future payment also writes to `Mov_reservas` with `tipoDestino = pago_futuro`.
- The dashboard "Ahorro del mes" button creates both a `Mov_reservas` row and updates the related reserve/goal balance.

### Phase 8 — Dashboard metrics

- The dashboard consumes the central engine.
- `Disponible` is the engine's `getAvailableBalance` result. Clicking it opens a modal/sheet with `explainAvailableBalance` output.
- `Ahorro general` and `Ahorro del mes` are two separate cards. Each click opens a different breakdown.
- `Ahorro general` shows totals across reserves, goals and future payments. `Ahorro del mes` shows how this month was distributed.
- Filter navigation (Ingresos / Gastos) uses `/transactions?filterType=...` and the transactions page must consume the param (verify in Phase 9).

### Phase 9 — Forms and movements

- `TransactionForm` branches by type:
  - `Ingreso`: required `cuentaDestino` (no `metodo`).
  - `Gasto`: required `cuentaOrigen`, `metodo` from the fixed selector (card / cash / Bizum / Transferencia / Domiciliación / Otro — confirm with the user before narrowing).
  - `Transferencia interna`: required `cuentaOrigen` and `cuentaDestino`.
  - `Ahorro`: required destination reserve/goal (optional, default = general savings).
- Required fields become required at the Zod level.
- `/transactions?filterType=Ingreso|Gasto` must apply the filter at the hook level.
- Movement edit: confirm the form re-fetches after update.
- Category creation: confirm `useSeedDefaultCategories` does not duplicate.

### Phase 10 — Google session and Sheet connection

- Centralize Sheets requests in `src/lib/sheets/client.ts`. The request layer:
  - Reads the token from `sessionStorage`.
  - On 401, clears the token, fires a global event, and the user is redirected to `/onboarding?error=auth_required` (preserving the previous `sheetId` if any).
- Add `disconnectSheet()` action to the store. It clears `sheetId` and `sheetUrl` but does NOT touch the Google token.
- Add `logoutGoogle()` action. It clears the token and the Sheet connection.
- Reconnect flow: the user can re-paste a Sheet URL without re-doing Google login, as long as the token is still valid.

### Phase 11 — UI / design after logic

- Improve dashboard header.
- Improve forms (consistent spacing, sticky footer).
- Improve charts (use `getChartData` for the active data source; respect `accentColor`, `animations`, `showLabels`).
- Improve widget customization (multi-chart layout deferred — the single-chart behavior is the engine contract for now).
- Implement long-press widget reorder (currently dead code in `useWidgetReorder`).
