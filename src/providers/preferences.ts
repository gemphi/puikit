import type { ThemePreferences } from './types';

/**
 * localStorage keys backing each persisted preference. Centralized here so the
 * provider and any tests read/write a single, uniform key set (Requirement
 * 10.1, 10.2). `archetypeId` is the new first-class Site_Archetype preference.
 */
export const PREF_KEYS = {
  theme: 'phi-theme',
  themeStyle: 'phi-style',
  brandId: 'phi-brand',
  archetypeId: 'phi-archetype',
  borderRadius: 'phi-radius',
  density: 'phi-density',
  palette: 'phi-palette',
  gradientLevel: 'phi-gradient',
} as const;

/** The default user identity when none is supplied. */
export const DEFAULT_USER_ID = 'guest';

/**
 * Derive the per-user storage key for a base preference key. Preference
 * storage is namespaced per user so switching the active user swaps their
 * entire persisted preference set (e.g. `phi-theme::guest`, `phi-theme::ada`).
 */
export function userScopedKey(baseKey: string, userId: string): string {
  return `${baseKey}::${userId || DEFAULT_USER_ID}`;
}

/** Union of preference keys managed by this module. */
export type PrefKey = keyof ThemePreferences;

/**
 * Resolve the backing browser storage. Returns `null` when storage is
 * unavailable (SSR, disabled cookies, sandboxed iframe, quota-blocked access),
 * so all callers degrade to a safe no-op / in-memory session (Requirement
 * 10.5). Access is wrapped in try/catch because touching `window.localStorage`
 * can itself throw in some environments.
 */
function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read a persisted preference, falling back to the provided default.
 *
 * Semantics (Requirement 10.2):
 * - A persisted, non-empty value takes precedence over the default.
 * - A missing (or empty) value returns the default.
 * - Any storage error is a safe no-op that returns the default.
 */
export function loadPreference<T extends string>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const stored = storage.getItem(key);
    return stored ? (stored as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persist a single preference value (Requirement 10.1). When storage is
 * unavailable or the write throws, this is a safe no-op so the session
 * continues in memory (Requirement 10.5).
 */
export function persistPreference(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Safe no-op: storage may be full, disabled, or otherwise unwritable.
  }
}

/**
 * Per-user read: resolves the user-scoped key and defers to
 * {@link loadPreference}, preserving the same safe-fallback semantics.
 */
export function loadUserPreference<T extends string>(baseKey: string, userId: string, fallback: T): T {
  return loadPreference<T>(userScopedKey(baseKey, userId), fallback);
}

/**
 * Per-user write: resolves the user-scoped key and defers to
 * {@link persistPreference}, preserving the safe no-op semantics.
 */
export function persistUserPreference(baseKey: string, userId: string, value: string): void {
  persistPreference(userScopedKey(baseKey, userId), value);
}

/**
 * Read a numeric preference for a user, parsing the stored string to a number.
 * Returns `fallback` when missing, empty, or not a finite number.
 */
export function loadUserNumberPreference(baseKey: string, userId: string, fallback: number): number {
  const stored = loadUserPreference(baseKey, userId, '');
  if (!stored) return fallback;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : fallback;
}
