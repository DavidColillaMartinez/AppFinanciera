# Fases De Desarrollo

## Fase -1

Estabilizacion del repositorio inicial. Sin esta fase no se avanza.

- Confirmar que Git funciona y el repo esta inicializado.
- Limpiar ignores de tooling para `.agents`, `skills-lock.json`, `tsconfig.tsbuildinfo`.
- Verificar que `format`, `lint`, `typecheck` y `build` pasan sin errores.
- Hacer commit inicial con la base tecnica.
- Documentar las decisiones tecnicas iniciales.

Entregable: commit inicial limpio con base funcional.

## Fase 0

Definir plantilla base y contrato de datos.

- Auditar la plantilla Excel original.
- Decidir idioma de encabezados oficiales (espanol o ingles).
- Crear tabla de equivalencias Sheet -> App model completa.
- Definir tipos de datos por columna.
- Documentar valores permitidos: tipos de transaccion, estados, frecuencias, tipos de cuenta.
- Definir columnas calculadas prohibidas en tablas base.
- Definir columnas de visualizacion legacy ignoradas por la app.
- Crear politica de migraciones de plantilla.
- Actualizar `templateVersion` y anadir `appMinVersion`.
- Anadir `deletedAt` donde aplique y definir soft delete oficialmente.
- Definir formato de IDs: UUID o slugs estables.
- Eliminar o aislar `AppsScript` como no oficial.
- Verificar que las hojas `Dashboard` y `Vista_mes` no son dependencia funcional.
- Limpiar formulas de tablas base en la plantilla o documentarlas como legacy visual.

Entregable: `docs/sheet-contract.md` actualizado con contrato v1.0.0.

## Fase 1

Inicializar proyecto tecnico.

- Crear proyecto Next.js con TypeScript.
- Instalar TailwindCSS, shadcn/ui, React Hook Form, Zod, Zustand, TanStack Query, Recharts.
- Configurar ESLint y Prettier.
- Crear estructura de carpetas por dominio y capas.
- Configurar Git con commits pequenos.
- Crear README inicial y documentacion de arquitectura.

Entregable: Proyecto inicializado, estructura limpia, documentado.

## Fase 2

Configurar PWA y diseno mobile-first.

- Configurar manifest, iconos, nombre, color base, comportamiento standalone.
- Crear navegacion inferior para movil.
- Crear layout responsive con cards.
- Definir tokens de color para estados financieros: good, warning, danger, neutral.
- Crear estados base: loading, empty, error, offline.
- Preparar componente ThemeProvider para modo claro/oscuro.
- Instalar shadcn/ui base: Button, Input, Select, Dialog, Tabs, Badge, Progress, Card.
- Configurar fuente y densidad visual coherente.
- Asegurar accesibilidad: contraste, labels, keyboard navigation.

Entregable: PWA instalable con diseno mobile limpio.

## Fase 3

Google OAuth y conexion con Sheet.

- Configurar Google OAuth con Google Identity Services.
- Crear pantalla de conexion.
- Permitir pegar URL o ID de Sheet.
- Almacenar referencia de Sheet conectada.
- Validar permisos de lectura y escritura.
- Leer Config y validar `templateVersion` y `appMinVersion`.
- Validar existencia de hojas requeridas.
- Validar existencia de encabezados requeridos.
- Mostrar errores claros cuando la Sheet no es compatible.

Entregable: Usuario puede conectar su Sheet con validacion de compatibilidad.

## Fase 4

Capa de datos de Google Sheets.

- Crear cliente de Google Sheets API con `fetch` directo.
- Definir constantes de nombres de hojas y rangos.
- Crear funciones `batchGet` por tabla.
- Crear funciones `appendRow`, `updateRow`, `softDelete`.
- Crear adaptadores row -> model y model -> row.
- Crear hooks de lectura con TanStack Query: carga, cache, refresco, invalidacion.
- Implementar cache manual y refresco forzado.
- Manejar errores: permisos, cuota, hojas faltantes, versiones incompatibles.
- Toda escritura pasa por validacion Zod antes de enviarse a Sheets.

Entregable: Capa de datos funcional y validada.

## Fase 5

Transacciones.

- Lista de transacciones con filtros: mes, tipo, categoria, cuenta, busqueda.
- Formulario rapido de alta.
- Formulario de edicion.
- Soft delete con `deletedAt`.
- Tipos validados: Ingreso, Gasto, Ahorro, Transferencia interna.
- Validacion de cuentas origen y destino.
- Importes siempre positivos.
- `monthKey` generado automaticamente desde fecha.
- ID generado automaticamente.
- Navegacion rapida desde dashboard.

Entregable: Gestion completa de transacciones mensuales.

## Fase 6

Categorias y presupuestos.

- Lista de categorias con CRUD.
- Crear y editar categoria: nombre, presupuesto mensual, color, icono, tipo, activa/inactiva.
- Calcular gasto mensual por categoria.
- Calcular porcentaje de presupuesto usado.
- Mostrar categorias que han excedido el presupuesto.
- Evitar nombres duplicados.
- Preservar categorias historicas aunque esten desactivadas.
- Orden personalizable.

Entregable: Sistema completo de categorias y presupuestos.

## Fase 7

Dashboard.

- Ingresos mensuales.
- Gastos mensuales.
- Balance mensual.
- Ahorros y contribuciones a reservas.
- Monto disponible estimado.
- Grafico de gasto por categoria.
- Ingresos vs gastos.
- Categorias principales.
- Presupuestos excedidos.
- Pagos futuros proximos.
- Progreso de objetivos.
- Estado de reservas.
- Alertas financieras.
- Selector de mes activo.
- Resumen yearly basico.
- Widgets iniciales configurables.
- Estructura para dashboard personalizable.

Entregable: Dashboard visual, claro y util para controlar el mes.

## Fase 8

Cuentas, gastos fijos y pagos futuros.

- CRUD de cuentas: nombre, tipo, moneda, saldo inicial, color, activo.
- CRUD de gastos fijos: concepto, categoria, importe, frecuencia, dia de cargo, cuenta origen.
- CRUD de pagos futuros: concepto, categoria, importe objetivo, fecha vencimiento, frecuencia, cuenta reserva vinculada.
- Marcar pagos futuros como esperado, activo, pagado o pausado.
- Vincular pagos futuros a reservas.
- Calcular prevision mensual y compromisos futuros.
- Mostrar proximos vencimientos.
- Distribuir gastos yearly por mes.
- Separar provisiones de ahorros reales.

Entregable: Vista completa mensual y yearly de compromisos.

## Fase 9

Reservas y objetivos.

- CRUD de reservas: nombre, tipo, importe objetivo, saldo actual, cuenta fisica, prioridad, activa.
- CRUD de objetivos: nombre, tipo, cuenta de ahorro, importe objetivo, fecha objetivo, prioridad, saldo actual.
- Registrar aportaciones a reservas.
- Registrar disposiciones de reservas.
- Ver historial de movimientos de reservas.
- Progreso visual, importe restante, fecha estimada de cumplimiento.
- Priorizar objetivos.
- Separar mini fondo de emergencia, fondo real, imprevistos y objetivos personales.
- Mostrar recomendacion basica para la siguiente fase financiera.

Entregable: Sistema de planificacion de ahorros funcional.

## Fase 10

Personalizacion.

- Activar y desactivar widgets.
- Reordenar widgets.
- Elegir color base.
- Guardar preferencias localmente y en Sheet.
- Elegir metricas principales.
- Configurar dashboard inicial.
- Crear pantalla de ajustes visuales.

Entregable: Dashboard adaptable a la forma de ver finanzas del usuario.

## Fase 11

Revision, pruebas y release v1.0.0.

- Probar instalacion desde Safari.
- Probar conexion Google.
- Probar Sheet vacia.
- Probar Sheet con datos.
- Probar lectura y escritura.
- Probar edicion y borrado.
- Probar filtros.
- Probar calculos financieros.
- Probar cambio de mes.
- Probar errores de permisos.
- Probar Sheet incompatible.
- Probar en movil y desktop.
- Revisar respuesta en distintos tamanos de pantalla.
- Revisar rendimiento.
- Revisar textos de ayuda.
- Revisar estados vacios.
- Revisar accesibilidad basica.
- Crear documentacion de usuario.
- Crear changelog de release.
- Publicar v1.0.0.

Entregable: App v1.0.0 funcional y estable.

## Reglas De Avance

- No avanzar de fase si la anterior no esta validada.
- Cada commit representa una mejora pequena y demostrable.
- No mezclar cambios de diseno con cambios de logica en el mismo commit.
- Usar ramas para caracteristicas importantes.
- Verificar `format`, `lint`, `typecheck` y `build` en cada commit si es posible.

## Checkpoints Transversales

Estos aspectos se verifican en las fases indicadas, no como fases independientes.

### Seguridad (Fases 3, 4, 11)

- OAuth con scopes minimos.
- Refresh tokens no almacenados de forma insegura.
- Sin claves privadas en cliente.
- Datos de Sheets validados con Zod antes de usar.
- Errores de permisos manejados con mensajes claros.
- Futura IA solo mediante backend seguro.

### Accesibilidad (Fases 2, 5, 6, 7, 11)

- Navegacion con teclado funcional.
- Contraste suficiente en textos y componentes.
- Labels reales en formularios.
- Estados de error asociados a campos.
- Estados bueno/warning/danger sin dependencia exclusiva del color.
- Tamanos tactiles adecuados en movil.
- Charts con resumen textual alternativo.

### SEO (Fase 1+)

- Metadata correcta para PWA: titulo, descripcion, app name.
- `noindex,nofollow` por defecto al ser app privada.
- Si existe landing publica, separada de la app privada.

### Performance (Fases 2, 4, 11)

- Lazy loading de componentes pesados.
- Cache de queries de Sheets con TanStack Query.
- No regenerar datos en cada render.
- Bundles analizados en cada fase importante.
