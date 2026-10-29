import { defineConfig } from 'vitest/config';

/** One Vitest run; each package and app contributes its own project. */
export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts'],
  },
});
