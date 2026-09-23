import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Barrel re-exports and pure types are not meaningful coverage targets.
      exclude: ['src/index.ts', 'src/types.ts', '**/*.d.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 85,
        functions: 95,
        branches: 80,
        statements: 85,
      },
    },
  },
});
