import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    sequence: { concurrent: false },
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
});
