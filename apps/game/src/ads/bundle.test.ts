import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !name.includes('.test.') ? [path] : [];
  });
}

describe('the website', () => {
  it('never loads AdMob: only the iOS platform imports it, and it is loaded on iOS alone', () => {
    const importers = sources(SRC)
      .filter((path) =>
        /from '(@capacitor-community\/admob|\.\.\/ads\/admob\.ts)'/.test(
          readFileSync(path, 'utf8'),
        ),
      )
      .map((path) => relative(SRC, path));
    expect(importers).toEqual(['platform/native.ts']);
    const index = readFileSync(join(SRC, 'platform/index.ts'), 'utf8');
    expect(index).not.toMatch(/from '\.\/native\.ts'/);
    expect(index).toMatch(
      /if \(Capacitor\.isNativePlatform\(\)\) \{\s*const native = await import\('\.\/native\.ts'\)/,
    );
  });
});
