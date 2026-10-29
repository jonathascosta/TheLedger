import { expect, test, type Page } from '@playwright/test';

/** Words that differ between the two locales. */
function words(page: Page) {
  const pt = test.info().project.name.endsWith('-pt');
  return {
    desk: pt ? /Recepção/ : /Front desk/,
    stamp: pt ? /Carimbar/ : /Stamp the invoice/,
    back: pt ? /Voltar/ : /Back/,
    open: pt ? /^Abrir/ : /^Open/,
    collect: pt ? /Recolher/ : /Collect/,
    tabs: pt
      ? [/Livro/, /Bolsa/, /Carteira/, /Conquistas/]
      : [/Ledger/, /Market/, /Portfolio/, /Achievements/],
    page,
  };
}

function noErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

test('the first session: stamp, open the café, collect, buy', async ({ page }) => {
  const errors = noErrors(page);
  const w = words(page);
  await page.goto('./');
  await page.getByRole('button', { name: w.desk }).click();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: w.stamp }).click();
  await page.getByRole('button', { name: w.back }).click();
  await page.getByRole('button', { name: w.open }).first().click();
  // The café's till fills in a second; the bar turns into the Collect button.
  const collect = page.getByRole('button', { name: w.collect });
  await expect(collect.first()).toBeVisible({ timeout: 5000 });
  await collect.first().click();
  await expect(page.locator('.bar-btn.full')).toHaveCount(0);
  // The row keeps its shape whatever the till does.
  const row = page.locator('.biz').first();
  const before = await row.boundingBox();
  await expect(page.locator('.bar-btn.full')).toHaveCount(1, { timeout: 5000 });
  const after = await row.boundingBox();
  expect(after?.height).toBe(before?.height);
  // The save survives a reload.
  await page.reload();
  await expect(page.locator('.biz').first()).toContainText(/1/);
  expect(errors).toEqual([]);
});

test('every tab opens without errors', async ({ page }) => {
  const errors = noErrors(page);
  const w = words(page);
  await page.goto('./');
  for (const tab of w.tabs) {
    await page.locator('.tabs').getByRole('button', { name: tab }).click();
    await expect(page.locator('.tab.on')).toContainText(tab);
    await expect(page.locator('.scroll')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('an absence prints a receipt that collects', async ({ page, context }) => {
  const errors = noErrors(page);
  await page.goto('./');
  const save = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { businesses: unknown[]; managers: unknown[] };
        lastTick: number;
      },
  );
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 7 };
  save.lastTick = Date.now() - 3600_000;
  const second = await context.newPage();
  await second.addInitScript((text) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('theledger.save', text);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(save));
  await page.close();
  second.on('pageerror', (e) => errors.push(String(e)));
  await second.goto('./');
  const modal = second.locator('.modal');
  await expect(modal).toBeVisible();
  await modal.getByRole('button').click();
  await expect(modal).toHaveCount(0);
  expect(errors).toEqual([]);
});
