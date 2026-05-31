# Changelog

Todos los cambios significativos de cada version se documentan aqui.

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

### Pendiente

- Primer commit formal (requiere confirmacion de Git operativo).
- Inicio de Fase 0: contrato de plantilla y datos.
