import { defineConfig, devices } from '@playwright/test';

// E2E de los flujos completos contra el servidor de Vite. Cada test corre en un contexto nuevo,
// así que parte de una IndexedDB vacía. Sin el Chromium de Playwright descargado, se puede usar
// el Chrome instalado: PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
const PORT = 5174;
// E2E_PROD=1 prueba el build de producción (vite build + preview), que es lo que se publica; la CI lo usa.
const PROD = process.env.E2E_PROD === '1';
// E2E_BASE_URL=https://… prueba una web ya publicada (p. ej. la de Vercel): no se levanta ningún servidor.
const REMOTE = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  // Las instantáneas son de texto: iguales en cualquier SO, sin sufijo de plataforma
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  fullyParallel: true,
  // Cada test abre su Chrome y compila Tailwind dentro del iframe: con muchos workers en una máquina
  // cargada, los tests se quedan sin tiempo (fallos aleatorios por timeout). La CI usa el valor por defecto.
  workers: process.env.CI ? undefined : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: REMOTE || `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    viewport: { width: 1400, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 }, channel: process.env.PLAYWRIGHT_CHANNEL },
    },
  ],
  webServer: REMOTE
    ? undefined
    : {
        command: PROD
          ? `npm run build && npx vite preview --port ${PORT} --strictPort`
          : `npx vite --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
