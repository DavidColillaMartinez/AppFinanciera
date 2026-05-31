# Decisiones Tecnicas

## 0001 - Google Sheets Como Fuente De Verdad

La app usara Google Sheets como almacenamiento principal en v1.0.0. No se anade base de datos propia hasta validar el producto.

## 0002 - Sin Apps Script Oficial

Apps Script puede existir como legado de la plantilla, pero no forma parte de la arquitectura oficial ni de la logica de negocio.

## 0003 - Sin Backend En v1.0.0 Por Defecto

La app sera frontend PWA con OAuth de usuario y Google Sheets API. Solo se anadira backend si una necesidad tecnica real lo exige.

## 0004 - Calculos En Codigo

Balances, presupuestos, progreso, alertas, previsiones y resumenes se calcularan en `src/lib/finance`, no en formulas visuales de Sheets.

## 0005 - Contrato Por Encabezados

La integracion con Sheets se basara en nombres de hoja y encabezados estables. No se acoplara a layouts visuales.

## 0006 - Sin IA En v1.0.0

Ninguna funcionalidad de IA se implementara antes de que v1.0.0 este estable y validada. IA futura requerira backend seguro para manejar API keys.

## 0007 - SEO: App Privada Con Indexacion Desactivada

Como la app es privada y personal, se usara `noindex,nofollow` por defecto. Si existiera una landing page publica, se separara de la app privada.

## 0008 - Seguridad: Tokens Y Permisos

- OAuth de usuario con scopes minimos necesarios.
- Refresh tokens no se almacenaran en frontend de forma insegura.
- No se exponen claves privadas en el cliente.
- Todos los datos leidos de Sheets se validan con Zod antes de usarlos.
- La app no confiara ciegamente en datos de la Sheet aunque sea del usuario.

## 0009 - Accesibilidad Desde Fase 2

Desde el inicio del diseno mobile-first se garantizara:

- Navegacion usable con teclado.
- Contraste suficiente en textos y estados.
- Labels reales en todos los formularios.
- Estados de error asociados a campos.
- Estados financieros buenos/warning/danger no dependeran solo del color.
- Tamanos tactiles adecuados en elementos interactivos.
- Charts con resumen textual alternativo.

## 0010 - Diseno: Mobile-First Y Cards

- Toda pantalla se disena primero para movil.
- Se usa cards como unidad principal de informacion.
- Estados base requeridos: loading, empty, error, offline.
- No parecer una hoja de calculo decorada.
- Navegacion inferior en movil.

## 0011 - Commits: Pequenos Y Especificos

Cada commit representa una mejora pequena y demostrable. No se mezclan cambios de diseno con cambios de logica en el mismo commit. Se usan ramas para caracteristicas importantes.

## 0012 - Tooling Ignorado

Archivos generados por herramientas de desarrollo y agentes de IA estan excluidos de lint, format y control de versiones:

- `.agents/**`
- `skills-lock.json`
- `tsconfig.tsbuildinfo`

## 0013 - Variables De Entorno Publicas

Solo variables publicas del entorno de Next.js llevan el prefijo `NEXT_PUBLIC_`. La clave de Google OAuth no se exponendra nunca en cliente.

## 0014 - Versionado De Plantilla

Cada cambio en el contrato de hojas y columnas de la Sheet debe:

1. Actualizar `templateVersion` en Config.
2. Documentarse en `docs/sheet-contract.md`.
3. Crear una entrada de migracion si es un cambio rompedor.
4. Verificar compatibilidad hacia atras cuando sea posible.
