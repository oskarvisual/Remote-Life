import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    // Phaser is large; keep it in its own cacheable chunk.
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
