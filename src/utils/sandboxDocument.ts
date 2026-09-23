// src/utils/sandboxDocument.ts
// Construye el documento `srcDoc` de los iframes aislados donde se renderiza HTML capturado.
// El iframe se monta con sandbox="allow-scripts" (sin allow-same-origin): corre en un origen opaco,
// así que ni el snippet ni el Tailwind Play CDN pueden tocar el DOM, IndexedDB o localStorage de la app.

export type SandboxTheme = 'dark' | 'light' | 'checkerboard';

export interface SandboxDocumentOptions {
  /** HTML ya saneado con sanitizeHtml(). */
  html: string;
  theme: SandboxTheme;
  /** 'pattern' = lienzo con puntos/cuadrícula (Inspector); 'transparent' = se funde con la tarjeta anfitriona. */
  background?: 'pattern' | 'transparent';
  /** Clases Tailwind del contenedor del snippet (se generan en runtime por el CDN, admite clases dinámicas). */
  wrapperClass?: string;
  /** Rellena el alto del viewport (Inspector) o se ajusta al contenido (tarjetas de Biblioteca/Playground). */
  fillViewport?: boolean;
  /** Inyecta el puente postMessage: reporta el alto del contenido y los clics en botones/enlaces. */
  bridge?: boolean;
}

/** Mensajes que el iframe envía al padre cuando `bridge` está activo. */
export type SandboxMessage =
  | { source: 'mi-ui-lab-sandbox'; type: 'resize'; height: number }
  | { source: 'mi-ui-lab-sandbox'; type: 'click'; label: string };

function backgroundCss(theme: SandboxTheme, background: 'pattern' | 'transparent'): string {
  if (background === 'transparent') return 'background: transparent;';
  if (theme === 'checkerboard') {
    return `
        background-color: #18181b;
        background-image:
          linear-gradient(45deg, #27272a 25%, transparent 25%),
          linear-gradient(-45deg, #27272a 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #27272a 75%),
          linear-gradient(-45deg, transparent 75%, #27272a 75%);
        background-size: 16px 16px;
        background-position: 0 0, 0 8px, 8px -8px, -8px 0px;`;
  }
  if (theme === 'dark') {
    return `
        background-color: #09090b;
        background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        background-size: 18px 18px;`;
  }
  return `
        background-color: #ffffff;
        background-image: radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 18px 18px;`;
}

const BRIDGE_SCRIPT = `
  <script>
    (function () {
      var post = function (msg) { msg.source = 'mi-ui-lab-sandbox'; parent.postMessage(msg, '*'); };
      var root = document.getElementById('preview-root');
      var last = 0;
      var report = function () {
        var h = Math.ceil(document.documentElement.scrollHeight);
        if (h !== last) { last = h; post({ type: 'resize', height: h }); }
      };
      new ResizeObserver(report).observe(root);
      window.addEventListener('load', report);
      document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest ? e.target.closest('button, a, [role="button"]') : null;
        if (!el) return;
        e.preventDefault();
        post({ type: 'click', label: (el.textContent || '').trim().slice(0, 25) || 'Acción' });
      });
    })();
  </script>`;

export function buildSandboxDocument({
  html,
  theme,
  background = 'pattern',
  wrapperClass = '',
  fillViewport = true,
  bridge = false,
}: SandboxDocumentOptions): string {
  const isDark = theme === 'dark' || theme === 'checkerboard';

  return `<!DOCTYPE html>
<html lang="es" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- Tailwind Play CDN for isolated runtime styling of ANY class -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    *, ::before, ::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      ${fillViewport ? 'min-height: 100vh;' : ''}
      overflow-x: hidden;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${fillViewport ? '2.5rem 1.5rem' : '0.5rem'};
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      ${backgroundCss(theme, background)}
      color: ${isDark ? '#f4f4f5' : '#18181b'};
      transition: background-color 0.2s ease, color 0.2s ease;
      /* Variables de respaldo habituales en componentes web modernos */
      --t1: currentColor;
      --t2: rgba(161, 161, 170, 0.9);
      --t3: rgba(161, 161, 170, 0.7);
      --btn-bg: rgba(255, 255, 255, 0.08);
      --btn-text: currentColor;
    }
    #preview-root {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      ${fillViewport ? 'width: fit-content;' : 'width: 100%;'}
      margin: auto;
    }
  </style>
</head>
<body>
  <div id="preview-root">
    ${wrapperClass ? `<div class="${wrapperClass}">${html}</div>` : html}
  </div>${bridge ? BRIDGE_SCRIPT : ''}
</body>
</html>`;
}
