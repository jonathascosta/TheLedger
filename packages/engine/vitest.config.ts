import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'engine',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The long simulations run apart (`pnpm test:calibration`).
    exclude: ['src/**/*.calibration.test.ts'],
  },
});
