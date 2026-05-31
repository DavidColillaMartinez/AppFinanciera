# Arquitectura

## Flujo Oficial

```text
PWA App
-> Google OAuth
-> Google Sheets API
-> User Google Sheet
```

## Decisiones

- No se usara Apps Script como parte de la logica oficial.
- No se usara backend propio en v1.0.0 salvo que Google OAuth lo haga estrictamente necesario.
- No se usara base de datos propia en v1.0.0.
- Google Sheets actuara como almacenamiento estructurado, no como interfaz principal.
- La app contendra la logica de negocio, validaciones, calculos y presentacion.

## Capas

- `src/app`: rutas y layout de Next.js.
- `src/components`: componentes reutilizables.
- `src/components/ui`: componentes shadcn/ui.
- `src/features`: modulos de producto por dominio.
- `src/lib/google`: OAuth y conexion con APIs de Google.
- `src/lib/sheets`: lectura, escritura y adaptadores de Google Sheets.
- `src/lib/finance`: calculos financieros puros y testeables.
- `src/schemas`: validaciones Zod.
- `src/types`: tipos globales.
- `src/stores`: estado local con Zustand.
- `src/hooks`: hooks reutilizables.
- `src/constants`: nombres de hojas, versiones, rutas y valores estables.

## Seguridad

- No guardar tokens sensibles de forma insegura.
- No exponer claves privadas.
- Usar OAuth de usuario y scopes minimos necesarios.
- Futuras funciones de IA deberan ir por backend seguro, nunca con claves privadas en frontend.
