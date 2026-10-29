import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// Relative base so the same build serves from GitHub Pages' subpath and from Capacitor.
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
});
