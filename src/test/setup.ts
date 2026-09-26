import '@testing-library/jest-dom/vitest';

import { afterEach, beforeEach } from 'vitest';

/**
 * Shared test setup for the puijs Test_Platform (Requirements 1, 2, 3).
 *
 * Registers `@testing-library/jest-dom` matchers (imported above) and shims the
 * browser `localStorage` and `matchMedia` APIs that jsdom does not implement
 * fully. Both shims are reset between test iterations so preference persistence
 * and system-color-scheme behavior start from a clean slate each test.
 */

// --- localStorage shim ------------------------------------------------------

/** Minimal, spec-faithful in-memory `Storage` implementation for jsdom. */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

/** Install a fresh `localStorage` shim on the global object. */
function installLocalStorage(): void {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}

// --- matchMedia shim --------------------------------------------------------

/**
 * Controls the value the `matchMedia` shim reports for
 * `(prefers-color-scheme: dark)`. Tests may flip this before rendering to
 * exercise system dark-mode resolution.
 */
let prefersDark = false;

/** Override the simulated OS dark-mode preference for the current test. */
export function setPrefersDark(value: boolean): void {
  prefersDark = value;
}

/** Install a `matchMedia` shim that honors the simulated dark preference. */
function installMatchMedia(): void {
  const matchMedia = (query: string): MediaQueryList => {
    const matches = /prefers-color-scheme:\s*dark/.test(query) ? prefersDark : false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };

  Object.defineProperty(globalThis, 'matchMedia', {
    value: matchMedia,
    writable: true,
    configurable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      value: matchMedia,
      writable: true,
      configurable: true,
    });
  }
}

// --- reset between iterations ----------------------------------------------

/** Strip theming attributes/custom properties from the document root. */
function resetDocumentRoot(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  root.removeAttribute('data-theme-style');
  root.removeAttribute('data-brand');
  root.removeAttribute('data-archetype');
  root.removeAttribute('data-gradient-default');
  root.classList.remove('dark');
  root.removeAttribute('style');
}

beforeEach(() => {
  prefersDark = false;
  installLocalStorage();
  installMatchMedia();
  // Also reset the root up-front so a test's initial-state assertions never
  // observe `data-*`/style residue leaked from a prior test file (effects that
  // apply theming run post-render, so cross-file ordering can leave residue).
  resetDocumentRoot();
});

afterEach(() => {
  // A test may have installed a throwing/hostile `localStorage` stub (e.g. to
  // exercise the storage-unavailable fallback). Reinstalling a fresh in-memory
  // shim is safer than calling `.clear()` on whatever is currently installed,
  // which could throw and abort teardown. Guarded for total safety.
  try {
    installLocalStorage();
  } catch {
    /* ignore — teardown must never throw */
  }
  // Clear any theming attributes/custom properties applied to the root so each
  // test observes a clean document element.
  resetDocumentRoot();
});
