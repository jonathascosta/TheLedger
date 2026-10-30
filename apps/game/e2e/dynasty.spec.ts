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
  await expect(second.locator('.page').first()).toContainText(/Era\sII · \S+ \S+ · Vol\.\sI/);
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

test('the newspaper keeps the founder ink in every era', async ({ page, context }) => {
  await page.goto('./');
  await page.waitForFunction(() => localStorage.getItem('theledger.save'));
  const save = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { businesses: unknown[]; peakNetWorth: number; cash: number };
        meta: { era: number };
        lastTick: number;
      },
  );
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.peakNetWorth = 1e6;
  save.meta.era = 4;
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
  await expect(second.locator('html')).toHaveAttribute('data-era', '4');
  const pt = test.info().project.name.endsWith('-pt');
  await second.getByRole('button', { name: pt ? /A Gazeta/ : /The Gazette/ }).click();
  const paper = second.locator('.page.newsprint');
  await expect(paper).toBeVisible();
  // The founder's ink (#1f2a44), not era IV's ballpoint blue.
  await expect(paper).toHaveCSS('color', 'rgb(31, 42, 68)');
  await expect(paper.locator('.masthead').first()).toHaveCSS('color', 'rgb(31, 42, 68)');
});
