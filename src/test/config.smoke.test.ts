import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Smoke test for the Test_Platform runner configuration (Requirement 1).
 *
 * This asserts the *configuration contract* statically (by reading
 * `vitest.config.ts` and `package.json`) plus a runtime jsdom-availability
 * check, rather than spawning a separate zero-file Vitest run (which would
 * conflict with the active suite). Together these confirm:
 *   - the Vitest config uses the jsdom environment (R1.1) and that jsdom
 *     globals are actually available at runtime (R1.1, R1.2),
 *   - the shared setup file is wired via `setupFiles` (R1.2),
 *   - the `test` script runs a single non-watch pass and the required test
 *     dependencies are declared (R1.4, R1.5).
 */

// The package root is two levels up from this file (src/test/*.ts).
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const vitestConfigSource = readFileSync(resolve(packageRoot, 'vitest.config.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

describe('test-runner configuration (Requirement 1)', () => {
  describe('jsdom environment (R1.1, R1.2)', () => {
    it('declares the jsdom test environment in vitest.config.ts', () => {
      // Match `environment: 'jsdom'` or `environment: "jsdom"` with flexible whitespace.
      expect(vitestConfigSource).toMatch(/environment:\s*['"]jsdom['"]/);
    });

    it('runs in an active jsdom environment (document/window globals available)', () => {
      // If the jsdom environment is active, the browser globals exist at runtime.
      expect(typeof document).toBe('object');
      expect(typeof window).toBe('object');
      expect(document).toBeDefined();
      expect(window).toBeDefined();
      // A concrete jsdom capability: we can create and query DOM nodes.
      const el = document.createElement('div');
      el.textContent = 'smoke';
      document.body.appendChild(el);
      expect(document.body.contains(el)).toBe(true);
      el.remove();
    });
  });

  describe('shared setup file wiring (R1.2)', () => {
    it('includes src/test/setup.ts in setupFiles', () => {
      // Assert the setupFiles array references the shared setup module.
      expect(vitestConfigSource).toMatch(/setupFiles:\s*\[[^\]]*['"]src\/test\/setup\.ts['"]/);
    });
  });

  describe('package.json test script and dependencies (R1.4, R1.5)', () => {
    it('declares a `test` script that runs a single non-watch pass', () => {
      const testScript = packageJson.scripts?.test;
      expect(testScript).toBeDefined();
      // `vitest run` performs a single, non-watch execution.
      expect(testScript).toMatch(/\bvitest\s+run\b/);
      // Guard against an accidental watch invocation.
      expect(testScript).not.toMatch(/--watch\b/);
    });

    it('declares the required Test_Platform dependencies', () => {
      const allDeps: Record<string, string> = {
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.devDependencies ?? {}),
        ...(packageJson.peerDependencies ?? {}),
      };
      for (const dep of [
        'vitest',
        '@testing-library/react',
        '@testing-library/jest-dom',
        'jsdom',
        'fast-check',
      ]) {
        expect(allDeps, `expected "${dep}" to be declared in package.json`).toHaveProperty(dep);
      }
    });
  });
});
