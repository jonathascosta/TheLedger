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
    level2: pt ? /nív\. 2\b/ : /lvl 2\b/,
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
  // Buy the café's second level.
  const buy = row.locator('.buy-btn');
  await expect(buy).toBeEnabled({ timeout: 10_000 });
  await buy.click();
  await expect(row).toContainText(w.level2);
  // The save survives a reload: the café is still open, at level 2.
  await page.reload();
  await expect(page.locator('.biz').first()).toContainText(w.level2);
  await expect(page.locator('.biz .bar-btn')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the cash stays in sight when the page scrolls', async ({ page }) => {
  // A short window, so a new game's ledger has something to scroll.
  await page.setViewportSize({ width: 375, height: 420 });
  await page.goto('./');
  const strip = page.locator('.cash-strip');
  await expect(strip).not.toHaveClass(/\bon\b/);
  await page.locator('.scroll').evaluate((e) => e.scrollTo(0, 300));
  await expect(strip).toHaveClass(/\bon\b/);
  await expect(strip).toContainText('$');
  await page.locator('.scroll').evaluate((e) => e.scrollTo(0, 0));
  await expect(strip).not.toHaveClass(/\bon\b/);
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
  const cash = (): Promise<number> =>
    second.evaluate(
      () =>
        (
          JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
            volume?: { cash?: number };
          }
        ).volume?.cash ?? 0,
    );
  const before = await cash();
  await modal.getByRole('button').click();
  await expect(modal).toHaveCount(0);
  // The receipt's money reaches the cash (saved within half a second).
  await expect.poll(cash, { timeout: 5000 }).toBeGreaterThan(before + 1000);
  expect(errors).toEqual([]);
});

test('the Classifieds dot shows only when an applicant can be paid', async ({ browser }) => {
  const pt = test.info().project.name.endsWith('-pt');
  /** A game with the café managed and the bakery open (its applicant asks $15,000). */
  async function dotWith(cash: number): Promise<number> {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL ?? '',
      locale: pt ? 'pt-BR' : 'en-US',
    });
    const first = await context.newPage();
    await first.goto('./');
    await first.waitForFunction(() => localStorage.getItem('theledger.save'));
    const save = await first.evaluate(
      () =>
        JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
          volume: { businesses: unknown[]; managers: unknown[]; cash: number };
          lastTick: number;
        },
    );
    save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
    save.volume.businesses[1] = { level: 1, progress: 0, till: 0 };
    save.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 7 };
    save.volume.cash = cash;
    save.lastTick = Date.now();
    const page = await context.newPage();
    await page.addInitScript((text) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('theledger.save', text);
        sessionStorage.setItem('seeded', '1');
      }
    }, JSON.stringify(save));
    await first.close();
    await page.goto('./');
    const card = page
      .locator('.card-link')
      .filter({ hasText: pt ? /Classificados/ : /Classifieds/ });
    await expect(card).toBeVisible();
    const dots = await card.locator('.badge-dot').count();
    await context.close();
    return dots;
  }
  expect(await dotWith(2000)).toBe(0);
  expect(await dotWith(20_000)).toBe(1);
});

test('Open buys the first level in the ×100 mode', async ({ browser }) => {
  const pt = test.info().project.name.endsWith('-pt');
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL ?? '',
    locale: pt ? 'pt-BR' : 'en-US',
  });
  const first = await context.newPage();
  await first.goto('./');
  await first.waitForFunction(() => localStorage.getItem('theledger.save'));
  const save = await first.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { businesses: unknown[]; cash: number };
        settings: { buyMode: unknown };
        lastTick: number;
      },
  );
  // The café is open; the bakery's first level costs $60, a hundred levels far more.
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.cash = 1000;
  save.settings.buyMode = 100;
  save.lastTick = Date.now();
  const page = await context.newPage();
  await page.addInitScript((text) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('theledger.save', text);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(save));
  await first.close();
  await page.goto('./');
  const open = page.getByRole('button', { name: pt ? /^Abrir/ : /^Open/ });
  await expect(open).toBeEnabled();
  await open.click();
  await expect(page.locator('.biz').nth(1)).toContainText(pt ? /nív\. 1\b/ : /lvl 1\b/);
  await context.close();
});
