import { defineConfig, devices } from '@playwright/test';

// E2E de los flujos completos contra el servidor de Vite. Cada test corre en un contexto nuevo,
// así que parte de una IndexedDB vacía. Sin el Chromium de Playwright descargado, se puede usar
// el Chrome instalado: PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
const PORT = 5174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    viewport: { width: 1400, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 }, channel: process.env.PLAYWRIGHT_CHANNEL },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
