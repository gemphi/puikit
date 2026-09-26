import React from 'react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { PuiProvider } from './PuiProvider';
import { usePuiTheme } from './PuiProvider';
import { PREF_KEYS, DEFAULT_USER_ID, userScopedKey } from './preferences';
import { SITE_ARCHETYPES, DEFAULT_ARCHETYPE_ID } from './archetypes';
import type { ThemePreferences } from './types';

/**
 * Unit tests for the PuiProvider context surface and preference switching
 * (Requirements 5.2, 10.3, 10.4, 10.5).
 *
 * These complement the property-based tests in `PuiProvider.test.tsx` (task
 * 4.3) with concrete, example-based assertions using React Testing Library.
 * A small `TestConsumer` component reads and exercises the context through the
 * public `usePuiTheme` hook, mirroring how a Consuming_App interacts with the
 * provider. Only puijs is used for view composition (One UI Kit Per App).
 */

/**
 * Captures the latest context value so assertions can inspect it, and renders
 * the context's scalar fields into the DOM for lookup by test id. Buttons wire
 * each setter so tests can trigger real state transitions via user-facing
 * affordances rather than reaching into internals.
 */
let latestContext: ReturnType<typeof usePuiTheme> | null = null;

const TestConsumer: React.FC = () => {
  const ctx = usePuiTheme();
  latestContext = ctx;
  return (
    <div>
      <span data-testid="archetypeId">{ctx.archetypeId}</span>
      <span data-testid="theme">{ctx.theme}</span>
      <span data-testid="themeStyle">{ctx.themeStyle}</span>
      <span data-testid="brandId">{ctx.brandId}</span>
      <span data-testid="pref-theme">{ctx.preferences.theme}</span>
      <span data-testid="pref-themeStyle">{ctx.preferences.themeStyle}</span>
      <span data-testid="pref-brandId">{ctx.preferences.brandId}</span>
      <span data-testid="pref-archetypeId">{ctx.preferences.archetypeId}</span>
      <button onClick={() => ctx.setArchetypeId('docs')}>set-archetype-docs</button>
    </div>
  );
};

afterEach(() => {
  latestContext = null;
  cleanup();
});

describe('PuiProvider context surface (R5.2)', () => {
  it('exposes archetypeId and a setArchetypeId function through context', () => {
    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    expect(latestContext).not.toBeNull();
    expect(latestContext!.archetypeId).toBe(DEFAULT_ARCHETYPE_ID);
    expect(typeof latestContext!.setArchetypeId).toBe('function');
    expect(screen.getByTestId('archetypeId')).toHaveTextContent(DEFAULT_ARCHETYPE_ID);
  });

  it('also exposes the available archetypes registry on the context', () => {
    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    expect(latestContext!.archetypes).toEqual(SITE_ARCHETYPES);
  });

  it('updates archetypeId when setArchetypeId is invoked', () => {
    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    act(() => {
      latestContext!.setArchetypeId('marketplace');
    });

    expect(latestContext!.archetypeId).toBe('marketplace');
    expect(screen.getByTestId('archetypeId')).toHaveTextContent('marketplace');
    // switching archetype should re-resolve the active descriptor
    expect(latestContext!.activeArchetype.id).toBe('marketplace');
  });
});

describe('ThemePreferences shape exposed via context (R10.3)', () => {
  it('exposes preferences containing theme, themeStyle, brandId, and archetypeId', () => {
    render(
      <PuiProvider
        defaultTheme="dark"
        defaultThemeStyle="gradient"
        defaultBrand="sapphire"
        defaultArchetype="docs"
      >
        <TestConsumer />
      </PuiProvider>
    );

    const prefs = latestContext!.preferences;
    // The ThemePreferences shape now carries the radius/density scaling
    // multipliers as first-class fields alongside the original theme,
    // themeStyle, brandId, and archetypeId (Requirement 10.3).
    expect(Object.keys(prefs).sort()).toEqual(
      (['archetypeId', 'borderRadius', 'brandId', 'density', 'theme', 'themeStyle'] as (keyof ThemePreferences)[]).sort()
    );
    expect(prefs.theme).toBe('dark');
    expect(prefs.themeStyle).toBe('gradient');
    expect(prefs.brandId).toBe('sapphire');
    expect(prefs.archetypeId).toBe('docs');
    // The radius/density defaults are `1` (no scale change) when the
    // provider is not initialized with overrides.
    expect(prefs.borderRadius).toBe(1);
    expect(prefs.density).toBe(1);

    // The rendered projection matches the context object.
    expect(screen.getByTestId('pref-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('pref-themeStyle')).toHaveTextContent('gradient');
    expect(screen.getByTestId('pref-brandId')).toHaveTextContent('sapphire');
    expect(screen.getByTestId('pref-archetypeId')).toHaveTextContent('docs');
  });

  it('keeps preferences in sync with the individual context fields', () => {
    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    const ctx = latestContext!;
    expect(ctx.preferences.theme).toBe(ctx.theme);
    expect(ctx.preferences.themeStyle).toBe(ctx.themeStyle);
    expect(ctx.preferences.brandId).toBe(ctx.brandId);
    expect(ctx.preferences.archetypeId).toBe(ctx.archetypeId);
  });
});

describe('Multi-preference update via setPreferences (R10.4)', () => {
  it('applies multiple fields at once in a single operation', () => {
    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    act(() => {
      latestContext!.setPreferences({
        theme: 'dark',
        themeStyle: 'glass',
        brandId: 'emerald',
        archetypeId: 'social-feed',
      });
    });

    const ctx = latestContext!;
    expect(ctx.theme).toBe('dark');
    expect(ctx.themeStyle).toBe('glass');
    expect(ctx.brandId).toBe('emerald');
    expect(ctx.archetypeId).toBe('social-feed');
    // preferences object reflects every applied field
    expect(ctx.preferences).toMatchObject({
      theme: 'dark',
      themeStyle: 'glass',
      brandId: 'emerald',
      archetypeId: 'social-feed',
    });
  });

  it('persists each provided preference to storage', () => {
    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    act(() => {
      latestContext!.setPreferences({
        theme: 'light',
        themeStyle: 'flat',
        brandId: 'crimson',
        archetypeId: 'marketplace',
      });
    });

    // Preferences are namespaced per user (Requirement 10.1). The default
    // user identity is `'guest'`, so persisted keys are scoped as
    // `phi-theme::guest`, `phi-style::guest`, etc.
    const scope = (base: string) => userScopedKey(base, DEFAULT_USER_ID);
    expect(window.localStorage.getItem(scope(PREF_KEYS.theme))).toBe('light');
    expect(window.localStorage.getItem(scope(PREF_KEYS.themeStyle))).toBe('flat');
    expect(window.localStorage.getItem(scope(PREF_KEYS.brandId))).toBe('crimson');
    expect(window.localStorage.getItem(scope(PREF_KEYS.archetypeId))).toBe('marketplace');
  });

  it('updates only the fields provided in a partial update', () => {
    render(
      <PuiProvider defaultTheme="light" defaultThemeStyle="apple" defaultArchetype="portal">
        <TestConsumer />
      </PuiProvider>
    );

    act(() => {
      latestContext!.setPreferences({ themeStyle: 'elevated' });
    });

    const ctx = latestContext!;
    expect(ctx.themeStyle).toBe('elevated');
    // unspecified fields remain at their prior values
    expect(ctx.theme).toBe('light');
    expect(ctx.archetypeId).toBe('portal');
  });
});

describe('In-memory fallback when storage is unavailable (R10.5)', () => {
  /**
   * Replace `window.localStorage` with an object that throws on every access,
   * simulating disabled/sandboxed storage. The provider's preferences layer
   * guards storage access in try/catch, so the session must continue in memory.
   */
  /**
   * Restore a benign in-memory `localStorage` after each test in this block so
   * the shared `setup.ts` teardown (which calls `localStorage.clear()`) does not
   * hit the throwing shim. Local `afterEach` runs before the global one.
   */
  const restoreStorage = () => {
    const store = new Map<string, string>();
    const memory = {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    } as unknown as Storage;
    Object.defineProperty(window, 'localStorage', {
      value: memory,
      writable: true,
      configurable: true,
    });
  };

  beforeEach(restoreStorage);
  afterEach(restoreStorage);

  const installThrowingStorage = () => {
    const throwing = {
      getItem() {
        throw new Error('storage unavailable');
      },
      setItem() {
        throw new Error('storage unavailable');
      },
      removeItem() {
        throw new Error('storage unavailable');
      },
      clear() {
        throw new Error('storage unavailable');
      },
      key() {
        throw new Error('storage unavailable');
      },
      get length(): number {
        throw new Error('storage unavailable');
      },
    } as unknown as Storage;

    Object.defineProperty(window, 'localStorage', {
      value: throwing,
      writable: true,
      configurable: true,
    });
  };

  it('still renders and exposes a working context when storage throws', () => {
    installThrowingStorage();

    expect(() =>
      render(
        <PuiProvider defaultTheme="dark" defaultBrand="amber" defaultArchetype="docs">
          <TestConsumer />
        </PuiProvider>
      )
    ).not.toThrow();

    // Defaults are honored in memory since no persisted value could be read.
    expect(latestContext!.theme).toBe('dark');
    expect(latestContext!.brandId).toBe('amber');
    expect(latestContext!.archetypeId).toBe('docs');
  });

  it('applies preference changes in memory for the current session', () => {
    installThrowingStorage();

    render(
      <PuiProvider>
        <TestConsumer />
      </PuiProvider>
    );

    act(() => {
      latestContext!.setPreferences({ theme: 'dark', archetypeId: 'social-feed' });
    });

    // Even though persistence silently no-ops, the in-memory context updates.
    expect(latestContext!.theme).toBe('dark');
    expect(latestContext!.archetypeId).toBe('social-feed');
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('archetypeId')).toHaveTextContent('social-feed');
  });
});
