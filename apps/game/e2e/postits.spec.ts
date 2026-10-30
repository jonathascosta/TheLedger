import { expect, test } from '@playwright/test';

test('a post-it folds away, stays folded and comes back from Settings', async ({ page }) => {
  const pt = test.info().project.name.endsWith('-pt');
  await page.goto('./');
  await page
    .locator('.tabs')
    .getByRole('button', { name: pt ? /Bolsa/ : /Market/ })
    .click();
  const note = page.locator('.postit');
  await expect(note).toBeVisible();
  await expect(note).toContainText(pt ? /ações/ : /Shares/);
  await note.getByRole('button').click();
  await expect(note).toHaveCount(0);
  // Saved: still folded after a reload.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
              settings?: { postits?: string[] };
            }
          ).settings?.postits,
      ),
    )
    .toEqual(['stocks']);
  await page.reload();
  await page
    .locator('.tabs')
    .getByRole('button', { name: pt ? /Bolsa/ : /Market/ })
    .click();
  await expect(page.locator('.postit')).toHaveCount(0);
  // Settings brings them back.
  await page
    .locator('.tabs')
    .getByRole('button', { name: pt ? /Livro/ : /Ledger/ })
    .click();
  await page.getByRole('button', { name: pt ? /Ajustes/ : /Settings/ }).click();
  await page.getByRole('button', { name: pt ? /Trazer de volta/ : /Bring back/ }).click();
  await page
    .locator('.tabs')
    .getByRole('button', { name: pt ? /Bolsa/ : /Market/ })
    .click();
  await expect(page.locator('.postit')).toBeVisible();
});
