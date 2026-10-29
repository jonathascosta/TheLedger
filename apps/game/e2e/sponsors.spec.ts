import { expect, test, type Page } from '@playwright/test';

/** Words that differ between the two locales. */
function words() {
  const pt = test.info().project.name.endsWith('-pt');
  return {
    desk: pt ? /Recepção/ : /Front desk/,
    back: pt ? /Voltar/ : /Back/,
    open: pt ? /^Abrir/ : /^Open/,
    overtime: pt ? 'Hora extra' : 'Overtime',
    overtimeOn: pt ? /×3 ativo/ : /×3 on/,
    sponsorship: pt ? 'Patrocínio' : 'Sponsorship',
    sponsorshipOn: pt ? /×2 ativo/ : /×2 on/,
    audit: pt ? 'Auditoria' : 'Audit',
    left: (n: number) => (pt ? `restam ${n} hoje` : `${n} left today`),
    skipped: pt ? /sem recompensa/ : /no reward/,
  };
}

/** The clipping whose title is `title`. */
function clipping(page: Page, title: string) {
  return page.locator('.sponsor', { has: page.locator('.sponsor-title', { hasText: title }) });
}

/** Watches the test card to the end, or closes it early. */
async function watch(page: Page, title: string, toTheEnd: boolean): Promise<void> {
  await clipping(page, title).locator('.sponsor-btn').click();
  const card = page.locator('.test-ad');
  await expect(card).toBeVisible();
  await card.locator(toTheEnd ? '.stamp-btn' : '.btn-link').click();
  await expect(card).toHaveCount(0);
}

async function openCafe(page: Page): Promise<void> {
  const w = words();
  await page.getByRole('button', { name: w.desk }).click();
  for (let i = 0; i < 3; i++) await page.locator('.invoice').last().click();
  await page.getByRole('button', { name: w.back }).click();
  await page.getByRole('button', { name: w.open }).first().click();
}

test('the website shows no sponsor without the test card', async ({ page }) => {
  await page.goto('./');
  await openCafe(page);
  await expect(page.locator('.sponsor')).toHaveCount(0);
});

test('overtime: closed early gives nothing; watched, stamps ×3', async ({ page }) => {
  const w = words();
  await page.goto('./?ads=test');
  await page.getByRole('button', { name: w.desk }).click();
  const offer = clipping(page, w.overtime);
  await expect(offer).toContainText(w.left(6));
  await watch(page, w.overtime, false);
  await expect(page.locator('.toast')).toContainText(w.skipped);
  await expect(offer).toContainText(w.left(6));
  await watch(page, w.overtime, true);
  await expect(offer).toContainText(w.overtimeOn);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
              sponsors?: { overtimeUntil: number };
            }
          ).sponsors?.overtimeUntil ?? 0,
      ),
    )
    .toBeGreaterThan(Date.now());
});

test('the sponsorship doubles business profit', async ({ page }) => {
  const w = words();
  await page.goto('./?ads=test');
  await openCafe(page);
  await watch(page, w.sponsorship, true);
  await expect(clipping(page, w.sponsorship)).toContainText(w.sponsorshipOn);
  await expect(clipping(page, w.sponsorship)).toContainText(w.left(2));
});

test('the audit pays the absence receipt twice', async ({ page, context }) => {
  const w = words();
  await page.goto('./?ads=test');
  await page.waitForFunction(() => localStorage.getItem('theledger.save'));
  const save = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as {
        volume: { businesses: unknown[]; managers: unknown[]; cash: number };
        lastTick: number;
      },
  );
  save.volume.businesses[0] = { level: 10, progress: 0, till: 0 };
  save.volume.managers[0] = { name: 'Rosa M.', trait: 'perfectionist', face: 7 };
  save.volume.cash = 0;
  save.lastTick = Date.now() - 3600_000;
  const second = await context.newPage();
  await second.addInitScript((text) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('theledger.save', text);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(save));
  await page.close();
  await second.goto('./?ads=test');
  const modal = second.locator('.modal');
  await expect(modal).toBeVisible();
  const total = await second.evaluate(
    () =>
      (
        JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
          away?: { total: number };
        }
      ).away?.total ?? 0,
  );
  expect(total).toBeGreaterThan(0);
  await watch(second, w.audit, true);
  await expect(modal).toHaveCount(0);
  const cash = (): Promise<number> =>
    second.evaluate(
      () =>
        (
          JSON.parse(localStorage.getItem('theledger.save') ?? '{}') as {
            volume?: { cash?: number };
          }
        ).volume?.cash ?? 0,
    );
  await expect.poll(cash, { timeout: 5000 }).toBeGreaterThanOrEqual(total * 2 * 0.999);
});
