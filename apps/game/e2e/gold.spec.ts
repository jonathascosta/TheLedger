import { expect, test } from '@playwright/test';

test('with the Gold Edition a sponsor is granted with a tap, no ad', async ({ page, context }) => {
  const pt = test.info().project.name.endsWith('-pt');
  await page.goto('./');
  await page.waitForFunction(() => localStorage.getItem('theledger.save'));
  const save = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { businesses: unknown[] };
        meta: { gold: boolean };
        lastTick: number;
      },
  );
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.meta.gold = true;
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
  await expect(second.locator('.gold-ribbon')).toHaveCount(1);
  const offer = second.locator('.sponsor', {
    has: second.locator('.sponsor-title', { hasText: pt ? 'Patrocínio' : 'Sponsorship' }),
  });
  await expect(offer.locator('.sponsor-mark')).toHaveText(pt ? 'EDIÇÃO DE OURO' : 'GOLD EDITION');
  await offer.locator('.sponsor-btn').click();
  await expect(second.locator('.test-ad')).toHaveCount(0);
  await expect(offer).toContainText(pt ? /×2 ativo/ : /×2 on/);
});
