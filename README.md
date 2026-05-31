# Finanzas Personales PWA

Aplicacion privada de finanzas personales, mobile-first e instalable como PWA desde Safari. La app usara Google OAuth y Google Sheets API para leer y escribir en una copia de una plantilla base de Google Sheets propiedad del usuario.

## Estado Actual

En Fase -1 completada. Preparada para iniciar Fase 0.

## Stack Principal

- Next.js 16 (App Router)
- React
- TypeScript estricto
- TailwindCSS 4
- shadcn/ui
- Recharts
- Zustand
- React Hook Form + Zod
- TanStack Query
- Google OAuth
- Google Sheets API
- PWA instalable desde Safari
- Git

## Arquitectura Oficial

```
PWA App
-> Google OAuth
-> Google Sheets API
-> User Google Sheet
```

Apps Script no forma parte de la arquitectura oficial. Toda la logica de negocio vive en la app.

## Reglas De Desarrollo

- La Google Sheet es la fuente de verdad de los datos.
- La app no depende del dashboard visual ni de posiciones de celdas en la Sheet.
- Las tablas se leen por nombre de hoja y encabezados estables.
- Toda escritura se valida con Zod antes de enviarse a Google Sheets.
- Los calculos financieros viven en funciones puras en `src/lib/finance`.
- La conexion con Google vive en `src/lib/google`.
- Los adaptadores de filas de Sheet viven en `src/lib/sheets`.
- No se anade IA antes de v1.0.0 estable.
- No se anade backend antes de que una necesidad real lo exija.
- Commits pequenos y especificos. Sin mezclar diseno y logica.

## Verificacion De Calidad

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## Primeros Pasos

```bash
npm install
npm run dev
```

## Commits Y Ramas

- Cada commit representa una mejora pequena y demostrable.
- Usar ramas para caracteristicas importantes.
- No hacer commit de codigo que no pase las verificaciones de calidad.
- No avanzar de fase si la anterior no esta validada.

## Documentacion

- `docs/architecture.md` - Arquitectura y capas.
- `docs/decisions.md` - Decisiones tecnicas documentadas.
- `docs/development-phases.md` - Fases de desarrollo con entregables.
- `docs/sheet-contract.md` - Contrato de datos con la Google Sheet.
- `docs/template-review.md` - Revision de la plantilla Excel base.
- `docs/main-technology-stack.md` - Stack principal detallado.

## Changelog

Ver `CHANGELOG.md` para el historial de cambios.
