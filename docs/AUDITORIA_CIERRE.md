# Auditoría de cierre — mi-ui-lab

> Fecha: 2026-09-26. Alcance: estado final del proyecto para cerrarlo como **v1.0.0**.
> Base: copia descargada `mi-ui-lab-master` (sin carpeta `.git`), revisión estática de todo `src/`, `e2e/`, configuración, CI y documentación.
> Continúa `docs/ESTADO_PROYECTO.md` (auditoría del 2026-09-23 y su seguimiento).

---

## Verificación final (2026-09-26, 15:5x) — ✅ superada

Ejecutada con Node 24.11.0 sobre el código definitivo: cierre + rediseño «papel y tinta» completo (pantallas, ficha, Inspector, Laboratorio y modales con `ModalFrame`). Durante la verificación no cambió ningún archivo.

| Paso | Resultado |
|---|---|
| `npm run lint` (tsc strict) | ✅ 0 errores |
| `npm test` | ✅ 153/153 (17 archivos) |
| `npm run build` | ✅ chunk principal 403 kB (125 kB gzip) |
| E2E contra el build (`E2E_PROD=1`), 1 worker | ✅ 12/12 |
| E2E contra el build, en paralelo, timeout 90 s | ✅ 12/12 |

En paralelo con el timeout por defecto (30 s) fallaron 6/12, todos al agotar el tiempo. La máquina tenía una carga de ~25 con 8 núcleos (WindowServer, `spindump`, apps de Claude). Esos mismos tests pasan con 1 worker y en paralelo con 90 s, y a las 13:1x, con carga ~3, pasaron 12/12 en paralelo con 30 s. No es un fallo del código. La CI usa máquinas limpias y 1 reintento.

**Instantáneas** (`e2e/pestanas.spec.ts-snapshots/`), revisadas contra las originales del ZIP:
- `inspector-*.txt`: medidas 0 × 0 → 209 × 40 px (C-3), color real `indigo-600` gracias a `.piece-scope` en el punto de montaje, y textos nuevos del rediseño.
- `compare-*.txt` y `palette-*.txt`: regeneradas por la sesión de rediseño. Solo cambian rótulos; los datos (colores, rgb y hsl, similitud 10 %, +36/−199, diff de código) son idénticos.

**Regresión detectada y corregida durante la verificación:** el snippet exportable "classes" del generador de paletas había perdido `shadow-xs` en "Botón Primario Sólido". Restaurado en `PaletteGeneratorModal.tsx`.

**Arreglos de la auditoría comprobados tras el rediseño:** `useModalA11y` y `role="dialog"`/`aria-modal`/`aria-labelledby`/`tabIndex=-1` en los 5 modales; `#export-scope-note`; confirmación de Restablecer con el número de piezas; `handleCopy` con `await`/`catch`; sin `alert()`.

Pendiente: H-6 (commit, tag `v1.0.0` y CI en GitHub). Esta carpeta no es un repositorio git.

## 0. Límites de esta auditoría (leer primero)

| Qué | Estado | Consecuencia |
|---|---|---|
| Node.js en esta máquina | **No instalado** | No se ejecutaron `lint`, `test`, `build` ni los E2E. Las cifras de tests del informe anterior (139 unitarios + 11 E2E) **no se han podido reverificar**. |
| Repositorio git | **La carpeta no es un repo** (es la descarga ZIP de `master`) | No se puede saber si hay cambios sin publicar ni si la CI de `master` está en verde. |

El cierre depende de ejecutar la **verificación final** de la sección 4 en un entorno con Node 24 y el repo clonado.

---

## 1. Veredicto

**El proyecto se puede cerrar hoy.** Los 5 pasos de la hoja de ruta y todos los pendientes posteriores están resueltos en el código: XSS cerrado (DOMPurify + iframe con origen opaco), IndexedDB como única fuente de verdad, `strict` sin `any`, error boundaries a tres niveles, code-splitting, render sin CDN, tests unitarios + E2E en CI y README al día.

No hay fallos de seguridad abiertos ni riesgos de corrupción de datos. Lo que queda son **3 problemas que afectan a la promesa del producto** (copias de seguridad incompletas, reset sin aviso claro y medidas del Inspector siempre en 0), algunos defectos menores y trabajo de higiene para cerrar la versión.

| Área | Estado final |
|---|---|
| Funcionalidad core | ✅ Completa. Los flujos capturar → guardar → ver → editar → exportar/importar funcionan de extremo a extremo |
| Seguridad | ✅ Sin hallazgos abiertos de severidad media o alta |
| Persistencia | ⚠ Correcta, pero el export no cubre todo lo que el usuario cree respaldar (C-1) |
| Calidad / tests | ✅ `strict`, sin `any`, unitarios + E2E en CI (pendiente de reverificar) |
| UX / accesibilidad | ⚠ Aceptable para uso personal, con deudas conocidas (M-4, M-5) |
| Documentación | ⚠ README correcto; `ESTADO_PROYECTO.md` tiene la cabecera desactualizada (H-2) |

---

## 2. Hallazgos

Severidad: **C** = corregir antes de cerrar · **M** = conviene corregir hoy si hay tiempo · **B** = backlog post-1.0 (documentar y aceptar).

### 🔴 C — Bloqueantes para cerrar

> **Estado (2026-09-26):** C-1 (arreglo mínimo), C-2 y C-3 aplicados en el código. Falta ejecutar la verificación y regenerar la instantánea `inspector-specs.txt` (ver §4, bloque 3).

**C-1. La copia de seguridad no respalda todo lo que el usuario cree.**
`validateImport.ts:168` descarta en silencio cualquier elemento con el id de una pieza base, y el export (`ExportModal.tsx`) solo serializa `components`. Por eso, al restaurar un JSON en un navegador limpio **se pierden**:
- las **iteraciones registradas sobre piezas base** (se guardan en `customComponents` con el id base, viajan en el JSON y se ignoran al importar);
- las **etiquetas añadidas a piezas base** (`tagOverrides`);
- los **favoritos**.

El aviso de Inicio ("exportá tu colección para tener respaldo") da a entender que la copia es completa.
*Arreglo mínimo (≈30 min):* documentarlo en el README (sección "Formato de export/import") y en el texto del modal: "La copia incluye tus piezas propias; no incluye favoritos, etiquetas ni iteraciones de las piezas base".
*Arreglo completo (≈2-3 h, post-1.0):* formato v2 `{ schemaVersion: 2, components, favorites, tagOverrides, baseOverrides }`, aceptando también el array v1.

**C-2. "Restablecer" borra todas las piezas propias sin decirlo.**
`ExportModal.tsx:318`: el `confirm()` solo pregunta *"¿Restablecer la biblioteca a las piezas iniciales?"*. `resetDBToDefaults()` vacía `customComponents`, `favorites` y `tagOverrides`, y no se puede deshacer.
*Arreglo (≈15 min):* texto explícito con el número de piezas, por ejemplo *"Se borrarán definitivamente tus N piezas propias, tus favoritos y tus etiquetas. ¿Exportaste una copia?"*.

**C-3. La ficha técnica del Inspector muestra datos incorrectos.**
- `ElementInspectorModal.tsx:397`: el punto de montaje tiene `className="hidden"` (`display:none`), así que `getBoundingClientRect()` devuelve siempre **0 × 0**. La instantánea E2E `e2e/pestanas.spec.ts-snapshots/inspector-specs.txt` (líneas 30 y 53: `0px × 0px`, "Dimensiones Reales") **ha fijado el fallo como comportamiento esperado**.
- `elementInspector.ts:256`: `.replace(/\s*style="[^"]*"/, '')` quita el `style` que se añadió para ocultar el nodo, pero si el elemento raíz ya tenía un **`style` inline propio, también se borra** (el navegador los fusiona en un solo atributo). La pieza guardada pierde esos estilos.
- Los estilos computados (color, padding, etc.) se calculan con el CSS de la app, no con el Tailwind del iframe: las clases que la app no usa salen sin estilo en la ficha.

*Arreglo (≈45 min):* montar fuera de pantalla con `position:absolute; left:-9999px; visibility:hidden` en lugar de `display:none`; guardar el `style` original del raíz antes de modificarlo y restaurarlo (o clonar sin tocar el original y serializar el clon limpio); regenerar la instantánea. La limitación de los estilos computados basta con documentarla, o con etiquetar la sección como "aproximado (CSS de la app)".

### 🟠 M — Conviene hoy

> **Estado (2026-09-26):** M-1…M-7 aplicados (M-5 con `hooks/useModalA11y.ts` en Export, Iteración, Tokens, Paleta y Edición).

| ID | Hallazgo | Dónde | Arreglo | Esfuerzo |
|---|---|---|---|---|
| M-1 | Si se pegan **varios elementos raíz**, solo se analiza, previsualiza y guarda el primero, sin avisar | `elementInspector.ts:152` | Envolver en un `<div>` si `doc.body.children.length > 1`, o mostrar un aviso | 20 min |
| M-2 | "Copiar JSON" cuenta como copia de seguridad aunque falle el portapapeles (`writeText` sin `await`/`catch`) | `ExportModal.tsx:52` (y `copyToClipboard` en el Inspector) | `await` + `catch` → toast de error y no llamar a `markExported()` | 10 min |
| M-3 | **Registro mezclado**: voseo en Inicio, Playground, alta manual, ficha y aviso de copia ("Explorá", "Elegí", "Tenés", "querés", "Calculá", "acá") y tuteo en el resto y en el README ("Pega", "Verifica", "Haz copias") | `HomeScreen.tsx:38,56,75,115`, `PlaygroundScreen.tsx:87`, `NewComponentModal.tsx:283`, `ComponentDetailPanel.tsx:425`, `BackupReminder.tsx` (+ `e2e/flujos.spec.ts:147`) | Elegir un registro y unificar (el E2E busca "Recordámelo") | 20 min |
| M-4 | El botón **Eliminar pieza** solo se ve con hover del ratón (`opacity-0 group-hover:`): con teclado o pantalla táctil no se puede borrar | `Sidebar.tsx:634` | Añadir `focus-visible:opacity-100` y `aria-label`; o un botón "Eliminar" en la ficha, junto a "Editar" | 15 min |
| M-5 | Solo `EditComponentModal` tiene `role="dialog"`/`aria-modal`. El resto de modales no se cierra con **Escape** ni gestiona el foco | Export, Iteration, Tokens, Palette, NewComponent | Hook `useModalA11y(onClose)` (Escape + foco inicial) aplicado a los 5 | 45 min |
| M-6 | Textos que prometen de más: "y **tokens**" (no se exportan), "Sincronizar" (es una fusión manual), "sin límite de 5MB" (IndexedDB tiene cuota) | `ExportModal.tsx:123,154,265` | Ajustar el copy | 5 min |
| M-7 | Validación con `alert()` en 4 sitios; el resto de la app usa toasts | `ElementInspectorModal.tsx:282`, `NewComponentModal.tsx:66`, `IterationModal.tsx:70,75` | `onToast(...)` o error inline | 10 min |

### 🟡 B — Backlog post-1.0 (aceptar y documentar)

- **B-1.** Import solo por pegado: no hay `<input type="file">`, aunque el export sí descarga un archivo.
- **B-2.** Sin sincronización entre pestañas: con dos pestañas abiertas, la última escritura gana (`saveFavoritesToDB` hace `clear` + `bulkPut`). Tampoco se gestiona `versionchange` de Dexie.
- **B-3.** Si `loadCatalogFromDB` falla (IndexedDB bloqueada, modo privado), la app arranca con el catálogo base **sin avisar**: el usuario puede creer que perdió sus piezas. Conviene un toast "No se pudo leer tu colección".
- **B-4.** `IterationModal` no impide registrar una versión repetida o inferior a la actual.
- **B-5.** No hay forma de revertir una iteración de una pieza base salvo con el reset global.
- **B-6.** `ExportModal` y el Inspector son solo oscuros (0 y 1 variantes `dark:`); desentonan en el tema claro.
- **B-7.** `createdAt` usa dos formatos: fecha sola en el Inspector (`todayStr`) e ISO completo en el resto.
- **B-8.** Al calcular estilos, el Inspector monta el HTML saneado en el documento principal: un `<style>` del snippet afecta a la app durante ese instante y las `<img>` externas se descargan. No hay ejecución de código; es aceptable.
- **B-9.** Persistencia del historial del Playground: decisión abierta ya registrada en `ESTADO_PROYECTO.md` §9.
- **B-10.** Categoría `data` declarada sin ninguna pieza base.

### ⚪ Higiene de release

> **Estado (2026-09-26):** H-1…H-5 aplicados (versión 1.0.0 y `engines` también en `package-lock.json`, `CHANGELOG.md`, nota de histórico, `public/favicon.svg` + `twitter:card=summary`, sección "Publicar" en el README). **H-6 pendiente**: tag y release, tras la verificación.

| ID | Tarea | Esfuerzo |
|---|---|---|
| H-1 | `package.json`: `"version": "0.1.0"` → `"1.0.0"`; añadir `"engines": { "node": ">=24" }` (el README lo exige pero nada lo hace cumplir) | 5 min |
| H-2 | `docs/ESTADO_PROYECTO.md`: la cabecera y las secciones §2-§7 describen el estado del 23-09 ("sin `strict`", "cero tests", "~62 %", "`SearchBar` muerto"…). Añadir arriba una nota *"Documento histórico; el estado final está en AUDITORIA_CIERRE.md"*. El recordatorio de copia de seguridad tampoco aparece en §9 | 10 min |
| H-3 | `CHANGELOG.md` con la entrada `1.0.0` (resumen de §8-§9 + correcciones de hoy) | 15 min |
| H-4 | `index.html`: `twitter:card=summary_large_image` sin `og:image`, y no hay favicon (404 en `/favicon.ico`). Añadir un `favicon.svg` en `public/` o cambiar a `summary` | 10 min |
| H-5 | Despliegue: `playwright.config.ts` y `.gitignore` mencionan Vercel, pero el README no dice dónde se publica. Añadir la URL o "solo local" | 5 min |
| H-6 | Tag `v1.0.0` en git + release en GitHub | 5 min |

---

## 3. Lo que está bien (no tocar)

- **Seguridad del HTML capturado:** saneado en la entrada (Inspector, import, edición), otra vez en el render (`SandboxedHtmlPreview`), iframe `sandbox="allow-scripts"` sin `allow-same-origin`, mensajes filtrados por `event.source`, alto acotado a 4000 px y `accentColor` validado contra una lista antes de interpolarse. Un E2E comprueba que un JSON malicioso no ejecuta código.
- **Capa de datos:** `useCatalog` con actualización optimista y toast si la escritura falla, hidratación antes de mostrar pantallas, purga de favoritos huérfanos y migración v2→v3 con test.
- **Import:** validación estructural completa (límites de tamaño, profundidad de props, ids seguros, duplicados), `isCustom` forzado y fusión sin pisar las piezas base.
- **Arquitectura:** registro `BUILT_IN_RENDERERS` protegido por test, `sourceCode` con `?raw` (sin duplicados), pantallas y modales con `lazy` y aislados por `ErrorBoundary`.
- **CI:** lint + unitarios + build, y E2E contra el build de producción con trazas guardadas.

---

## 4. Plan de cierre para hoy (~4 h)

Orden pensado para que cada bloque deje el repo en un estado publicable.

| # | Bloque | Hallazgos | Tiempo |
|---|---|---|---|
| 1 | **Preparar el entorno**: clonar el repo real, Node 24, `npm ci`, `npx playwright install chromium`. Ejecutar la verificación completa (abajo) **antes de tocar nada**, para tener una línea base | — | 20 min |
| 2 | **Protección de datos**: texto del reset, portapapeles, limitaciones del export documentadas en el README y en el modal, copy del modal | C-1 (mínimo), C-2, M-2, M-6 | 45 min |
| 3 | **Inspector**: montaje visible fuera de pantalla, conservar el `style` del raíz, varios elementos raíz, regenerar la instantánea (`npx playwright test pestanas --update-snapshots`) revisando el diff | C-3, M-1 | 60 min |
| 4 | **UX rápida**: registro unificado, botón Eliminar accesible, `alert` → toast | M-3, M-4, M-7 | 45 min |
| 5 | *(opcional)* Escape y foco en los modales | M-5 | 45 min |
| 6 | **Release**: versión, engines, CHANGELOG, nota en ESTADO_PROYECTO, favicon/meta, despliegue, backlog B-* anotado | H-1…H-5 | 45 min |
| 7 | **Verificación final + tag** `v1.0.0` y comprobar la CI en verde en GitHub | H-6 | 20 min |

**Verificación final (todo debe pasar):**

```bash
npm ci
npm run lint
npm test
npm run build
E2E_PROD=1 npm run test:e2e
```

Además, una **prueba manual de humo** de 10 minutos en el build (`npm run preview`):
1. Capturar un snippet con `style` inline en el raíz → las medidas no son 0 y el estilo se conserva.
2. Iterar una pieza base, poner un favorito y una etiqueta → exportar → abrir en una ventana privada → importar → comprobar que lo que se pierde es exactamente lo que dice el README.
3. Restablecer → el aviso menciona el número de piezas.
4. Tema claro y oscuro en Inicio, Biblioteca y el modal de exportación.
5. Sin conexión (DevTools → Offline): una pieza capturada se ve con estilos.

## 5. Criterios de "hecho"

- [ ] C-1 (al menos el arreglo mínimo), C-2 y C-3 resueltos.
- [ ] `lint`, `test`, `build` y los E2E en verde, en local y en la CI de `master`.
- [ ] Prueba de humo completada.
- [ ] README y CHANGELOG reflejan la v1.0.0; `ESTADO_PROYECTO.md` marcado como histórico.
- [ ] Backlog B-1…B-10 (y los M que no se hagan) anotado como post-1.0.
- [ ] `package.json` en `1.0.0` y tag `v1.0.0` publicado.
