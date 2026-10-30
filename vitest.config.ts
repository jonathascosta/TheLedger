import { defineConfig } from 'vitest/config';

/**
 * One Vitest run; each package and app contributes its own project. `calibration` runs the long
 * simulations (`*.calibration.test.ts`, PRODUCT.md, Balance) with `pnpm test:calibration`, out of
 * the pre-commit hook.
 */
export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
      'apps/*/vitest.config.ts',
      {
        test: {
          name: 'calibration',
          root: './packages/engine',
          include: ['src/**/*.calibration.test.ts'],
          testTimeout: 10 * 60_000,
        },
      },
    ],
  },
});
