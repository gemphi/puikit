/**
 * Property-based tests for the kit-agnostic preference persistence logic
 * (`PREF_KEYS`, `loadPreference`, `persistPreference` in `preferences.ts`).
 *
 * These exercise the real persistence module against the in-memory
 * `localStorage` shim installed by `src/test/setup.ts`, using the fast-check
 * arbitraries from `src/test/arbitraries.ts` to explore the real preference
 * value space (Theme_Mode, Theme_Style, Brand_Theme id, Site_Archetype id)
 * across the four `PREF_KEYS` entries.
 *
 * This is shared, kit-agnostic test logic ("One UI Kit Per App"): it references
 * only puijs theming values and imports no other UI kit.
 *
 * Feature: puijs-theming-and-test-platform
 *   Property 13: Persistence round-trip — _Validates: Requirements 10.1, 10.2_
 *   Property 14: Default used when no persisted value exists — _Validates: Requirements 10.2_
 */
import fc from 'fast-check';
import { describe, it } from 'vitest';

import {
  PREF_KEYS,
  loadPreference,
  persistPreference,
} from './preferences';
import {
  themeArb,
  themeStyleArb,
  brandIdArb,
  archetypeIdArb,
} from '../test/arbitraries';

const NUM_RUNS = 100;

/** Arbitrary over the four persisted preference keys (Theme/Style/Brand/Archetype). */
const prefKeyArb = fc.constantFrom(
  PREF_KEYS.theme,
  PREF_KEYS.themeStyle,
  PREF_KEYS.brandId,
  PREF_KEYS.archetypeId,
);

/**
 * Arbitrary over real, non-empty preference values drawn from the full theming
 * space (a Theme_Mode, Theme_Style, Brand_Theme id, or Site_Archetype id). All
 * of these are non-empty strings, which is the value class `persistPreference`
 * round-trips (an empty stored value is intentionally treated as "no value").
 */
const prefValueArb = fc.oneof(
  themeArb,
  themeStyleArb,
  brandIdArb,
  archetypeIdArb,
);

describe('preferences persistence (property-based)', () => {
  // Feature: puijs-theming-and-test-platform, Property 13: Persistence round-trip
  // (persistPreference then loadPreference returns the value)
  // Validates: Requirements 10.1, 10.2
  it('Property 13: persisting a value then loading the same key returns that value', () => {
    fc.assert(
      fc.property(prefKeyArb, prefValueArb, (key, value) => {
        persistPreference(key, value);
        // The fallback is deliberately different from the persisted value; a
        // correct read must return the persisted value, not the fallback.
        const fallback = `__fallback_${value}__`;
        return loadPreference(key, fallback) === value;
      }),
      { numRuns: NUM_RUNS },
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 14: Default used when no
  // persisted value exists
  // Validates: Requirements 10.2
  it('Property 14: loading a key with no persisted value returns the provided default', () => {
    fc.assert(
      fc.property(prefKeyArb, prefValueArb, (key, fallback) => {
        // setup.ts installs a fresh, empty localStorage before each test/run,
        // so no value is persisted for `key` here. The load must return the
        // supplied default.
        return loadPreference(key, fallback) === fallback;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
