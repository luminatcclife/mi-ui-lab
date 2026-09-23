# mi-ui-lab

Taller personal de componentes de interfaz en React + Tailwind CSS. Funciona **100 % en el navegador**, sin backend ni cuentas: guarda tus piezas en IndexedDB, te deja probarlas en vivo, compararlas, versionarlas y **capturar HTML de cualquier sitio** para convertirlo en una pieza propia.

## Pantallas

| Pantalla | Para qué sirve |
|---|---|
| **Inicio** | Punto de entrada con acceso a las tres zonas y contadores de la colección. |
| **Biblioteca** | Explorar, buscar (búsqueda fuzzy tolerante a erratas y acentos), filtrar por categoría y etiquetas, favoritos, ficha de detalle, comparar dos piezas (diff de código, props y tokens), registrar iteraciones, explorar tokens, generar paletas y exportar/importar la colección. |
| **Laboratorio** | Incorporar piezas nuevas: **a mano** (metadatos + código TSX de referencia) o **capturando HTML** con el Inspector (ficha técnica, clases Tailwind categorizadas, detección de dependencias como Lucide/Radix/Flowbite, TSX generado y vista previa aislada). |
| **Playground** | Interactuar con una pieza: variantes, editor de props, tono de acento, viewport y deshacer/rehacer. |

## Stack

- React 19 + TypeScript (`strict`) · Vite 6 · Tailwind CSS 4
- Dexie 4 (IndexedDB) para la persistencia local
- DOMPurify + iframe aislado (`sandbox="allow-scripts"`, Tailwind Play CDN) para mostrar en vivo el HTML capturado
- Vitest 5 + jsdom + fake-indexeddb para los tests

## Ejecutar en local

Requisito: Node.js 24 o superior (la versión que usa la CI).

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests (Vitest)
npm run lint       # comprobación de tipos (tsc --noEmit)
npm run build      # build de producción en dist/
```

La CI (GitHub Actions) ejecuta `lint`, `test` y `build` en cada push y PR a `master`.

## Estructura

```
src/
  App.tsx                  Navegación entre pantallas, modales y toasts
  hooks/useCatalog.ts      Estado del catálogo (piezas + favoritos); IndexedDB es la única fuente de verdad
  db/db.ts                 Esquema Dexie (v3), migración única desde localStorage y funciones de lectura/escritura
  components/
    *Screen.tsx            Las cuatro pantallas (Biblioteca, Laboratorio y Playground se cargan bajo demanda)
    *Modal.tsx, TokensPanel.tsx, ComparisonView.tsx, ...
    ErrorBoundary.tsx      Aislamiento de fallos de render por pieza, por pantalla y global
    InteractiveComponentRenderer.tsx  Elige cómo renderizar cada pieza
    ui/                    Las 8 piezas base + CustomComponentRenderer y SandboxedHtmlPreview
  data/                    Catálogo base (initialComponents.ts) y tokens de diseño
  utils/                   Lógica pura: inspector, estandarizador HTML→JSX, detector de dependencias,
                           diff, búsqueda fuzzy, paletas, saneado de HTML, documento del sandbox,
                           validación de imports (cada una con su *.test.ts)
docs/ESTADO_PROYECTO.md    Auditoría técnica y hoja de ruta
```

## Cómo se guardan los datos

- Las **8 piezas base** viven en el código (`src/data/initialComponents.ts`) y no se borran.
- Las **piezas propias**, los favoritos y las etiquetas de piezas base se guardan en IndexedDB (`MiUILabDatabase`) en tu navegador. No salen de él salvo que las exportes.
- Registrar una iteración de una pieza base guarda tu versión en IndexedDB y la sustituye en el catálogo. "Restablecer" en el modal de exportación vuelve al estado original.
- Si una escritura en IndexedDB falla, verás un aviso ⚠ en el toast.

### Formato de export/import

Exportar genera un JSON con un **array de objetos `UIComponent`** (ver `src/types.ts`). Al importar:

- las piezas base del array se ignoran (nunca se sobrescriben);
- cada elemento necesita `id` (letras, números, `-` o `_`) y `name`; el resto de campos se normalizan y una categoría desconocida pasa a `custom`;
- todo lo importado se marca como pieza propia, y su `rawHtml` se sanea;
- una pieza con un `id` que ya tienes la reemplaza; los elementos inválidos se listan y se descartan.

## Añadir una pieza base

1. Crea el componente en `src/components/ui/`.
2. Añade su ficha (variantes, props, snippets, tokens) a `src/data/initialComponents.ts`.
3. Añade el caso correspondiente en `src/components/InteractiveComponentRenderer.tsx`.

## Seguridad del HTML capturado

El HTML que se pega en el Inspector o llega en un JSON importado se considera no confiable:

- se sanea con DOMPurify (sin `<script>`, manejadores `on*`, URLs `javascript:` ni `iframe`/`object`/`embed`) antes de analizarlo o guardarlo;
- se renderiza solo dentro de un iframe con origen opaco, que no puede leer el DOM, IndexedDB ni localStorage de la app. Se comunica con ella únicamente para informar de su alto y de los clics.

## Limitaciones conocidas

- Las piezas **creadas a mano** guardan su código TSX como referencia y se muestran como una tarjeta con el snippet: **no se compilan ni se renderizan en vivo**. Solo las piezas **capturadas** (HTML) se ven en vivo. Es una decisión consciente: un compilador en vivo (Sucrase) existió brevemente y se retiró.
- La vista previa de las piezas capturadas carga el Tailwind Play CDN, así que sin conexión se muestran sin estilos.
- El Inspector detecta dependencias como Flowbite o Radix, pero no las carga: el JavaScript interactivo que necesiten no funcionará en la vista previa.
- No hay tests de interfaz ni E2E; los tests cubren utilidades, persistencia y el `ErrorBoundary`.
