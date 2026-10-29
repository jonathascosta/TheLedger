import { createRng } from '@ledger/engine';

/** Paints the paper's grain once, as a small tiled texture. */
export function paintGrain(): void {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(size, size);
  const rng = createRng('paper-grain');
  for (let i = 0; i < size * size; i++) {
    const v = 90 + rng.int(60);
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v - 15;
    image.data[i * 4 + 2] = v - 40;
    image.data[i * 4 + 3] = rng.int(22);
  }
  ctx.putImageData(image, 0, 0);
  document.documentElement.style.setProperty('--grain', `url(${canvas.toDataURL()})`);
}
