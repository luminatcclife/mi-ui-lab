# INFORME DE ESTADO DEL PROYECTO: mi-ui-lab

> Auditoría técnica sobre `master` @ `30cc4b4` (13 commits) + cambios sin commitear. Fecha: 2026-09-23.
> Verificado en esta auditoría: `npm run lint` (tsc) **pasa sin errores**; `npm run build` **pasa** (bundle JS único de 837 kB / 236 kB gzip, con aviso de tamaño).

---

## 1. Visión General y Objetivo Conceptual

**Propósito principal.** Biblioteca/taller *personal* de componentes UI (React + Tailwind) que funciona 100 % en el navegador, sin backend. Está pensado para un único desarrollador/diseñador que quiere:

- tener un catálogo propio de piezas con variantes, props, tokens y código listo para copiar;
- **capturar HTML/Tailwind de otros sitios**, analizarlo y convertirlo en una pieza propia;
- jugar con las piezas (props, variantes, viewport, deshacer/rehacer), compararlas y versionarlas;
- exportar/importar la colección como JSON.

**Lógica de negocio central (flujo principal).**

```
Inicio ──► Biblioteca   (explorar, buscar fuzzy, filtrar por tags/categoría, favoritos,
   │                     comparar 2 piezas, ficha de detalle, tokens, exportar, iterar versión)
   ├───► Laboratorio    (alta de piezas: a mano con NewComponentModal
   │                     o capturando HTML con ElementInspectorModal ─► inspección ─►
   │                     detección de dependencias ─► estandarización a UIComponent ─► guardar)
   └───► Playground     (interactuar con una pieza: variantes, editor de props,
                         viewport, historial undo/redo en memoria)

Persistencia: catálogo base estático (8 piezas en código) + piezas propias en IndexedDB (Dexie).
```

---

## 2. Arquitectura Técnica y Stack

**Tecnologías y librerías (según `package.json`).**

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript ~5.8 (sin `strict` en `tsconfig.json`) |
| UI | React 19, `lucide-react` (iconos), `motion` (animaciones) |
| Estilos | Tailwind CSS 4 vía `@tailwindcss/vite`; fuentes Google (Outfit, Plus Jakarta Sans, JetBrains Mono) |
| Build | Vite 6 + `@vitejs/plugin-react` |
| Persistencia | Dexie 4 (IndexedDB) + restos de `localStorage` |
| Runtime externo | Tailwind Play CDN (`cdn.tailwindcss.com`) inyectado en el iframe del Inspector |
| CI | GitHub Actions: `npm ci` → `tsc --noEmit` → `vite build` |

Dependencias declaradas pero no usadas o mal ubicadas: `tsx`, `autoprefixer`, `esbuild` (devDeps sin uso aparente); `vite`/`@tailwindcss/vite`/`@vitejs/plugin-react` están en `dependencies` en vez de `devDependencies`; `vite` está duplicado en ambas secciones.

**Patrón de arquitectura.** SPA cliente monolítica, *local-first*, sin servidor. Estado global centralizado en `App.tsx` (un único componente "dios" con `useState` + *prop drilling* a 4 pantallas). No hay router (navegación por `useState<AppScreen>`), ni gestor de estado, ni capa de servicios separada: la capa de datos es `src/db/db.ts`, invocada directamente desde los handlers de `App.tsx`.

**Estructura de directorios.**

| Ruta | Rol |
|---|---|
| `src/App.tsx` | Orquestador: estado global, handlers CRUD, navegación, modales, toasts |
| `src/components/*Screen.tsx` | Las 4 pantallas: Home, Biblioteca, Laboratorio, Playground |
| `src/components/*Modal.tsx`, `*Panel.tsx`, `*View.tsx` | Modales y vistas (tokens, paleta, export, iteración, comparación, inspector) |
| `src/components/ui/` | Las 8 piezas base reales + `CustomComponentRenderer` (render de piezas capturadas) |
| `src/data/` | Catálogo estático (`initialComponents.ts`, 1 558 líneas) y tokens de diseño |
| `src/db/db.ts` | Esquema Dexie (v2) y funciones de persistencia/migración |
| `src/utils/` | Lógica pura: inspector de elementos, estandarizador HTML→JSX, detector de dependencias, diff, búsqueda fuzzy, generador de paletas |
| `src/context/ThemeContext.tsx` | Tema claro/oscuro |
| `.github/workflows/ci.yml` | CI (tipos + build) |

---

## 3. Inventario Modular y Funcional

**Módulos implementados.**

| Módulo | Función | Estado |
|---|---|---|
| `HomeScreen` | Landing con 3 destinos y contadores | Funcional (el contador de favoritos es erróneo, ver §6) |
| `BibliotecaScreen` + `Sidebar` + `CategoryGridView` + `ComponentDetailPanel` | Explorar, filtrar, favoritos, tags, detalle | Funcional |
| `ComparisonView` + `utils/diffUtils` | Diff de código (línea a línea), props y tokens entre 2 piezas | Funcional |
| `PlaygroundScreen` + `InteractivePropEditor` + `LocalHistoryControl` | Edición en vivo de props, variantes, viewport, undo/redo | Funcional (historial solo en memoria) |
| `LaboratorioScreen` + `NewComponentModal` | Alta manual de pieza (metadatos + código TSX de referencia) | Funcional, pero la pieza **no se renderiza en vivo** (tarjeta fallback) |
| `ElementInspectorModal` (1 575 líneas) + `utils/elementInspector` + `componentStandardizer` + `dependencyDetector` | Captura de HTML, ficha técnica, clasificación de clases Tailwind, detección de Lucide/Motion/Radix/Flowbite…, generación de TSX, preview en iframe sandbox | Funcional |
| `TokensPanel` + `data/tokens` | Explorador de tokens de diseño | Funcional |
| `PaletteGeneratorModal` + `utils/colorPaletteGenerator` | Escala 50–950, armonías, contraste WCAG, export Tailwind v3/v4/CSS vars | Funcional |
| `IterationModal` | Nueva versión de una pieza con notas/changelog | Funcional |
| `ExportModal` | Export JSON/descarga, import JSON, reset, estadísticas DB | Funcional con bugs (ver §6) |
| `SearchBar` + `utils/fuzzySearchIndex` | Búsqueda fuzzy | `SearchBar.tsx` **no se importa en ningún sitio (código muerto)**; el índice fuzzy sí se usa desde otros componentes |

**Componentes críticos.**

- **Modelo de datos** (`src/types.ts`): `UIComponent` (id, category, sourceCode, usageSnippet, variants, props, tokensUsed, tags, isCustom, version, versionHistory, rawHtml), `ComponentVariant`, `PropDoc`, `ComponentIteration`, `ComponentDraft`.
- **Esquema IndexedDB** (`MiUILabDatabase`, v2): `customComponents`, `favorites`, `tagOverrides`, `meta`, `drafts`.
- **Render**: `InteractiveComponentRenderer` enruta por `component.id` con `if` encadenados a las 8 piezas base; cualquier otra pieza cae en `CustomComponentRenderer`, que inyecta `rawHtml` con `dangerouslySetInnerHTML`.
- **Endpoints/API**: no existen (no hay backend).

---

## 4. Auditoría de Avance y Porcentaje de Completitud

MVP de referencia: *biblioteca personal local que permite explorar, probar, añadir (a mano y por captura), persistir y exportar piezas de forma fiable*.

**Porcentaje global estimado: ~62 %**

| Área | % | Justificación |
|---|---|---|
| Funcionalidades core | 70 % | Todos los flujos existen de extremo a extremo, pero las piezas manuales no se renderizan, los borradores no tienen UI y el import/export tiene bugs de consistencia |
| Interfaz / Frontend | 80 % | 4 pantallas coherentes, tema claro/oscuro, responsive. Faltan code-splitting, estados de error y accesibilidad revisada |
| Persistencia / BD | 65 % | Dexie con versión de esquema y migración desde localStorage. Pero escribe en dos sitios a la vez, el estado y la BD divergen en import, y hay tablas sin usar |
| Pruebas y validación | 5 % | Cero tests. Solo comprobación de tipos (sin `strict`) y build en CI |

**Desviaciones y superaciones.**

- **Más allá del alcance** de una "biblioteca de componentes": generador de paletas con contraste WCAG, diff visual entre piezas, detector de dependencias de terceros, inspector con iframe sandbox + Tailwind CDN, historial undo/redo, versionado por pieza. Es alcance extra de valor, pero ha crecido más rápido que la base (tests, validación).
- **Regresión respecto a lo documentado**: el commit `edf0c94` introdujo un compilador en vivo (Sucrase) de `sourceCode` (`liveComponentCompiler.ts`, `LiveComponentPreview.tsx`) y `ff982c8` **lo eliminó** al sustituir el inspector. El README sigue describiendo esos archivos y Sucrase como si existieran.
- **Regresión de la funcionalidad de borradores**: `52da21d` conectó guardar/reanudar borradores; al reemplazar el inspector en `ff982c8` se perdió la UI. La tabla `drafts` y `saveDraftToDB` / `loadDraftsFromDB` / `deleteDraftFromDB` siguen existiendo sin ninguna llamada.
- **Restos de plantilla de Google AI Studio**: `.env.example` (`GEMINI_API_KEY`, `APP_URL`) y `metadata.json` (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`) declaran integración con Gemini y servidor. **No hay ninguna llamada a IA ni servidor en el código.** Contradice el concepto "independiente y sin nube".

---

## 5. Análisis de Brechas (Gap Analysis)

**Funcionalidades pendientes (priorizadas).**

1. **Render en vivo de piezas creadas a mano**: hoy muestran una tarjeta con el snippet. Hay que recuperar el compilador (Sucrase + error boundary) o asumir el cambio y documentarlo.
2. **Render fiel de piezas capturadas fuera del Inspector**: el preview del Inspector usa un iframe con Tailwind CDN (cualquier clase funciona), pero en Biblioteca y Playground el `rawHtml` se inyecta en el DOM de la app, que solo tiene el CSS compilado de la propia app. **Las clases que la app no usa no tendrán estilo** → lo que se ve al capturar ≠ lo que se ve después de guardar. Solución: reutilizar el mismo iframe sandbox para mostrar las piezas capturadas.
3. **UI de borradores** (guardar / listar / reanudar / descartar) o eliminar la tabla `drafts`.
4. **Validación del import JSON** con un esquema (p. ej. Zod) y fusión correcta con las piezas propias ya existentes.
5. **Edición de piezas propias** (hoy solo se puede crear, iterar versión, etiquetar o borrar; no hay edición de metadatos/código).
6. Persistencia del historial del Playground (opcional).
7. Categoría `data` declarada sin ninguna pieza.

**Integraciones a medias.**

- Gemini/AI Studio: declarado en config, sin implementar → implementar o eliminar.
- Flowbite/Radix/Motion: el detector los identifica, pero no hay mecanismo para cargarlos en el preview; solo se avisa.
- Dependencia en runtime de `cdn.tailwindcss.com` (Play CDN, no recomendado para producción, requiere red): el Inspector no funciona offline, lo que choca con el enfoque *local-first*.

---

## 6. Deuda Técnica y Calidad de Código

**Refactorizaciones necesarias.**

- **Escritura doble localStorage + Dexie** en `App.tsx`: cada mutación escribe en ambos, y el estado inicial se lee de localStorage antes de hidratar desde Dexie. La migración solo se hace una vez, así que localStorage queda como una segunda fuente de verdad que no se usa y puede desincronizarse. Hay que eliminar localStorage de `App.tsx`.
- **Bugs de consistencia de estado:**
  - `handleImportComponents` reconstruye el estado como `INITIAL_COMPONENTS + importados`: **las piezas propias previas y los overrides de tags desaparecen de la UI** (pero siguen en Dexie y reaparecen al recargar).
  - `handleDeleteCustomComponent` borra el favorito en Dexie pero no del estado `favoriteIds`.
  - Favorito por defecto `'custom-button'` **no existe** en el catálogo (el id real es `primary-button`), así que Home muestra 2 favoritos cuando solo hay 1. Aparece en 4 sitios (`App.tsx:63`, `db.ts:163,174,262`).
  - Las escrituras en Dexie son *fire-and-forget*: el error solo se registra en consola y la UI confirma el guardado igualmente.
- **`App.tsx` como "god component"** con más de 20 handlers y prop drilling; conviene extraerlo a un hook o store (`useCatalog`) o a un contexto.
- **Render por `if (component.id === …)`** en `InteractiveComponentRenderer`: no escala. Mejor un registro `id → componente`.
- **Archivos gigantes**: `ElementInspectorModal.tsx` (1 575), `ComparisonView.tsx` (1 293), `PaletteGeneratorModal.tsx` (1 120), `initialComponents.ts` (1 558, con código fuente duplicado como string, que se desincronizará de `src/components/ui/`).
- **Clases Tailwind dinámicas** (`border-${effectiveAccent}-500/40` en `CustomComponentRenderer`): Tailwind no puede generarlas en build, así que no se aplican.
- Código muerto: `SearchBar.tsx`, bloque de reemplazo de título comentado en `CustomComponentRenderer`, `activeTags`/`tagOverrides` devueltos sin usar, `canvasBg` como estado fijo sin setter.
- **`types.ts` en la raíz** (sin trackear): copia desactualizada de `src/types.ts` (le falta `ComponentDraft`). Hay que borrarla.
- `tsconfig.json` sin `strict`, más `experimentalDecorators` innecesario. El uso extendido de `any` (`Record<string, any>`, `as any`) oculta errores.
- Bundle monolítico de 837 kB: faltan `React.lazy` para los modales y las pantallas pesadas.
- Comentario con codificación rota en `vite.config.ts` (`modifyâfile`).
- `.gitignore` (cambio sin commitear) duplica la línea `.env*`.

**Tratamiento de errores y seguridad.**

- **XSS almacenado (riesgo principal)**: `CustomComponentRenderer` inyecta `rawHtml` con `dangerouslySetInnerHTML` en el DOM principal, sin sanitizar. El `rawHtml` puede venir de HTML pegado de terceros o de un **JSON importado** que haya compartido otra persona. Un `<img src=x onerror=…>` ejecuta JS con acceso a IndexedDB y al resto de la app. Además, `elementInspector.ts` monta el HTML parseado directamente en el documento principal (`appendChild`) para calcular estilos, lo que también dispara manejadores inline. Mitigación: DOMPurify y/o renderizar siempre dentro del iframe `sandbox`.
- El iframe del Inspector usa `sandbox="allow-scripts"` sin `allow-same-origin`, que es correcto. Carga un script remoto sin SRI.
- No hay credenciales reales hardcodeadas. `.env.example` solo contiene placeholders.
- No hay error boundary: un fallo de render en cualquier pieza tumba la app entera (`LiveErrorBoundary` se eliminó).
- Los errores se comunican con `alert()` (import) o solo por consola. No hay logging estructurado, aunque tampoco es crítico en una app local.
- **Higiene del repo**: `src/utils/carta.md` (sin trackear) es un documento personal que no tiene relación con el proyecto. Conviene sacarlo del repositorio o añadirlo a `.gitignore` antes de cualquier `git add .`.

**Testing.** No hay ningún test ni framework de testing instalado. Las candidatas obvias, por ser lógica pura y fácil de probar con Vitest, son `diffUtils`, `fuzzySearchIndex`, `colorPaletteGenerator`, `componentStandardizer` (HTML→JSX), `dependencyDetector` y `db.ts` (con `fake-indexeddb`). No hay tests E2E (Playwright) para los flujos capturar → guardar → ver en Biblioteca.

---

## 7. Estado de la Documentación

**Faltantes documentales.**

- `README.md` **desactualizado e inexacto**: menciona Sucrase, `liveComponentCompiler.ts`, `LiveComponentPreview.tsx` y `LiveErrorBoundary.tsx`, que no existen; no describe las 4 pantallas, el Inspector ni el generador de paletas.
- Los comentarios en el código son aceptables en `db.ts` y en las utilidades (JSDoc breve), y escasos en los componentes grandes.
- No hay diagrama de arquitectura, CHANGELOG, guía de contribución ni licencia.
- No aplica OpenAPI/Swagger (no hay API).

**Documentación técnica requerida.**

1. README corregido (stack real, pantallas, flujos, limitaciones conocidas).
2. Especificación del **formato JSON de export/import** (contrato de `UIComponent`, versión de esquema).
3. Guía "cómo añadir una pieza base" (hoy requiere tocar `ui/`, `initialComponents.ts` e `InteractiveComponentRenderer`).
4. ADR sobre la decisión de preview: iframe + CDN frente a DOM de la app, y el compilador en vivo eliminado.
5. Nota de seguridad sobre HTML de terceros.

---

## 8. Hoja de Ruta Sugerida (Próximos Pasos Priorizados)

1. ✅ **Hecho (2026-09-23)** — `utils/sanitizeHtml.ts` (DOMPurify), `utils/sandboxDocument.ts` + `ui/SandboxedHtmlPreview.tsx` (iframe `sandbox="allow-scripts"` con auto-alto y clics vía postMessage, usado por `CustomComponentRenderer`), saneado previo al montaje en `elementInspector.ts` y validación de import en `utils/validateImport.ts`. Pendiente: tests automatizados de estas piezas (paso 3). Plan original: **Cerrar el XSS y unificar el render de piezas capturadas**: renderizar `rawHtml` siempre en el iframe sandbox que ya existe (esto también corrige los estilos que faltan fuera del Inspector) y sanitizar con DOMPurify el paso por `elementInspector`. Validar el JSON importado con un esquema.
2. ✅ **Hecho (2026-09-23)** — nuevo `hooks/useCatalog.ts` (Dexie como única fuente de verdad, sin localStorage en `App.tsx`; las escrituras devuelven éxito y un fallo se avisa por toast); el import fusiona con las piezas existentes; borrar una pieza la quita de favoritos; reset restablece también los favoritos en pantalla; `DEFAULT_FAVORITES` = `accent-card` + `primary-button`, con purga de favoritos huérfanos al cargar; una iteración de una pieza base la reemplaza en vez de duplicarla al recargar (bug adicional detectado). Plan original: **Arreglar la capa de datos**: quitar localStorage de `App.tsx` (Dexie como única fuente de verdad), corregir el import que borra piezas del estado, el favorito fantasma `custom-button` y la desincronización de favoritos al borrar; extraer un hook `useCatalog`.
3. ✅ **Hecho (2026-09-23)** — Vitest 5 + jsdom + fake-indexeddb (`npm test`, también en CI): 57 tests en 8 archivos (utilidades puras, saneado/validación/sandbox, `db.ts` incluida la migración, y `ErrorBoundary`); `strict: true` en TypeScript (0 errores, aunque el uso de `any` sigue ocultando tipos); `ErrorBoundary` a tres niveles: por pieza (en `InteractiveComponentRenderer`), por pantalla y global. Pendiente: tests de componentes/E2E de los flujos completos. Plan original: **Poner una red de seguridad**: Vitest más tests de las 6 utilidades puras y de `db.ts`; añadir `npm test` a CI; activar `strict` en TypeScript; error boundary global y por pieza.
4. **Resolver las funcionalidades huérfanas**: decidir si se recupera el compilador en vivo (Sucrase) para las piezas manuales y la UI de borradores, o se eliminan; quitar los restos de AI Studio/Gemini (`.env.example`, `metadata.json`) y `SearchBar.tsx`.
5. **Documentación e higiene**: reescribir el README, borrar `types.ts` de la raíz, sacar `carta.md` del repo, arreglar `.gitignore` y `package.json` (devDeps), y hacer code-splitting de modales y pantallas.
