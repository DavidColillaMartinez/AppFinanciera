# Contrato De Google Sheet

## Estado

Este documento define el contrato oficial entre la app y la Google Sheet del usuario para v1.0.0.
Cada cambio rompedor de estructura debe actualizar `templateVersion` y documentarse como migracion.

## Hojas Oficiales

Las siguientes hojas son las unicas que la app debe leer y escribir directamente.
Cualquier otra hoja se considera visual, legacy o no soportada.

| Hoja              | Tipo                    | Descripcion                                  |
| ----------------- | ----------------------- | -------------------------------------------- |
| `Config`          | Configuracion           | Parametros globales de la app                |
| `Movimientos`     | Transacciones           | Registro de movimientos financieros          |
| `Categorias`      | Categorias              | Categorias de gasto e ingreso                |
| `Cuentas`         | Cuentas                 | Cuentas bancarias y efectivo                 |
| `Gastos_fijos`    | Gastos fijos            | Gastos recurrentes mensuales                 |
| `Pagos_futuros`   | Pagos futuros           | Compromisos financieros futuros              |
| `Objetivos`       | Objetivos               | Metas de ahorro con fecha objetivo           |
| `Reservas`        | Reservas                | Fondos separados para propositos especificos |
| `Mov_reservas`    | Movimientos de reservas | Entradas y salidas de cada reserva           |
| `Pagos_aplazados` | Pagos aplazados         | Compras a plazos                             |

## Hojas Ignoradas

Estas hojas existen en la plantilla original pero no son parte de la logica oficial de la app.
La app no debe depender de ellas ni intentar leerlas o escribirlas.

| Hoja         | Razon                                           |
| ------------ | ----------------------------------------------- |
| `00_LEEME`   | Instrucciones legacy                            |
| `Dashboard`  | Panel visual de resumen, no tabla de datos      |
| `Vista_mes`  | Vista rapida de entrada, no tabla de datos      |
| `AppsScript` | Codigo legacy, fuera de la arquitectura oficial |

## Hoja: Config

**Proposito:** Almacenar parametros globales de la app y la plantilla.

**Encabezados oficiales:**

| Columna (Español) | Tipo   | Descripcion                     |
| ----------------- | ------ | ------------------------------- |
| Clave             | string | Identificador unico de la clave |
| Valor             | string | Valor de la clave               |
| Descripcion       | string | Descripcion opcional            |

**Claves requeridas:**

| Clave           | Tipo   | Descripcion                                      |
| --------------- | ------ | ------------------------------------------------ |
| templateVersion | string | Version del contrato de hoja. Formato: X.Y.Z     |
| appMinVersion   | string | Version minima de app compatible. Formato: X.Y.Z |
| currency        | string | Codigo de moneda ISO 4217 (ej: EUR)              |
| year            | number | Ano activo para dashboard y calendario           |
| month           | number | Mes activo numerico (1-12)                       |
| firstDayOfWeek  | number | Primer dia de la semana (0=domingo, 1=lunes)     |
| locale          | string | Locale para formatos (ej: es-ES)                 |

**Regla:** Si una clave requerida falta, la app debe mostrar error de incompatibilidad.

## Hoja: Movimientos

**Proposito:** Registrar todos los movimientos financieros del usuario.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                                              |
| ----------------- | -------- | -------------------------------------------------------- |
| id                | string   | Identificador unico. Formato: UUID o prefijo + timestamp |
| fecha             | date     | Fecha del movimiento (yyyy-mm-dd)                        |
| mesClave          | string   | Clave del mes en formato YYYY-MM                         |
| concepto          | string   | Descripcion breve del movimiento                         |
| tipo              | enum     | Ingreso / Gasto / Ahorro / Transferencia interna         |
| categoria         | string   | Nombre de la categoria (no ID, para simplicidad)         |
| importe           | number   | Importe absoluto positivo                                |
| metodo            | string   | Metodo de pago (opcional)                                |
| cuentaOrigen      | string   | Cuenta desde la que sale el dinero                       |
| cuentaDestino     | string   | Cuenta hacia la que entra el dinero                      |
| notas             | string   | Notas adicionales (opcional)                             |
| reservaId         | string   | ID de reserva vinculada si aplica (opcional)             |
| createdAt         | datetime | Marca de tiempo de creacion                              |
| updatedAt         | datetime | Marca de tiempo de ultima modificacion                   |

**Reglas:**

- `importe` siempre positivo. El tipo determina signo logico.
- `mesClave` se genera automaticamente desde `fecha`.
- `id` se genera automaticamente si esta vacio.
- `deletedAt` se usa para soft delete pero la columna NO existe en la hoja original.
  La app lo implementara via filtro en queries: se consideran activos los registros con `deletedAt` vacio.

## Hoja: Categorias

**Proposito:** Definir categorias de gasto e ingreso con presupuestos opcionales.

**Encabezados oficiales:**

| Columna (Español)  | Tipo     | Descripcion                            |
| ------------------ | -------- | -------------------------------------- |
| categoriaId        | string   | ID unico de categoria                  |
| nombre             | string   | Nombre visible de la categoria         |
| presupuestoMensual | number   | Limite mensual en la moneda de Config  |
| tipoHabitual       | enum     | Ingreso / Gasto                        |
| activo             | string   | S / N                                  |
| grupo              | string   | Grupo al que pertenece (opcional)      |
| color              | string   | Color hex para representacion visual   |
| icono              | string   | Nombre del icono (opcional)            |
| orden              | number   | Orden de prioridad para mostrar        |
| notas              | string   | Notas adicionales (opcional)           |
| createdAt          | datetime | Marca de tiempo de creacion            |
| updatedAt          | datetime | Marca de tiempo de ultima modificacion |

**Reglas:**

- `categoriaId` debe ser estable y no cambiar entre ediciones.
- `presupuestoMensual` puede ser 0 si no hay limite.
- `activo = N` significa desactivada pero preserve historial.

## Hoja: Cuentas

**Proposito:** Registrar todas las cuentas del usuario.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                                      |
| ----------------- | -------- | ------------------------------------------------ |
| cuentaId          | string   | ID unico de cuenta                               |
| nombre            | string   | Nombre visible de la cuenta                      |
| tipo              | enum     | Banco / Efectivo / Virtual / Otro                |
| moneda            | string   | Codigo de moneda ISO (ej: EUR)                   |
| saldoInicial      | number   | Saldo inicial al crear la cuenta                 |
| saldoActualManual | number   | Saldo actual (la app lo calcula via Movimientos) |
| incluirDashboard  | string   | S / N                                            |
| activo            | string   | S / N                                            |
| color             | string   | Color hex para representacion visual             |
| notas             | string   | Notas adicionales (opcional)                     |
| createdAt         | datetime | Marca de tiempo de creacion                      |
| updatedAt         | datetime | Marca de tiempo de ultima modificacion           |

**Reglas:**

- `saldoActualManual` es un campo de referencia visual. La app recalcula el saldo real sumando movimientos.
- `incluirDashboard` indica si la cuenta aparece en resumenes rapidos.

## Hoja: Gastos_fijos

**Proposito:** Registrar gastos recurrentes con frecuencia definida.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                                  |
| ----------------- | -------- | -------------------------------------------- |
| fijoId            | string   | ID unico de gasto fijo                       |
| concepto          | string   | Descripcion del gasto                        |
| categoria         | string   | Nombre de categoria asociada                 |
| importe           | number   | Importe del pago                             |
| frecuencia        | enum     | Mensual / Anual / Trimestral / Personalizado |
| diaCargo          | number   | Dia del mes en que se ejecuta (1-31)         |
| cuentaOrigen      | string   | Cuenta desde la que se cobra                 |
| activo            | string   | S / N                                        |
| fechaInicio       | date     | Fecha de primera aplicacion (opcional)       |
| fechaFin          | date     | Fecha de最后一次 aplicacion (opcional)       |
| notas             | string   | Notas adicionales (opcional)                 |
| createdAt         | datetime | Marca de tiempo de creacion                  |
| updatedAt         | datetime | Marca de tiempo de ultima modificacion       |

## Hoja: Pagos_futuros

**Proposito:** Registrar compromisos financieros futuros grandes o anuales.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                            |
| ----------------- | -------- | -------------------------------------- |
| pagoId            | string   | ID unico                               |
| concepto          | string   | Descripcion del pago                   |
| categoria         | string   | Categoria asociada                     |
| importeObjetivo   | number   | Importe total a ahorrar                |
| fechaVencimiento  | date     | Fecha esperada del pago                |
| frecuencia        | enum     | Unico / Anual / Mensual                |
| cuentaReserva     | string   | Cuenta donde se reserva el dinero      |
| activo            | string   | S / N                                  |
| saldoReservado    | number   | Cantidad actualmente reservada         |
| mesesRestantes    | number   | Meses hasta vencimiento (calculado)    |
| aporteMensual     | number   | Aporte mensual sugerido (calculado)    |
| notas             | string   | Notas adicionales (opcional)           |
| createdAt         | datetime | Marca de tiempo de creacion            |
| updatedAt         | datetime | Marca de tiempo de ultima modificacion |

**Reglas:**

- Las columnas calculadas existen en la hoja original. La app NO debe escribir en ellas.
- `mesesRestantes` y `aporteMensual` se calculan en la app, no en la hoja.

## Hoja: Objetivos

**Proposito:** Registrar metas de ahorro a mediano y largo plazo.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                                                   |
| ----------------- | -------- | ------------------------------------------------------------- |
| objetivoId        | string   | ID unico                                                      |
| nombre            | string   | Nombre del objetivo                                           |
| tipo              | enum     | Seguridad / Vacaciones / Emergencia / Vehiculo / Hogar / Otro |
| cuentaAhorro      | string   | Cuenta donde se deposita                                      |
| importeObjetivo   | number   | Importe objetivo                                              |
| fechaObjetivo     | date     | Fecha objetivo                                                |
| prioridad         | enum     | Alta / Media / Baja                                           |
| saldoActual       | number   | Importe acumulado actualmente                                 |
| mesesRestantes    | number   | Meses restantes (calculado)                                   |
| aporteMensual     | number   | Aporte mensual sugerido (calculado)                           |
| estado            | string   | Activo / Completado / Pausado / Cancelado                     |
| notas             | string   | Notas adicionales (opcional)                                  |
| createdAt         | datetime | Marca de tiempo de creacion                                   |
| updatedAt         | datetime | Marca de tiempo de ultima modificacion                        |

**Reglas:**

- `saldoActual` se recalcula en la app desde Movimientos vinculados.
- `mesesRestantes` y `aporteMensual` se calculan en la app, no en la hoja.

## Hoja: Reservas

**Proposito:** Registrar fondos separados para propositos especificos.

**Encabezados oficiales:**

| Columna (Español)     | Tipo     | Descripcion                                              |
| --------------------- | -------- | -------------------------------------------------------- |
| reservaId             | string   | ID unico                                                 |
| nombre                | string   | Nombre de la reserva                                     |
| tipo                  | enum     | Imprevistos / Emergencia / Pago futuro / Objetivo / Otro |
| importeObjetivo       | number   | Importe objetivo (0 si no hay limite)                    |
| saldoActual           | number   | Saldo actual de la reserva                               |
| aporteMensualSugerido | number   | Aporte mensual sugerido                                  |
| cuentaFisica          | string   | Cuenta donde esta el dinero real                         |
| activo                | string   | S / N                                                    |
| prioridad             | enum     | Alta / Media / Baja                                      |
| notas                 | string   | Notas adicionales (opcional)                             |
| createdAt             | datetime | Marca de tiempo de creacion                              |
| updatedAt             | datetime | Marca de tiempo de ultima modificacion                   |

**Reglas:**

- `saldoActual` se recalcula desde `Mov_reservas`, no se escribe directamente.

## Hoja: Mov_reservas

**Proposito:** Registrar movimientos de entrada y salida de cada reserva.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                  |
| ----------------- | -------- | ---------------------------- |
| id                | string   | ID unico del movimiento      |
| fecha             | date     | Fecha del movimiento         |
| reservaId         | string   | ID de la reserva             |
| tipoMovimiento    | enum     | Aportacion / Disposicion     |
| importe           | number   | Importe del movimiento       |
| cuentaOrigen      | string   | Cuenta de origen             |
| cuentaDestino     | string   | Cuenta de destino            |
| notas             | string   | Notas adicionales (opcional) |
| createdAt         | datetime | Marca de tiempo de creacion  |

**Reglas:**

- `importe` siempre positivo.
- `tipoMovimiento` determina si suma o resta del saldo de la reserva.

## Hoja: Pagos_aplazados

**Proposito:** Registrar compras a plazos o financiaciones.

**Encabezados oficiales:**

| Columna (Español) | Tipo     | Descripcion                               |
| ----------------- | -------- | ----------------------------------------- |
| aplazadoId        | string   | ID unico                                  |
| concepto          | string   | Descripcion del pago                      |
| importeTotal      | number   | Importe total financiando                 |
| importePagado     | number   | Importe ya pagado                         |
| fechaInicio       | date     | Fecha de inicio                           |
| fechaFin          | date     | Fecha de fin                              |
| cuotaMensual      | number   | Importe de cada cuota                     |
| categoria         | string   | Categoria asociada                        |
| cuentaOrigen      | string   | Cuenta de cobro                           |
| estado            | string   | Activo / Completado / Pausado / Cancelado |
| notas             | string   | Notas adicionales (opcional)              |
| createdAt         | datetime | Marca de tiempo de creacion               |
| updatedAt         | datetime | Marca de tiempo de ultima modificacion    |

## Enums Oficiales

### Tipo de movimiento

```
Ingreso
Gasto
Ahorro
Transferencia interna
```

### Tipo de categoria

```
Ingreso
Gasto
```

### Tipo de cuenta

```
Banco
Efectivo
Virtual
Otro
```

### Frecuencia

```
Mensual
Anual
Trimestral
Unico
```

### Estado generic

```
Activo
Pausado
Completado
Cancelado
```

### Prioridad

```
Alta
Media
Baja
```

## Reglas De Lectura Y Escritura

1. **Lectura por nombre de hoja y encabezados:** No usar posiciones fijas de celdas.
2. **Primera fila = encabezados:** Siempre se asume que la fila 1 contiene los encabezados.
3. **Primera fila de datos = 2:** Siempre se salta la fila 1 de encabezados.
4. **No escribir en columnas calculadas:** Las columnas que son resultado de formulas en la hoja original NO deben escribirse desde la app.
5. **Validacion con Zod antes de escribir:** Toda escritura pasa por validacion Zod.
6. **Soft delete:** Se implementa filtrando `deletedAt` vacio en lecturas y escribiendo marca de tiempo en borrados.

## Versionado De Plantilla

- `templateVersion` se almacena en Config.
- Formato: `X.Y.Z` donde X=major (rompedor), Y=minor (nueva feature), Z=patch (fix).
- Cuando la app detecta que la hoja tiene version menor que `appMinVersion`, debe mostrar error y no permitir uso.

## Migraciones

Cuando `templateVersion` cambia de forma rompedora, se debe documentar en `docs/migrations/` con:

1. Version origen y version destino.
2. Cambios realizados.
3. Accion requerida por el usuario si aplica.

## Hojas Con Formulas En La Plantilla Original

Estas hojas contienen formulas en la plantilla original que la app NO debe crear ni mantener:

- `Pagos_futuros`: `mesesRestantes`, `aporteMensual`
- `Objetivos`: `mesesRestantes`, `aporteMensual`

Estas formulas deben eliminarse de la plantilla oficial para evitar confusion.
La app calculara estos valores internamente.

## Checklist De Compatibilidad

Para que la app acepte una Sheet conectada, debe verificar:

- [ ] Hojas requeridas existen (todas las de la lista oficial).
- [ ] Encabezados de cada hoja coinciden con los definidos aqui.
- [ ] `Config.templateVersion` existe y es compatible.
- [ ] `Config.appMinVersion` existe y la version de la app es >=.
- [ ] `Config.currency` existe.
- [ ] Permisos de lectura y escritura son correctos.
