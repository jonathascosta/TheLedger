import { expect, test } from '@playwright/test';

test('retiring hands the book to an heir in era II', async ({ page, context }) => {
  const pt = test.info().project.name.endsWith('-pt');
  await page.goto('./');
  await page.waitForFunction(() => localStorage.getItem('theledger.save'));
  const save = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { businesses: unknown[] };
        meta: { goodwillClaimed: number; lifetimeEarnings: number; goodwill: number };
        lastTick: number;
      },
  );
  save.volume.businesses[0] = { level: 30, progress: 0, till: 0 };
  save.meta.goodwillClaimed = 1000;
  save.meta.goodwill = 400;
  save.meta.lifetimeEarnings = (1000 / 150) ** 2 * 1e15;
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
  await expect(second.locator('html')).toHaveAttribute('data-era', '1');
  await second.getByRole('button', { name: pt ? /Sócios/ : /Partners/ }).click();
  await second
    .getByRole('button', { name: pt ? /Aposentar-se/ : /Retire/ })
    .first()
    .click();
  // 31 legacy points: business profit ×7.2.
  await expect(second.locator('.dotted').first()).toContainText('+31');
  await second.locator('.stamp-btn.red').click();
  await expect(second.locator('h1')).toContainText(pt ? 'Começa a era II' : 'Era II begins');
  await expect(second.locator('html')).toHaveAttribute('data-era', '2');
  await second.locator('.stamp-btn.green').click();
  await expect(second.locator('.page').first()).toContainText(/Era II · \S+ \S+ · Vol\. I/);
  const meta = () =>
    second.evaluate(
      () =>
        (
          JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
            meta: { era: number; legacy: number };
          }
        ).meta,
    );
  await expect.poll(meta).toMatchObject({ era: 2, legacy: 31 });
});
