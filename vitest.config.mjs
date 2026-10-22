import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // Seluruh integration test memakai satu database yang sama,
    // sehingga file test harus dijalankan satu per satu.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/**/_test/**', 'src/app.js'],
    },
  },
});
