import { expect, Locator, Page, test } from '@playwright/test';
import { goTo } from './helpers';

// Red de seguridad para refactorizar las pantallas grandes (Inspector, Comparador, Generador de
// paletas): recorre cada pestaña y compara su texto visible con una instantánea. Si al mover una
// pestaña a su propio archivo se pierde un texto o un prop queda sin conectar, el test falla.

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
  await page.goto('/');
  await expect(page.getByText(/\d+ piezas · \d+ favoritas/)).toBeVisible();
});

/** Texto visible normalizado (sin horas, que cambian en cada ejecución). */
async function visibleText(locator: Locator): Promise<string> {
  const text = await locator.innerText();
  return text
    .replace(/\d{1,2}:\d{2}(:\d{2})?(\s?[ap]\.?\s?m\.?)?/gi, '<hora>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

async function snapshotTabs(page: Page, container: Locator, tabs: { name: string; button: Locator }[]) {
  for (const tab of tabs) {
    await tab.button.click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(await visibleText(container), `pestaña ${tab.name}`).toMatchSnapshot(`${tab.name}.txt`);
  }
}

test('Inspector: las tres pestañas del panel derecho', async ({ page }) => {
  await goTo(page, 'Laboratorio');
  await page.getByRole('button', { name: /Analizar & Renderizar Preview/ }).click();
  const panel = page.locator('#element-inspector-panel');
  await snapshotTabs(page, panel, [
    { name: 'inspector-preview', button: page.getByRole('button', { name: 'Live Preview Aislado' }) },
    { name: 'inspector-specs', button: page.getByRole('button', { name: 'Ficha Técnica & Tokens' }) },
    { name: 'inspector-tsx', button: page.getByRole('button', { name: 'Código React TSX' }) },
  ]);
});

test('Comparador: las tres pestañas', async ({ page }) => {
  await goTo(page, 'Biblioteca');
  await page.locator('#biblioteca-btn-open-compare').click();
  const view = page.locator('#comparison-view-container');
  await expect(view).toBeVisible();
  await snapshotTabs(page, view, [
    { name: 'compare-preview', button: page.locator('#tab-btn-compare-preview') },
    { name: 'compare-code', button: page.locator('#tab-btn-compare-code') },
    { name: 'compare-meta', button: page.locator('#tab-btn-compare-meta') },
  ]);
});

test('Generador de paletas: las cuatro pestañas', async ({ page }) => {
  await goTo(page, 'Biblioteca');
  await page.getByRole('button', { name: /^Abrir/ }).first().click();
  await page.getByRole('button', { name: /^Tokens/ }).last().click();
  await page.getByRole('button', { name: 'Generar Paleta' }).click();
  const modal = page.locator('#palette-generator-container');
  await expect(modal).toBeVisible();
  await snapshotTabs(page, modal, [
    { name: 'palette-shades', button: page.locator('#tab-btn-shades') },
    { name: 'palette-preview', button: page.locator('#tab-btn-preview') },
    { name: 'palette-harmonies', button: page.locator('#tab-btn-harmonies') },
    { name: 'palette-export', button: page.locator('#tab-btn-export') },
  ]);
});
