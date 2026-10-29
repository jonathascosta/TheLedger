import { expect, test, type Page } from '@playwright/test';

interface Save {
  volume: { number: number; cash: number; businesses: unknown[] };
  lastTick: number;
}

const readSave = (page: Page): Promise<Save | null> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('theledger.save') ?? 'null') as Save | null);

async function openSettings(page: Page, pt: boolean): Promise<void> {
  await page.goto('./');
  await page.getByRole('button', { name: pt ? /Ajustes/ : /Settings/ }).click();
  await expect(page.getByRole('heading', { name: pt ? /Ajustes/ : /Settings/ })).toBeVisible();
}

test('a backup code copied on one device restores the game on another', async ({
  browser,
  context,
  page,
}) => {
  const pt = test.info().project.name.endsWith('-pt');
  const errors: string[] = [];
  const use = test.info().project.use;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // The first device: a game in its fourth volume, with cash and no business (so the cash holds).
  await page.goto('./');
  const save = (await readSave(page))!;
  save.volume.number = 4;
  save.volume.cash = 123_456;
  save.lastTick = Date.now();
  const first = await context.newPage();
  await first.addInitScript((text) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('theledger.save', text);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(save));
  await page.close();
  first.on('pageerror', (e) => errors.push(String(e)));
  await openSettings(first, pt);
  await first.getByRole('button', { name: pt ? /Copiar código/ : /Copy backup code/ }).click();
  await expect(first.getByRole('status')).toHaveText(pt ? /Copiado/ : /Copied/);
  const code = await first
    .getByRole('textbox', { name: pt ? /Seu código/ : /Your backup code/ })
    .inputValue();
  expect(code).toMatch(/^LEDGER1\./);
  expect(await first.evaluate(() => navigator.clipboard.readText())).toBe(code);

  // The second device: a fresh browser with a new game.
  const { locale, viewport, isMobile, hasTouch, baseURL } = use;
  const options = { locale, viewport, isMobile, hasTouch, baseURL };
  const other = await browser.newContext(
    Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)),
  );
  const second = await other.newPage();
  second.on('pageerror', (e) => errors.push(String(e)));
  await openSettings(second, pt);
  expect((await readSave(second))?.volume.number).toBe(1);
  const paste = second.getByRole('textbox', {
    name: pt ? /Cole um código/ : /Paste a backup code/,
  });
  const read = second.getByRole('button', { name: pt ? /Ler o código/ : /Read the code/ });

  // A code changed by hand is refused, in words.
  const changed = code.slice(0, 20) + (code[20] === 'A' ? 'B' : 'A') + code.slice(21);
  await paste.fill(changed);
  await read.click();
  await expect(second.getByRole('alert')).toHaveText(pt ? /alterado ou cortado/ : /changed or cut/);

  // The whole code shows what it holds, then replaces the game.
  await paste.fill(code);
  await read.click();
  await expect(second.getByText(/Vol\. IV/)).toBeVisible();
  await second.getByRole('button', { name: pt ? /^Restaurar$/ : /^Restore$/ }).click();
  await expect(second.getByRole('status')).toHaveText(pt ? /Restaurado/ : /Restored/);
  const restored = await readSave(second);
  expect(restored?.volume.number).toBe(4);
  expect(restored?.volume.cash).toBe(123_456);
  // It survives a reload.
  await second.reload();
  expect((await readSave(second))?.volume.number).toBe(4);
  await other.close();
  expect(errors).toEqual([]);
});
