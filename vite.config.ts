import { defineConfig } from 'vite';

// base relativa: el build funciona en cualquier hosting estático, también en subcarpetas (GitHub Pages).
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  // Phaser ocupa ~1,4 MB (370 KB gzip): es un único chunk a propósito
  build: { chunkSizeWarningLimit: 1600 },
});
