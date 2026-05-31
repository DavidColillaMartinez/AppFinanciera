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
