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

There must be a flow such as “Mark this month’s saving as done”.

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

Dashboard “Disponible” must show the money the user can still spend this month.

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
- Clicking Ahorro del mes shows this month’s saving distribution.

## 11. Forms and movements

Payment method must never be free text.

Allowed payment method options for expenses:

- card;
- cash;
- Bizum.

Income should not use “payment method” as if it were a payment. It should require destination account and optionally an income channel if needed.

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

Create or maintain a central finance engine, for example:

`src/lib/finance/finance-engine.ts`

It should expose pure functions for:

- monthly income;
- salary for month;
- variable expenses;
- fixed expenses confirmed;
- fixed expenses pending confirmation;
- deferred payments;
- future payment provisions;
- general savings;
- monthly savings;
- available balance;
- available balance explanation;
- goal progress;
- reserve progress;
- future payment progress.

Dashboard and other screens must consume this engine instead of implementing their own calculations.
