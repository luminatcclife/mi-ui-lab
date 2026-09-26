# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). El proyecto sigue [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-09-26

Primera versión cerrada. Recoge la hoja de ruta de `docs/ESTADO_PROYECTO.md` (§8-§9), la auditoría de cierre (`docs/AUDITORIA_CIERRE.md`) y el rediseño visual «papel y tinta».

### Seguridad
- El HTML capturado o importado se sanea con DOMPurify y solo se renderiza en un iframe `sandbox="allow-scripts"` con origen opaco.
- El JSON importado se valida estructuralmente (tamaños, ids, props JSON) y todo se marca como pieza propia.
- Cerrada una inyección de HTML en el documento del sandbox vía `accentColor`.

### Añadido
- Edición de piezas propias (`EditComponentModal`).
- Recordatorio de copia de seguridad en Inicio (30 días; posponible 7).
- `ErrorBoundary` por pieza, por pantalla y global.
- Tests: Vitest (utilidades, base de datos, hooks, componentes) y Playwright (flujos, pestañas, uso sin conexión) en CI.
- Favicon y `engines.node >= 24`.
- App de escritorio para macOS (Electron 44): `npm run app:build` genera `mi-ui-lab.app` y un `.dmg`. Carga el build desde `app://mi-ui-lab/`, con datos persistentes propios, una sola instancia y los enlaces externos en el navegador del sistema.

### Cambiado
- Nuevo aspecto «papel y tinta»: fondo crema, tinta cálida, rojo teja como color de marca y verde bosque y azul mar como apoyo; Fraunces para titulares y nombres de piezas, Source Sans 3 para el resto. Sin degradados ni brillos de neón.
- Temas «papel» (claro, por defecto) y «noche» (oscuro, solo si el sistema lo pide o lo eliges).
- La cabecera incluye la navegación entre Inicio, Biblioteca, Laboratorio y Playground.
- Inicio rediseñado: saludo, contadores y tres tarjetas numeradas; el aviso de copia pasa a ser una nota «Ojo».
- Biblioteca rediseñada: barra lateral con búsqueda, colección, categorías y etiquetas; cuadrícula de fichas con vista previa en vivo y acciones (Abrir, JSX, Comparar, Eliminar). Las piezas ya no se listan en la barra lateral, y las fichas ya no permiten cambiar de variante ni de tono (eso se hace en Playground).
- Playground rediseñado: lienzo punteado, código en una banda oscura y panel fijo «Ajusta la pieza» con variante, tono y props siempre visibles.
- Ficha de pieza rediseñada: cabecera con categoría, versión, descripción, etiquetas editables y acciones; pestañas Variantes, Código, Props, Tokens y Versiones con el mismo aspecto (la tabla de props ya no es siempre oscura).
- Laboratorio e Inspector rediseñados y con tema claro: se elige entre «Capturar HTML» y «A mano» con dos tarjetas; el Inspector muestra el HTML y sus dependencias a la izquierda, y la vista previa, la ficha técnica y el código TSX a la derecha, con un resumen y el botón de guardar. Guardar se hace en un panel lateral con fondo. Textos renombrados: «Analizar y previsualizar», «Vista previa», «Ficha técnica», «Código TSX», «Guardar en la biblioteca» y «Guardar pieza».
- Modales rediseñados con un marco común (`ModalFrame`): etiqueta, título en Fraunces, papel y botones píldora. Exportar agrupa exportar, importar y restablecer con notas «Ojo» y «Revisa»; Iteración elige versión con un control segmentado; Tokens muestra los colores, tipografía y radios reales de la app; el generador de paletas y el comparador usan pestañas accesibles (`role="tab"`). Textos renombrados: «Exportar e importar», «Nueva iteración», «Tokens y tipografía», «Generador de paletas», «Escala 50–950», «Armonías y neutros», «Vista y props», «Tokens y metadatos».
- Las piezas y sus tonos se muestran con la paleta original de Tailwind (`.piece-scope`), aunque la app tenga su propia paleta.
- IndexedDB (Dexie, esquema v3) como única fuente de verdad, con el hook `useCatalog`; los fallos de escritura se avisan.
- Tailwind del sandbox servido por la propia app (`@tailwindcss/browser`): las piezas capturadas se ven sin conexión.
- Registro `BUILT_IN_RENDERERS`; `sourceCode` de las piezas base importado con `?raw`.
- Pantallas y modales cargados bajo demanda (chunk principal de 872 kB a 392 kB).
- TypeScript `strict` y sin `any`.
- Los textos de la interfaz usan tuteo de forma uniforme.
- Los avisos de validación usan toasts en lugar de `alert()`.

### Corregido
- Import que hacía desaparecer piezas propias de la pantalla; favoritos fantasma o desincronizados; iteraciones de piezas base duplicadas al recargar; carrera de hidratación.
- Inspector: las medidas de la ficha técnica salían siempre 0 × 0; se perdía el `style` inline del elemento raíz; con varios elementos raíz solo se guardaba el primero (ahora se agrupan en un `<div>`).
- "Restablecer" avisa de cuántas piezas propias se borran y de que no se puede deshacer.
- "Copiar JSON" ya no cuenta como copia de seguridad si el portapapeles falla.
- El botón Eliminar pieza es accesible con teclado y en pantallas táctiles.
- Los modales se cierran con Escape, reciben el foco al abrirse, lo mantienen dentro y lo devuelven al cerrarse.

### Eliminado
- Restos de la plantilla de AI Studio/Gemini, `SearchBar.tsx`, la tabla `drafts` y dependencias sin uso.

### Limitaciones conocidas
- La copia JSON restaura solo las piezas propias: no incluye favoritos, etiquetas de piezas base ni iteraciones de piezas base.
- Ver también "Limitaciones conocidas" en el README y el backlog B-1…B-10 en `docs/AUDITORIA_CIERRE.md`.
