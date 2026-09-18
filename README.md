# mi-ui-lab

Biblioteca personal e independiente de componentes de interfaz — un Laboratorio Vivo para exhibir, probar y documentar piezas de UI en React y Tailwind CSS. Cada pieza incluye variantes interactivas, tabla de props, tokens de diseño y código listo para copiar.

## Stack

- React 19 + TypeScript
- Vite + Tailwind CSS 4
- Dexie (IndexedDB) para persistencia local de piezas propias, favoritos y etiquetas

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
- `src/utils/` — utilidades de captura/estandarización de componentes, búsqueda, diffs y generación de paletas.
