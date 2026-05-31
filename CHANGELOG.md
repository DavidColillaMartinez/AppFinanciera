# Changelog

Todos los cambios significativos de cada version se documentan aqui.

## 1.0.0

Version inicial completa del PWA de finanzas personales.

### Añadido

- **Autenticacion**: Google OAuth flow con configuracion de scopes para Sheets API.
- **Dashboard** (`/`): Vista general con balance mensual, ingresos/gastos, grafica de gastos por categoria y detalle de presupuestos.
- **Transacciones** (`/transactions`): Lista de movimientos con filtros por mes, formulario de creacion, badges por tipo (Ingreso/Gasto/Ahorro/Transferencia).
- **Cuentas** (`/accounts`): Listado de cuentas con saldo y color.
- **Reservas y Objetivos** (`/goals`): Pestanas para reservas de emergencia y objetivos de ahorro con progreso visual.
- **Categorias** (`/settings > Categorias`): Gestion de categorias con nombre, tipo, presupuesto mensual, color y grupo.
- **Preferencias** (`/settings > Preferencias`): Configuracion de moneda principal y cuenta predeterminada.
- **Onboarding** (`/onboarding`): Flujo de conexion con Google Sheets y validacion de estructura.
- **Auth Callback** (`/auth/callback`): Manejo de callback de Google OAuth.

### Arquitectura

- Patron feature-based con hooks de React Query para cada dominio.
- Capa de datos Google Sheets: `client.ts`, `reader.ts`, `writer.ts`.
- Zod schemas para validacion de datos con variantes `SheetSchema` para escritura.
- Stores Zustand para estado global de la app.
- PWA instalable desde Safari con manifest y service worker.
- Design system shadcn/ui con ThemeProvider para modo claro/oscuro.

### Fases completadas

- Fase 0: Contrato de datos con plantilla Excel auditada.
- Fase 1: Tipos TypeScript, enums y Zod schemas.
- Fase 2: Base PWA, componentes UI, BottomNav, layout.
- Fase 3: Google OAuth flow.
- Fase 4: Capa de datos Google Sheets (lectura/escritura).
- Fase 5: Modulo Transacciones con React Query.
- Fase 6: Modulo Categorias con CRUD.
- Fase 7: Dashboard con Recharts.
- Fase 8: Modulo Cuentas.
- Fase 9: Modulo Reservas y Objetivos.
- Fase 10: Personalizacion (preferencias de usuario).
- Fase 11: Revision y release v1.0.0.

---

## 1.1.0

Version con rediseño visual y nuevos módulos de planificación financiera.

### Añadido

- **Rediseño visual**: Paleta de colores especifica para finanzas (verde ingresos, rojo gastos, azul ahorro), Google Fonts Sora y Figtree, animaciones fade-in, microinteracciones en botones y tarjetas.
- **Dashboard mejorado**: Indicador de salud financiera con badge de estado, MetricCards con iconos y fondo con gradiente por tipo, mejor jerarquia visual y animaciones escalonadas.
- **BottomNav mejorada**: Indicador de activo con fondo highlight, iconos con strokeWidth dinamico, transiciones suaves.
- **Gastos Fijos** (`/fixed-expenses`): CRUD completo para gastos recurrentes con total mensual estimado, frecuencia, dia de cargo y cuenta origen.
- **Pagos Futuros** (`/future-payments`): CRUD completo para objetivos de ahorro con importe objetivo, saldo reservado, meses restantes y aporte mensual.
- **Pagos Aplazados** (`/deferred-payments`): CRUD completo para compras a plazos con importe total, importe pagado, cuota mensual y estado.

### Corregido

- Todos los fixes de la v1.0.2 incluidos.

---

## 1.1.1

Version con modulo de movimientos de reservas y validacion reforzada de Sheet.

### Añadido

- **Movimientos de Reserva**: CRUD para registrar aportaciones y disposiciones de cada reserva. Boton "Mov." en cada tarjeta de reserva que abre un panel con el historial, totales de entrada/salida, y formulario para agregar movimientos.
- **Validacion reforzada en onboarding**: Ahora comprueba las columnas exactas requeridas en cada hoja, no solo que exista. Muestra mensajes especificos para columnas faltantes, hojas faltantes y errores de permisos.

### Corregido

- Todos los fixes de v1.1.0 y v1.0.2 incluidos.

---

## 1.0.2

Version de correcciones criticas para hacer la app funcional en Vercel.

### Corregido

- **OAuth Google en Vercel**: `/auth/google` era Server Component y usaba `window` para `redirect_uri`, dejando el parametro vacio. Ahora es Client Component con manejo de errores y construida en cliente.
- **Escritura en Sheets**: `valueInputOption` e `insertDataOption` estaban en el body en lugar de query params. `batchUpdateSheet` enviaba array 3D incorrecto. Corregido.
- **Indice de fila en updates**: `findRowIndexByColumnValue` devolvia `i+2` cuando debia ser `i+1`, desplazando todas las operaciones una fila.
- **Columnas borradas en updates**: `updateRowByColumn` ponia `""` en todas las columnas no actualizadas, borrando IDs, fechas y flags. Ahora lee la fila existente primero y mezcla los cambios.
- **Schema de transacciones**: `transactionUpdateSchema` exigia `mesClave` y `updatedAt` que el formulario de edicion no provee. Corregido.
- **Auth gate**: Si no hay conexion a Sheet, ahora redirige a `/onboarding` en lugar de mostrar dashboard vacio.

### Seguridad

- `.OpencodeKey.txt` y patrones de secretos (`*.key`, `*.token`, `*.secret`, `credentials.json`, etc.) añadidos a `.gitignore`.

---

## 1.0.1

Release interno con dashboard customization y CRUD de reservas/objetivos.

---

## 0.0.0

Base tecnica inicial del proyecto.

### Añadido

- Next.js 16 con App Router y TypeScript estricto.
- TailwindCSS 4 configurado.
- shadcn/ui preparado con `components.json`.
- Dependencias principales declaradas: Zustand, React Hook Form, Zod, TanStack Query, Recharts, Google OAuth.
- PWA base con manifest y iconos SVG.
- Estructura de carpetas por dominio y capas.
- Documentacion inicial: arquitectura, decisiones tecnicas, fases de desarrollo, contrato de Sheet, revision de plantilla.
- ESLint y Prettier configurados.
- Git inicializado.

### Corregido

- PostCSS override para evitar vulnerabilidad en versiones antiguas.
- TailwindCSS 4 con `@tailwindcss/postcss` en lugar de plugin directo.
- `darkMode` en Tailwind como string en lugar de array.
- `purpose` de manifest como `maskable` en lugar de `any maskable`.
- Ignores de ESLint y Prettier para `.agents`, `skills-lock.json` y `tsconfig.tsbuildinfo`.

### Configurado

- `npm run format` - formatea todo con Prettier.
- `npm run lint` - valida con ESLint.
- `npm run typecheck` - valida con TypeScript.
- `npm run build` - construye para produccion.
- `npm audit --audit-level=moderate` - auditoria de seguridad.
