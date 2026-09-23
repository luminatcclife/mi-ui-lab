import { Page } from '@playwright/test';

export const goHome = (page: Page) => page.getByRole('button', { name: /mi-ui-lab/i }).first().click();
export const goTo = (page: Page, screen: 'Biblioteca' | 'Laboratorio' | 'Playground') =>
  page.getByRole('button', { name: new RegExp(`^\\s*${screen}`) }).first().click();

export async function importJson(page: Page, data: unknown) {
  await goTo(page, 'Biblioteca');
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  await page.getByPlaceholder('Pega aquí el JSON con la colección...').fill(JSON.stringify(data));
  await page.getByRole('button', { name: 'Cargar e Integrar Piezas' }).click();
}

export const piece = (id: string, name: string, rawHtml?: string) => ({ id, name, category: 'cards', rawHtml });

/** Lee una pieza guardada directamente de IndexedDB (lo que sobrevive a una recarga). */
export const storedPiece = (page: Page, id: string) =>
  page.evaluate(
    (pieceId) =>
      new Promise<{ name?: string; category?: string } | undefined>((resolve) => {
        const rq = indexedDB.open('MiUILabDatabase');
        rq.onsuccess = () => {
          const get = rq.result.transaction('customComponents').objectStore('customComponents').get(pieceId);
          get.onsuccess = () => {
            rq.result.close();
            resolve(get.result);
          };
        };
      }),
    id,
  );
