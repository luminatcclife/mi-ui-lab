import { expect, Page, test } from '@playwright/test';

// Cualquier alert()/confirm() inesperado o error de página hace fallar el test.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
  await page.goto('/');
  await expect(page.getByText(/\d+ piezas · \d+ favoritas/)).toBeVisible();
});

const goHome = (page: Page) => page.getByRole('button', { name: /mi-ui-lab/i }).first().click();
const goTo = (page: Page, screen: 'Biblioteca' | 'Laboratorio' | 'Playground') =>
  page.getByRole('button', { name: new RegExp(`^\\s*${screen}`) }).first().click();

async function importJson(page: Page, data: unknown) {
  await goTo(page, 'Biblioteca');
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  await page.getByPlaceholder('Pega aquí el JSON con la colección...').fill(JSON.stringify(data));
  await page.getByRole('button', { name: 'Cargar e Integrar Piezas' }).click();
}

const piece = (id: string, name: string, rawHtml?: string) => ({ id, name, category: 'cards', rawHtml });

test('Inicio muestra el catálogo base con favoritos válidos', async ({ page }) => {
  await expect(page.getByText('8 piezas · 2 favoritas')).toBeVisible();
  await expect(page.getByText('0 piezas propias')).toBeVisible();
});

test('capturar HTML → guardar → se ve en Biblioteca (aislado) y persiste al recargar', async ({ page }) => {
  await goTo(page, 'Laboratorio');
  await page
    .getByPlaceholder(/^<button class='rounded-xl/)
    .fill('<div class="p-6 rounded-2xl bg-fuchsia-600 text-white"><h3 class="font-bold">Tarjeta E2E</h3></div>');
  await page.getByRole('button', { name: /Analizar & Renderizar Preview/ }).click();
  await page.locator('#btn-inspector-save-to-library').click();
  await page.getByPlaceholder(/Ej: PricingCard/).fill('Tarjeta E2E');
  await page.getByRole('button', { name: /Confirmar y Guardar en BD/ }).click();

  await goHome(page);
  await expect(page.getByText('1 piezas propias')).toBeVisible();

  await goTo(page, 'Biblioteca');
  await page.locator('#cat-filter-custom').click();
  const frame = page.frameLocator('iframe[title="Vista previa aislada: Tarjeta E2E"]');
  await expect(frame.getByText('Tarjeta E2E')).toBeVisible();
  // Clases que el build de la app no genera: el CDN del iframe sí las aplica
  await expect(frame.locator('div.bg-fuchsia-600')).toHaveCSS('background-color', /rgb\(192, 38, 211\)|oklch/);

  await page.reload();
  await expect(page.getByText('1 piezas propias')).toBeVisible();
});

test('un JSON importado con HTML malicioso no ejecuta código y reporta lo inválido', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => {
    dialogs++;
    void d.dismiss();
  });
  await importJson(page, [
    piece('accent-card', 'base, se omite'),
    piece(
      'xss',
      'XSS',
      '<div>Hola<img src=x onerror="window.top.__pwned=1"><button onclick="parent.__pwned=2">b</button><script>parent.__pwned=3</script></div>',
    ),
    { name: 'sin id' },
  ]);
  await expect(page.locator('#import-validation-errors')).toContainText('"id" ausente');
  await page.locator('#export-modal-container button').first().click();

  await page.locator('#cat-filter-custom').click();
  await expect(page.frameLocator('iframe[title="Vista previa aislada: XSS"]').getByText('Hola')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  expect(dialogs).toBe(0);
});

test('editar una pieza propia persiste tras recargar', async ({ page }) => {
  await importJson(page, [piece('editable', 'Antes', '<div class="p-4">Contenido</div>')]);
  // Sin errores de validación, el modal de import se cierra solo
  await expect(page.locator('#export-modal-container')).toHaveCount(0);
  await page.locator('#cat-filter-custom').click();
  await page.getByRole('button', { name: /^Abrir/ }).first().click();

  await page.locator('#btn-edit-component-detail').click();
  await page.locator('#edit-name').fill('Después');
  await page.locator('#edit-category').selectOption('buttons');
  await page.locator('#btn-save-edit').click();
  await expect(page.getByRole('heading', { name: 'Después' })).toBeVisible();

  await page.reload();
  await goTo(page, 'Biblioteca');
  await page.locator('#cat-filter-buttons').click();
  await expect(page.getByText('Después').first()).toBeVisible();
});

test('las piezas base no se pueden editar', async ({ page }) => {
  await goTo(page, 'Biblioteca');
  await page.getByRole('button', { name: /^Abrir/ }).first().click();
  await expect(page.locator('#btn-iterate-version-detail')).toBeVisible();
  await expect(page.locator('#btn-edit-component-detail')).toHaveCount(0);
});

test('una pieza corrupta en IndexedDB muestra su error y no tumba la Biblioteca', async ({ page }) => {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const rq = indexedDB.open('MiUILabDatabase');
        rq.onsuccess = () => {
          const tx = rq.result.transaction('customComponents', 'readwrite');
          tx.objectStore('customComponents').put({
            id: 'rota', name: 'Pieza Rota', tagline: '', description: '', category: 'cards', sourceCode: '',
            usageSnippet: { mal: true }, variants: [], props: [], tokensUsed: [], tags: [], isCustom: true,
          });
          tx.oncomplete = () => {
            rq.result.close();
            resolve();
          };
        };
      }),
  );
  page.removeAllListeners('pageerror'); // el error de render queda contenido; React lo reporta por consola
  await page.reload();
  await goTo(page, 'Biblioteca');
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo renderizar "Pieza Rota"' })).toBeVisible();
  await expect(page.locator('#cat-filter-all')).toContainText('9');
});

test('Playground carga una pieza sin errores', async ({ page }) => {
  await goTo(page, 'Playground');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(/Variante|Props/i);
});
