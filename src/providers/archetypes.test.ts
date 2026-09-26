/**
 * Property-based tests for the Site_Archetype registry and pure resolution
 * helpers in `archetypes.ts`.
 *
 * These exercise the kit-agnostic theming logic (registry well-formedness,
 * brand precedence, unknown-id fallback) across the real input space using the
 * shared fast-check arbitraries in `../test/arbitraries.ts` and the real
 * `archetypes.ts` module. Each property runs a minimum of 100 iterations.
 *
 * Design reference: puijs-theming-and-test-platform — Correctness Properties
 * 4, 6, 7. This is kit-agnostic test logic; it imports no other UI kit
 * ("One UI Kit Per App").
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import {
  SITE_ARCHETYPES,
  DEFAULT_ARCHETYPE_ID,
  resolveArchetype,
  resolveBrandId,
  getDefaultArchetype,
} from './archetypes';
import { BRAND_THEMES } from './themes';
import {
  archetypeIdArb,
  brandIdArb,
  unknownArchetypeIdArb,
  BRAND_IDS,
} from '../test/arbitraries';

const NUM_RUNS = 100;

/** The registered archetype descriptor for a known id (guaranteed present). */
function archetypeById(id: string) {
  const found = SITE_ARCHETYPES.find((a) => a.id === id);
  if (!found) throw new Error(`test setup: unknown archetype id ${id}`);
  return found;
}

describe('archetypes registry and resolution', () => {
  // Feature: puijs-theming-and-test-platform, Property 4: Archetype registry is
  // well-formed — For all entries in the archetype registry, each SHALL have a
  // unique archetypeId, a defined layout composition, a defined navigation
  // composition, gradient defaults, and a defaultBrandId that refers to an
  // existing Brand_Theme.
  // Validates: Requirements 5.1, 5.3
  it('Property 4: archetype registry is well-formed', () => {
    const brandIdSet = new Set(BRAND_IDS);

    // The registry must be non-empty for a meaningful default to exist.
    expect(SITE_ARCHETYPES.length).toBeGreaterThan(0);

    // ids are globally unique across the registry.
    const ids = SITE_ARCHETYPES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Property: for any entry drawn from the registry, all structural
    // invariants hold.
    fc.assert(
      fc.property(archetypeIdArb, (id) => {
        const archetype = archetypeById(id);

        // unique id (already checked globally; re-assert the id is a string)
        expect(typeof archetype.id).toBe('string');
        expect(archetype.id.length).toBeGreaterThan(0);

        // defined layout + navigation compositions
        expect(archetype.layout).toBeDefined();
        expect(archetype.navigation).toBeDefined();

        // gradient defaults present and shaped
        expect(archetype.gradientDefaults).toBeDefined();
        expect(typeof archetype.gradientDefaults.enabled).toBe('boolean');

        // defaultBrandId refers to an existing Brand_Theme
        expect(typeof archetype.defaultBrandId).toBe('string');
        expect(brandIdSet.has(archetype.defaultBrandId)).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 6: Brand precedence — For
  // any archetype, when no explicit brandId is set the effective Brand_Theme
  // SHALL equal the archetype's defaultBrandId; and for any archetype paired
  // with any explicitly set valid brandId, the effective Brand_Theme SHALL
  // equal the explicit brandId.
  // Validates: Requirements 6.2
  it('Property 6: brand precedence (explicit brand wins, else archetype default)', () => {
    // No explicit brand (null or undefined) -> archetype default.
    fc.assert(
      fc.property(
        archetypeIdArb,
        fc.constantFrom<null | undefined>(null, undefined),
        (id, noBrand) => {
          const archetype = archetypeById(id);
          expect(resolveBrandId(archetype, noBrand)).toBe(
            archetype.defaultBrandId
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );

    // Explicit valid brand -> that brand wins regardless of archetype default.
    fc.assert(
      fc.property(archetypeIdArb, brandIdArb, (id, explicitBrandId) => {
        const archetype = archetypeById(id);
        expect(resolveBrandId(archetype, explicitBrandId)).toBe(explicitBrandId);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 7: Unknown archetypeId
  // falls back to the default — For any string that is not a registered
  // archetypeId, resolveArchetype SHALL return the defined default
  // Site_Archetype.
  // Validates: Requirements 6.3
  it('Property 7: unknown archetypeId falls back to the default', () => {
    const expectedDefault = getDefaultArchetype();

    // Sanity: the default resolves to DEFAULT_ARCHETYPE_ID when present.
    expect(SITE_ARCHETYPES.some((a) => a.id === DEFAULT_ARCHETYPE_ID)).toBe(
      true
    );
    expect(expectedDefault.id).toBe(DEFAULT_ARCHETYPE_ID);

    // Property: any non-registered id (including undefined) resolves to the
    // default archetype descriptor.
    fc.assert(
      fc.property(
        fc.oneof(unknownArchetypeIdArb, fc.constant(undefined)),
        (unknownId) => {
          expect(resolveArchetype(unknownId)).toBe(expectedDefault);
        }
      ),
      { numRuns: NUM_RUNS }
    );

    // Complement: any registered id resolves to its own descriptor, not the
    // default fallback (guards against a vacuous fallback that ignores input).
    fc.assert(
      fc.property(archetypeIdArb, (id) => {
        expect(resolveArchetype(id).id).toBe(id);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

// Reference `BRAND_THEMES` to keep the well-formedness intent explicit and to
// document the brand registry these archetypes must point into.
void BRAND_THEMES;
