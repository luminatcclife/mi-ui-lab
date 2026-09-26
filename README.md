# mi-ui-lab

Taller personal de componentes de interfaz en React + Tailwind CSS. Funciona **100 % en el navegador**, sin backend ni cuentas: guarda tus piezas en IndexedDB, te deja probarlas en vivo, compararlas, versionarlas y **capturar HTML de cualquier sitio** para convertirlo en una pieza propia.

## Pantallas

| Pantalla | Para qué sirve |
|---|---|
| **Inicio** | Punto de entrada con acceso a las tres zonas y contadores de la colección. |
| **Biblioteca** | Explorar, buscar (búsqueda fuzzy tolerante a erratas y acentos), filtrar por categoría y etiquetas, favoritos, ficha de detalle, comparar dos piezas (diff de código, props y tokens), registrar iteraciones, editar piezas propias (nombre, descripción, categoría, tokens, HTML y código), explorar tokens, generar paletas y exportar/importar la colección. |
| **Laboratorio** | Incorporar piezas nuevas: **a mano** (metadatos + código TSX de referencia) o **capturando HTML** con el Inspector (ficha técnica, clases Tailwind categorizadas, detección de dependencias como Lucide/Radix/Flowbite, TSX generado y vista previa aislada). |
| **Playground** | Interactuar con una pieza: variantes, editor de props, tono de acento, viewport y deshacer/rehacer. |

## Stack

- React 19 + TypeScript (`strict`) · Vite 6 · Tailwind CSS 4
- Dexie 4 (IndexedDB) para la persistencia local
- DOMPurify + iframe aislado (`sandbox="allow-scripts"`) con `@tailwindcss/browser` servido por la propia app para mostrar en vivo el HTML capturado
- Vitest 5 + jsdom + fake-indexeddb para los tests; Playwright para los E2E (`e2e/`)

## Ejecutar en local

Requisito: Node.js 24 o superior (la versión que usa la CI).

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests unitarios y de integración (Vitest)
npm run test:e2e   # tests E2E de los flujos completos (Playwright)
npm run lint       # comprobación de tipos (tsc --noEmit)
npm run build      # build de producción en dist/
```

La CI (GitHub Actions) ejecuta `lint`, `test` y `build`, y en paralelo los E2E, en cada push y PR a `master`.

La primera vez, los E2E necesitan el Chromium de Playwright (`npx playwright install chromium`). Si no puedes descargarlo, usa el Chrome instalado: `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. Por defecto corren contra el servidor de desarrollo; con `E2E_PROD=1` corren contra el build de producción, que es lo que hace la CI.

## Publicar

Es una web estática: `npm run build` genera `dist/`, que se puede servir desde cualquier hosting estático (Vercel, Netlify, GitHub Pages…) o abrir con `npm run preview`. No necesita variables de entorno ni backend. Para probar los E2E contra una copia publicada: `E2E_BASE_URL=https://… npm run test:e2e`.

Los cambios de cada versión están en el [CHANGELOG](CHANGELOG.md).

## Estructura

```
src/
  App.tsx                  Navegación entre pantallas, modales y toasts
  hooks/useCatalog.ts      Estado del catálogo (piezas + favoritos); IndexedDB es la única fuente de verdad
  hooks/useModalA11y.ts    Teclado y foco comunes a los modales (Escape, foco atrapado y devuelto)
  db/db.ts                 Esquema Dexie (v3), migración única desde localStorage y funciones de lectura/escritura
  components/
    *Screen.tsx            Las cuatro pantallas (Biblioteca, Laboratorio y Playground se cargan bajo demanda)
    *Modal.tsx, TokensPanel.tsx, ComparisonView.tsx, ...
    ErrorBoundary.tsx      Aislamiento de fallos de render por pieza, por pantalla y global
    InteractiveComponentRenderer.tsx  Elige cómo renderizar cada pieza (registro de piezas base o sandbox)
    builtInRenderers.tsx   Registro id → render de las 8 piezas base
    ui/                    Las 8 piezas base + CustomComponentRenderer y SandboxedHtmlPreview
    palette/, comparison/, inspector/  Pestañas del generador de paletas, el comparador y el Inspector
  data/                    Catálogo base (initialComponents.ts) y tokens de diseño
  utils/                   Lógica pura: inspector, estandarizador HTML→JSX, detector de dependencias,
                           diff, búsqueda fuzzy, paletas, saneado de HTML, documento del sandbox,
                           validación de imports (cada una con su *.test.ts)
docs/AUDITORIA_CIERRE.md   Auditoría de cierre v1.0.0: estado final y backlog
docs/ESTADO_PROYECTO.md    Auditoría inicial y hoja de ruta (histórico)
e2e/                       Tests E2E (Playwright) e instantáneas de texto de cada pestaña
```

## Cómo se guardan los datos

- Las **8 piezas base** viven en el código (`src/data/initialComponents.ts`) y no se borran.
- Las **piezas propias**, los favoritos y las etiquetas de piezas base se guardan en IndexedDB (`MiUILabDatabase`) en tu navegador. No salen de él salvo que las exportes.
- Registrar una iteración de una pieza base guarda tu versión en IndexedDB y la sustituye en el catálogo. "Restablecer" en el modal de exportación vuelve al estado original.
- Si una escritura en IndexedDB falla, verás un aviso ⚠ en el toast.
- **Haz copias.** Si se borran los datos del sitio en el navegador, tus piezas propias se pierden. Inicio te recuerda exportar la colección cuando tienes piezas propias y no la has exportado en 30 días (puedes posponerlo 7 días). Copiar o descargar el JSON cuenta como copia.

### Formato de export/import

Exportar genera un JSON con un **array de objetos `UIComponent`** (ver `src/types.ts`). Al importar:

- las piezas base del array se ignoran (nunca se sobrescriben);
- cada elemento necesita `id` (letras, números, `-` o `_`) y `name`; el resto de campos se normalizan y una categoría desconocida pasa a `custom`;
- todo lo importado se marca como pieza propia, y su `rawHtml` se sanea;
- una pieza con un `id` que ya tienes la reemplaza; los elementos inválidos se listan y se descartan.

**Qué no incluye la copia.** El JSON solo restaura tus **piezas propias**. Si lo importas en otro navegador (o tras borrar los datos del sitio), se pierden:

- los **favoritos**;
- las **etiquetas añadidas a piezas base**;
- las **iteraciones registradas sobre piezas base** (viajan en el JSON, pero al importar se ignoran como cualquier pieza base, y la pieza vuelve a su versión original).

"Restablecer" borra todo lo anterior y además tus piezas propias, sin posibilidad de deshacer: exporta antes una copia.

## Añadir una pieza base

1. Crea el componente en `src/components/ui/`.
2. Añade su ficha (variantes, props, snippets, tokens) a `src/data/initialComponents.ts`.
3. Añade su entrada (mismo `id`) en `BUILT_IN_RENDERERS`, en `src/components/builtInRenderers.tsx`. Un test falla si alguna pieza base no tiene renderer, y otro renderiza todas sus variantes.

## Seguridad del HTML capturado

El HTML que se pega en el Inspector o llega en un JSON importado se considera no confiable:

- se sanea con DOMPurify (sin `<script>`, manejadores `on*`, URLs `javascript:` ni `iframe`/`object`/`embed`) antes de analizarlo o guardarlo;
- se renderiza solo dentro de un iframe con origen opaco, que no puede leer el DOM, IndexedDB ni localStorage de la app. Se comunica con ella únicamente para informar de su alto y de los clics.

## Limitaciones conocidas

- Las piezas **creadas a mano** guardan su código TSX como referencia y se muestran como una tarjeta con el snippet: **no se compilan ni se renderizan en vivo**. Solo las piezas **capturadas** (HTML) se ven en vivo. Es una decisión consciente: un compilador en vivo (Sucrase) existió brevemente y se retiró.
- La vista previa compila las clases con Tailwind v4. HTML escrito para Tailwind v3 puede verse ligeramente distinto en algunas utilidades que cambiaron entre versiones (p. ej. `ring`, `shadow-sm`, `bg-opacity-*`).
- Sin conexión, las piezas capturadas se ven con estilos, pero con la fuente del sistema: las fuentes se cargan de Google Fonts.
- El Inspector detecta dependencias como Flowbite o Radix, pero no las carga: el JavaScript interactivo que necesiten no funcionará en la vista previa.
- La ficha técnica del Inspector (estilos computados y medidas) es **aproximada**: se calcula con el CSS de la propia app, no con el Tailwind del iframe. Las clases que la app no usa no aparecen en esos valores, aunque la vista previa sí las muestra. Si pegas varios elementos raíz, se agrupan en un `<div>`.
- Los E2E cubren los flujos principales (capturar, importar, editar, piezas corruptas, uso sin conexión), no cada interacción de cada pantalla.

## Licencia

[MIT](LICENSE) © 2026 sole fro
