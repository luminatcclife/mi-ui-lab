# mi-ui-lab

Biblioteca personal e independiente de componentes de interfaz — un Laboratorio Vivo para exhibir, probar y documentar piezas de UI en React y Tailwind CSS. Cada pieza incluye variantes interactivas, tabla de props, tokens de diseño y código listo para copiar.

## Stack

- React 19 + TypeScript
- Vite + Tailwind CSS 4
- Dexie (IndexedDB) para persistencia local de piezas propias, favoritos y etiquetas
- DOMPurify + iframe aislado (Tailwind Play CDN) para mostrar en vivo el HTML de piezas capturadas

## Ejecutar en local

**Requisitos:** Node.js

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Compilar para producción:
   ```bash
   npm run build
   ```

## Estructura

- `src/components/ui/` — las piezas base de la biblioteca.
- `src/data/initialComponents.ts` — catálogo con variantes, props y snippets de cada pieza.
- `src/db/db.ts` — persistencia local (IndexedDB vía Dexie) de piezas propias, favoritos y tags.
- `src/utils/` — utilidades de captura/estandarización de componentes, búsqueda, diffs, generación de paletas, saneado de HTML y validación de imports.
- `src/components/ui/SandboxedHtmlPreview.tsx` — renderiza el HTML de las piezas capturadas dentro de un iframe aislado.

## Limitaciones conocidas

- Las piezas **creadas a mano** (Laboratorio → "a mano") guardan su código TSX como referencia y se muestran como una tarjeta con el snippet: **no se compilan ni se renderizan en vivo**. Solo las piezas **capturadas** (HTML) se ven en vivo. Es una decisión consciente: el compilador en vivo (Sucrase) existió brevemente y se retiró.
- La vista previa de piezas capturadas carga el Tailwind Play CDN, así que sin conexión se muestran sin estilos.
