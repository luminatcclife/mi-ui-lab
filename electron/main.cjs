// electron/main.cjs
// App de escritorio: sirve el build de Vite (dist/) desde un protocolo propio, app://mi-ui-lab/.
// Se usa en lugar de file:// porque:
//  - el origen es fijo, así que IndexedDB (la colección) persiste siempre en el mismo sitio;
//  - los módulos ES y las rutas absolutas del build (/assets/…) funcionan igual que en la web;
//  - el iframe aislado (sandbox, origen opaco) puede cargar el Tailwind que sirve la app.
// Los datos viven en ~/Library/Application Support/mi-ui-lab, separados de los del navegador:
// para pasar una colección de la web a la app, usa Exportar/Importar.

const { app, BrowserWindow, protocol, net, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const HOST = 'mi-ui-lab';
const APP_URL = `${SCHEME}://${HOST}/`;
const DIST_DIR = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

/** Resuelve una URL app:// a un archivo de dist/, sin permitir salir de la carpeta. */
function resolveDistFile(requestUrl) {
  const { pathname } = new URL(requestUrl);
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
  const filePath = path.normalize(path.join(DIST_DIR, relative));
  if (filePath !== DIST_DIR && !filePath.startsWith(DIST_DIR + path.sep)) return null;
  return filePath;
}

function registerAppProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const filePath = resolveDistFile(request.url);
    if (!filePath) return new Response('Prohibido', { status: 403 });
    const response = await net.fetch(pathToFileURL(filePath).toString());
    // El iframe de las piezas tiene origen opaco: necesita CORS para cargar el Tailwind de la app.
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(response.body, { status: response.status, headers });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'mi-ui-lab',
    backgroundColor: '#fbf6ec',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Enlaces externos (p. ej. documentación) en el navegador del sistema, nunca dentro de la app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL(APP_URL);
}

// Una sola instancia: dos ventanas escribiendo en la misma IndexedDB podrían pisarse.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    registerAppProtocol();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
