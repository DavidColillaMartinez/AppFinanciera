# Contrato De Google Sheet

## Plantilla Revisada

Archivo base: `plantilla_base_finanzas_app.xlsx`.

## Hojas Detectadas

- `00_LEEME`
- `Config`
- `Dashboard`
- `Vista_mes`
- `Movimientos`
- `Categorias`
- `Cuentas`
- `Gastos_fijos`
- `Pagos_futuros`
- `Objetivos`
- `Reservas`
- `Mov_reservas`
- `Pagos_aplazados`
- `AppsScript`

## Mapeo Inicial

- `Config` -> Config
- `Movimientos` -> Transactions
- `Categorias` -> Categories
- `Cuentas` -> Accounts
- `Gastos_fijos` -> FixedExpenses
- `Pagos_futuros` -> FuturePayments
- `Objetivos` -> Goals
- `Reservas` -> Reserves
- `Mov_reservas` -> ReserveMovements
- `Pagos_aplazados` -> InstallmentPayments

## Riesgos Detectados

- La hoja `AppsScript` contradice la arquitectura oficial si se presenta como parte del sistema.
- `00_LEEME` recomienda copiar Apps Script. Debe corregirse para la plantilla oficial.
- Algunas tablas base contienen formulas. Para la app, los calculos deben vivir en codigo.
- `Config` necesita claves adicionales para versionado y compatibilidad.
- Faltan algunas columnas deseadas, como `deletedAt` en movimientos.

## Regla De Compatibilidad

La app debe validar:

- Existencia de hojas requeridas.
- Existencia de encabezados requeridos.
- `templateVersion` compatible.
- Version minima de app compatible si existe `appMinVersion`.

## Regla De Lectura y Escritura

- Leer por nombre de hoja y encabezados.
- No depender de posiciones visuales del dashboard.
- No escribir desde componentes directamente.
- Validar cada modelo antes de escribir.
