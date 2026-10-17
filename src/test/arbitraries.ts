/**
 * fast-check arbitraries (generators) for the puijs theming + test platform.
 *
 * These generators constrain to the real input space of the theming system so
 * property tests exercise valid combinations across the 19 `BRAND_THEMES` ids,
 * the 5 `ThemeStyle` values, the 3 `Theme` values, the registered
 * Site_Archetype ids (plus arbitrary strings for the unknown-id fallback
 * property), arbitrary `ThemePreferences`, supported component `variant`
 * values, and the pre-restructure public export names (for the barrel export
 * stability property).
 *
 * Values are derived from the real modules (`themes.ts`, `archetypes.ts`,
 * `types.ts`) rather than re-declared, so a change to the registries flows into
 * the generators automatically. This is kit-agnostic test logic: it references
 * only puijs theming values and imports no other UI kit ("One UI Kit Per App").
 *
 * Design reference: puijs-theming-and-test-platform — Property-Based Testing
 * Configuration (Generators).
 */
import fc from 'fast-check';
import { BRAND_THEMES } from '../providers/themes';
import { SITE_ARCHETYPES } from '../providers/archetypes';
import type {
  Theme,
  ThemeStyle,
  ThemePreferences,
} from '../providers/types';

// --- primitive id/value pools (derived from the real registries) ------------

/** The 19 registered Brand_Theme ids (e.g. 'phi', 'foundry', 'blueprint'). */
export const BRAND_IDS: readonly string[] = BRAND_THEMES.map((b) => b.id);

/** The 7 Theme_Style values applied via `data-theme-style`. */
export const THEME_STYLES: readonly ThemeStyle[] = [
  'apple',
  'flat',
  'gradient',
  'elevated',
  'glass',
  'organic',
  'spacex',
];

/** The 3 Theme_Mode values applied via `data-theme` / `dark` class. */
export const THEMES: readonly Theme[] = ['light', 'dark', 'system'];

/** The registered Site_Archetype ids (e.g. 'portal', 'docs', 'marketplace'). */
export const ARCHETYPE_IDS: readonly string[] = SITE_ARCHETYPES.map((a) => a.id);

/**
 * Supported component `variant` values. Per the design, one Sidebar_Brand
 * variant exists per Site_Archetype, so the variant space equals the set of
 * registered archetype ids.
 */
export const VARIANT_VALUES: readonly string[] = ARCHETYPE_IDS;

/**
 * Pre-restructure public export names — the shop component symbols that
 * existed before the singular-family + role-file restructure and MUST remain
 * importable by the same name from the package root barrel (Property 18).
 */
export const PRE_RESTRUCTURE_EXPORT_NAMES: readonly string[] = [
  'Price',
  'ProductCard',
  'ProductGrid',
  'CartItem',
  'CartDrawer',
  'CartSummary',
  'OrderCard',
  'AddressCard',
  'PaymentMethod',
  'FacetFilter',
  'WishlistItem',
];

// --- arbitraries -------------------------------------------------------------

/** Arbitrary over the 19 registered Brand_Theme ids. */
export const brandIdArb: fc.Arbitrary<string> = fc.constantFrom(...BRAND_IDS);

/** Arbitrary over the 5 Theme_Style values. */
export const themeStyleArb: fc.Arbitrary<ThemeStyle> = fc.constantFrom(
  ...THEME_STYLES
);

/** Arbitrary over the 3 Theme_Mode values. */
export const themeArb: fc.Arbitrary<Theme> = fc.constantFrom(...THEMES);

/** Arbitrary over the registered Site_Archetype ids. */
export const archetypeIdArb: fc.Arbitrary<string> = fc.constantFrom(
  ...ARCHETYPE_IDS
);

/**
 * Arbitrary over arbitrary strings that are NOT registered archetype ids, for
 * the unknown-id fallback property (Property 7 / Requirement 6.3). Filters out
 * any generated string that happens to collide with a real id.
 */
export const unknownArchetypeIdArb: fc.Arbitrary<string> = fc
  .string()
  .filter((s) => !ARCHETYPE_IDS.includes(s));

/**
 * Arbitrary over supported component `variant` values (one per Site_Archetype).
 */
export const variantArb: fc.Arbitrary<string> = fc.constantFrom(
  ...VARIANT_VALUES
);

/** Arbitrary over the pre-restructure public export names (Property 18). */
export const preRestructureExportNameArb: fc.Arbitrary<string> =
  fc.constantFrom(...PRE_RESTRUCTURE_EXPORT_NAMES);

/**
 * Arbitrary over full, valid `ThemePreferences` combinations: a Theme_Mode, a
 * Theme_Style, a registered Brand_Theme id, and a registered Site_Archetype id.
 * The (19 × 5 × 3 × N) space lets property tests explore the whole preference
 * matrix rather than a handful of hand-picked examples.
 */
export const themePreferencesArb: fc.Arbitrary<ThemePreferences> = fc.record({
  theme: themeArb,
  themeStyle: themeStyleArb,
  brandId: brandIdArb,
  archetypeId: archetypeIdArb,
  // Scaling multipliers explored across the sensible provider ranges. The
  // ThemePreferences shape carries these as first-class fields, so the
  // arbitrary must produce them (Requirement 2.x, Property 20 continuation).
  borderRadius: fc.double({ min: 0, max: 2, noNaN: true }),
  density: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
});
