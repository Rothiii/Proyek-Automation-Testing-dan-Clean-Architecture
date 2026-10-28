import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/testenv.js'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
