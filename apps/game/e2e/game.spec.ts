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

test('the cash stays in sight on every page, scrolled or not', async ({ page }) => {
  // A short window, so a new game's ledger has something to scroll.
  await page.setViewportSize({ width: 375, height: 420 });
  await page.goto('./');
  const strip = page.locator('.cash-strip');
  await expect(strip).toBeVisible();
  await expect(strip).toContainText('$');
  const box = await strip.boundingBox();
  expect(box?.y).toBe(0);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await page.locator('.scroll').evaluate((e) => e.scrollTo(0, 300));
  expect((await strip.boundingBox())?.y).toBe(0);
  // Every tab has it too.
  for (const tab of await page.locator('.tabs button').all()) {
    await tab.click();
    await expect(page.locator('.cash-strip')).toBeVisible();
  }
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

test('Open follows the buy mode, with its count and price on the button', async ({ browser }) => {
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
  // The café is open; ten bakery levels cost about $1,218.
  // The café is open.
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.cash = 2000;
  save.settings.buyMode = 10;
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
  const open = page.getByRole('button', { name: pt ? /^Abrir ×10/ : /^Open ×10/ });
  await expect(open).toBeEnabled();
  await open.click();
  await expect(page.locator('.biz').nth(1)).toContainText(pt ? /nív\. 10\b/ : /lvl 10\b/);
  // The six modes stay pinned under the cash strip while the ledger scrolls well past them.
  const modes = page.locator('.buy-modes');
  await expect(modes.getByRole('button')).toHaveCount(6);
  // A short window, so the ledger scrolls well past the row's own place.
  await page.setViewportSize({ width: 375, height: 420 });
  const scroll = page.locator('.scroll');
  const top = (await scroll.boundingBox())!.y;
  const before = (await modes.boundingBox())!.y - top;
  await scroll.evaluate((e) => e.scrollTo(0, e.scrollHeight));
  expect(await scroll.evaluate((e) => e.scrollTop)).toBeGreaterThan(before);
  await expect.poll(async () => (await modes.boundingBox())!.y).toBeCloseTo(top, 0);
  await context.close();
});

test("the café's first order: ready on its row, bought on the Upgrades page", async ({
  browser,
}) => {
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
        volume: { businesses: unknown[]; cash: number; upgrades: string[] };
        lastTick: number;
      },
  );
  await first.close();
  // Every cheaper upgrade bought, so the order is the only one the cash reaches.
  save.volume.upgrades = [
    ...['cafe.0', 'cafe.1', 'cafe.2', 'cafe.3', 'cafe.4', 'cafe.5'],
    ...['desk.0', 'desk.1', 'desk.2', 'desk.3', 'desk.4', 'all.0'],
  ];
  save.volume.cash = 2e10;
  async function at(level: number) {
    save.volume.businesses[0] = { level, progress: 0, till: 0 };
    save.lastTick = Date.now();
    const page = await context.newPage();
    await page.addInitScript((text) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('theledger.save', text);
        sessionStorage.setItem('seeded', '1');
      }
    }, JSON.stringify(save));
    await page.goto('./');
    return page;
  }
  const card = (page: Page) =>
    page.locator('.card-link').filter({ hasText: pt ? /Melhorias/ : /Upgrades/ });
  // One level short: the order is locked, so nothing is on offer.
  const early = await at(299);
  await expect(early.locator('.biz').first().locator('.order-mark')).toHaveText(
    pt ? /nív\. 300/ : /lvl 300/,
  );
  await expect(card(early).locator('.badge-dot')).toHaveCount(0);
  // A locked order's mark opens the café's page too.
  await early.locator('.biz').first().locator('.order-mark').click();
  await expect(early.locator('h1')).toContainText(pt ? /Café da Esquina/ : /Corner Café/);
  await early.close();
  const page = await at(300);
  const cafe = page.locator('.biz').first();
  await expect(cafe.locator('.order-mark.ready')).toHaveText(
    pt ? /encomenda pronta/ : /order ready/,
  );
  await expect(card(page).locator('.badge-dot')).toHaveCount(1);
  // The mark opens the café's page, where the order is on offer.
  await cafe.locator('.order-mark').click();
  await expect(page.locator('h1')).toContainText(pt ? /Café da Esquina/ : /Corner Café/);
  await expect(
    page.locator('.check').filter({ hasText: pt ? /Contrato com os escritórios/ : /Office/ }),
  ).toBeEnabled();
  await page.getByRole('button', { name: pt ? /Voltar/ : /Back/ }).click();
  await card(page).click();
  const row = page
    .locator('.row')
    .filter({ hasText: pt ? /Contrato com os escritórios/ : /Office catering contract/ });
  await expect(row).toContainText('×8');
  await row.getByRole('button').click();
  await page.getByRole('button', { name: pt ? /Voltar/ : /Back/ }).click();
  await expect(cafe.locator('.order-mark')).toHaveText(pt ? /nív\. 500/ : /lvl 500/);
  await context.close();
});

test('a running trend shows its headline and the badge on its row', async ({ browser }) => {
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
        volume: { businesses: unknown[]; trend: unknown };
        lastTick: number;
      },
  );
  await first.close();
  const now = Date.now();
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.businesses[1] = { level: 10, progress: 0, till: 0 };
  save.volume.trend = {
    count: 1,
    nextAt: now + 20 * 60_000,
    business: 0,
    factor: 50,
    until: now + 4 * 60_000,
    recent: [0],
  };
  save.lastTick = now;
  const page = await context.newPage();
  await page.addInitScript((text) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('theledger.save', text);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(save));
  await page.goto('./');
  await expect(page.locator('.trend-headline')).toContainText(
    pt ? /Café coado virou febre/ : /Filter coffee is all the rage/,
  );
  await expect(page.locator('.biz').first().locator('.trend-badge')).toContainText('×50');
  await expect(page.locator('.biz').nth(1).locator('.trend-badge')).toHaveCount(0);
  await context.close();
});

test('the closing page shows the next goodwill point only while it takes over a minute', async ({
  browser,
}) => {
  const pt = test.info().project.name.endsWith('-pt');
  async function closing(level: number) {
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
          volume: { businesses: unknown[]; managers: unknown[] };
          meta: { lifetimeEarnings: number };
          lastTick: number;
        },
    );
    await first.close();
    // 20 goodwill to claim and a quarter of the way to the next point.
    save.meta.lifetimeEarnings = 1e15 * (20.25 / 150) ** 2;
    save.volume.businesses[9] = { level, progress: 0, till: 0 };
    save.volume.businesses[0] = { level: 1, progress: 0, till: 0 };
    save.volume.managers[9] = { name: 'Rosa M.', trait: 'perfectionist', face: 1 };
    save.lastTick = Date.now();
    const page = await context.newPage();
    await page.addInitScript((text) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('theledger.save', text);
        sessionStorage.setItem('seeded', '1');
      }
    }, JSON.stringify(save));
    await page.goto('./');
    await page.getByRole('button', { name: pt ? /Fechar o volume/ : /Close the volume/ }).click();
    const shown = page.locator('.goodwill-next');
    return { context, shown };
  }
  // A slow income: a point takes hours, so its bar shows.
  const slow = await closing(0);
  await expect(slow.shown).toContainText(pt ? /Próximo ponto de goodwill/ : /Next goodwill point/);
  await slow.context.close();
  // The airline at level 2000: a point takes seconds, so no bar.
  const fast = await closing(2000);
  await expect(fast.shown).toHaveCount(0);
  await fast.context.close();
});

test("an instrument's chart marks the price paid, or an arrow when it is out of range", async ({
  browser,
}) => {
  const pt = test.info().project.name.endsWith('-pt');
  async function chart(paid: number) {
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
          volume: {
            peakNetWorth: number;
            holdings: Record<string, { units: number; cost: number }>;
            market: { prices: Record<string, number>; history: Record<string, number[]> };
          };
          lastTick: number;
        },
    );
    await first.close();
    const price = save.volume.market.prices.nmtc!;
    save.volume.peakNetWorth = 2e5;
    save.volume.market.history.nmtc = [price * 0.9, price * 1.1, price];
    save.volume.holdings = { nmtc: { units: 2, cost: 2 * paid * price } };
    save.lastTick = Date.now();
    const page = await context.newPage();
    await page.addInitScript((text) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('theledger.save', text);
        sessionStorage.setItem('seeded', '1');
      }
    }, JSON.stringify(save));
    await page.goto('./');
    await page
      .locator('.tabs')
      .getByRole('button', { name: pt ? /Bolsa/ : /Market/ })
      .click();
    await page.getByRole('button', { name: /NMTC/ }).click();
    return { context, mark: page.locator('.chart-reference') };
  }
  // Paid inside the range: a dashed line and its label.
  const inside = await chart(1);
  await expect(inside.mark.locator('path')).toHaveCount(1);
  await expect(inside.mark).toContainText(pt ? /^pago / : /^paid /);
  await inside.context.close();
  // Paid far below: no line, an arrow on the bottom edge.
  const below = await chart(0.1);
  await expect(below.mark.locator('path')).toHaveCount(0);
  await expect(below.mark).toContainText(pt ? /^↓ pago / : /^↓ paid /);
  await below.context.close();
  // Paid far above: an arrow on the top edge.
  const above = await chart(10);
  await expect(above.mark.locator('path')).toHaveCount(0);
  await expect(above.mark).toContainText(pt ? /^↑ pago / : /^↑ paid /);
  await above.context.close();
});
