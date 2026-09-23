import { expect, test } from '@playwright/test';
import { importJson, piece } from './helpers';

// Bloqueo a nivel de red del navegador: todo host salvo localhost es irresoluble. (page/context.route
// no intercepta las peticiones del iframe sandbox con origen opaco, así que no sirve para simularlo.)
test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'] } });

test('sin conexión, las piezas capturadas siguen teniendo estilos (Tailwind lo sirve la app)', async ({ page }) => {
  await page.goto('/');
  await importJson(page, [piece('offline', 'Offline', '<div class="p-4 rounded-xl bg-fuchsia-600 text-white">Sin red</div>')]);
  await page.locator('#cat-filter-custom').click();
  const frame = page.frameLocator('iframe[title="Vista previa aislada: Offline"]');
  await expect(frame.getByText('Sin red')).toBeVisible();
  await expect(frame.locator('div.bg-fuchsia-600')).toHaveCSS('background-color', /oklch|rgb\(192, 38, 211\)/);
});
