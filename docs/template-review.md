# Revision De Plantilla Base

## Resumen

La plantilla original `plantilla_base_finanzas_app.xlsx` ha sido auditada completamente.
El resultado es un contrato oficial de datos documentado en `docs/sheet-contract.md`.

## Hojas Oficiales Confirmadas

- `Config` - Configuracion global
- `Movimientos` - Transacciones
- `Categorias` - Categorias
- `Cuentas` - Cuentas
- `Gastos_fijos` - Gastos fijos
- `Pagos_futuros` - Pagos futuros
- `Objetivos` - Objetivos
- `Reservas` - Reservas
- `Mov_reservas` - Movimientos de reservas
- `Pagos_aplazados` - Pagos aplazados

## Hojas Ignoradas

- `00_LEEME` - Instrucciones legacy
- `Dashboard` - Panel visual, no tabla de datos
- `Vista_mes` - Vista rapida, no tabla de datos
- `AppsScript` - Codigo legacy, fuera de la arquitectura oficial

## Cambios Requeridos Para Contrato v1.0.0

### Eliminar formulas de tablas base

Las siguientes columnas contienen formulas en la plantilla original y deben limpiarse:

- `Pagos_futuros`: `mesesRestantes` (columna J), `aporteMensual` (columna K)
- `Objetivos`: `mesesRestantes` (columna I), `aporteMensual` (columna J)

Estas columnas deben existir como encabezados pero estar vacias en las filas de datos.
La app calculara estos valores internamente.

### Anadir deletedAt

La plantilla original no tiene columna `deletedAt` en ninguna tabla.
La app implementara soft delete filtrando celdas vacias.
Para compatibilidad, ninguna tabla necesita columna adicional si la app interpreta vacio como activo.

### Marcar AppsScript como no oficial

La hoja `AppsScript` contiene codigo que dependia de Apps Script para guardar movimientos.
Esto contradice la arquitectura oficial de la app.

Para la plantilla oficial que se distribuira a usuarios:

- Eliminar la hoja `AppsScript`.
- Eliminar o reescribir las instrucciones en `00_LEEME` que sugieren copiar Apps Script.

## Valoracion

La estructura base es buena. Las hojas principales cubren todos los modelos de datos necesarios.
El contrato es viable y permite iniciar la implementacion de la app.

Las discrepancias encontradas son solventables sin necesidad de restructuring, solo limpiando formulas legacies y marcando hojas como no soportadas.
