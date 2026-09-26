import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Mirrors the REFS/blueprint per-package layout pattern: a jsdom environment,
// colocated `src/**/*.test.{ts,tsx}` test files, a shared setup file, and the
// React plugin. No external UI-kit or documentation-tooling dependency is added.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['dist/**', 'node_modules/**'],
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    // Zero test files present is a success, not an error (Requirement 1.5).
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    },
  },
});
