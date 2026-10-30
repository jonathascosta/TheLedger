import { expect, test } from '@playwright/test';

test('buying a sports club', async ({ page, context }) => {
  const pt = test.info().project.name.endsWith('-pt');
  await page.goto('./');
  await page.waitForFunction(() => localStorage.getItem('theledger.save'));
  const save = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { cash: number; peakNetWorth: number; businesses: unknown[] };
        lastTick: number;
      },
  );
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.cash = 2e12;
  save.volume.peakNetWorth = 2e12;
  save.lastTick = Date.now();
  const second = await context.newPage();
  await second.addInitScript((text) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('theledger.save', text);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(save));
  await page.close();
  await second.goto('./');
  await second
    .locator('.tabs')
    .getByRole('button', { name: pt ? /Carteira/ : /Portfolio/ })
    .click();
  await second.getByRole('button', { name: pt ? /Clubes esportivos/ : /Sports clubs/ }).click();
  const club = second.locator('.row', { hasText: pt ? 'Atlético Moinho' : 'Millbrook Athletic' });
  await club.getByRole('button', { name: pt ? /Comprar/ : /Buy/ }).click();
  await expect(club.getByRole('button', { name: pt ? /Vender/ : /Sell/ })).toBeVisible();
  await expect
    .poll(() =>
      second.evaluate(
        () =>
          (
            JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
              volume: { clubs: Record<string, { owned: boolean }> };
            }
          ).volume.clubs.millbrook?.owned,
      ),
    )
    .toBe(true);
});
