import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, within } from '@testing-library/react';
import fc from 'fast-check';
import { renderWithPui } from '../../../test/renderWithPui';
import { SidebarBrand, type SidebarBrandProps } from './brand';
import {
  SITE_ARCHETYPES,
  DEFAULT_ARCHETYPE_ID,
} from '../../../providers/archetypes';
import { archetypeIdArb, variantArb } from '../../../test/arbitraries';

/**
 * Property tests for the Sidebar_Brand (task 8.4).
 *
 * These property-based tests complement the co-located example tests in
 * `brand.test.tsx` (task 8.3). Each test runs a minimum of 100 iterations via
 * fast-check and exercises the Sidebar_Brand across the input space (collapse
 * toggle sequences, the registered archetype ids, and supported variants).
 *
 * The Sidebar_Brand root carries `data-collapsed` and `data-variant`; the
 * collapse control is the header button whose accessible name is
 * "Collapse sidebar" (open) / "Expand sidebar" (collapsed). Appearance is
 * token- and data-attribute-driven only, so the root MUST NOT carry an inline
 * `style` attribute introduced by variant selection.
 *
 * One UI Kit Per App: this is kit-agnostic puijs test logic; it imports only
 * puijs sources and the shared arbitraries, never another UI kit.
 */

const baseProps: SidebarBrandProps = {
  logoLabel: 'Acme',
  automations: [{ id: 'a1', label: 'Nightly sync' }],
  recentSessions: [{ id: 's1', label: 'Draft plan' }],
  account: { name: 'Ada Lovelace' },
};

/** The sidebar root carries both `data-collapsed` and `data-variant`. */
const findSidebarRoot = (container: HTMLElement): HTMLElement => {
  const root = container.querySelector('[data-variant]');
  if (!(root instanceof HTMLElement)) {
    throw new Error('SidebarBrand root with data-variant not found');
  }
  return root;
};

/** The header collapse/expand control (accessible name flips with state). */
const findToggle = (container: HTMLElement): HTMLElement =>
  within(container).getByRole('button', { name: /(Collapse|Expand) sidebar/ });

describe('SidebarBrand property tests (8.4)', () => {
  // Feature: puijs-theming-and-test-platform, Property 16: Sidebar collapse
  // toggle reflects in data-collapsed (toggling the collapse control flips
  // data-collapsed true/false on the root).
  // Validates: Requirements 12.3, 12.4, 12.7
  it('Property 16: collapse toggle sequence reflects in data-collapsed', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // starting collapsed state
        fc.array(fc.constant(null), { minLength: 0, maxLength: 8 }), // # of toggles
        (startCollapsed, toggles) => {
          const { container, unmount } = renderWithPui(
            <SidebarBrand {...baseProps} defaultCollapsed={startCollapsed} />
          );
          try {
            const root = findSidebarRoot(container);

            // Initial state mirrors defaultCollapsed.
            expect(root.getAttribute('data-collapsed')).toBe(
              startCollapsed ? 'true' : 'false'
            );

            let expected = startCollapsed;
            for (let i = 0; i < toggles.length; i += 1) {
              fireEvent.click(findToggle(container));
              expected = !expected;
              expect(root.getAttribute('data-collapsed')).toBe(
                expected ? 'true' : 'false'
              );
            }

            // An even number of toggles returns to the start; odd flips it.
            const parity = toggles.length % 2 === 0;
            expect(root.getAttribute('data-collapsed')).toBe(
              (parity ? startCollapsed : !startCollapsed) ? 'true' : 'false'
            );
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: puijs-theming-and-test-platform, Property 17: Every archetype has a
  // corresponding Sidebar variant (for every registered archetypeId, SidebarBrand
  // renders with data-variant equal to that archetype and does not throw).
  // Validates: Requirements 5.1, 5.3, 12.1, 12.6
  it('Property 17: every registered archetype renders as a matching variant', () => {
    // Sanity: the variant space is non-empty and equals the registered ids.
    expect(SITE_ARCHETYPES.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(archetypeIdArb, fc.boolean(), (archetypeId, viaProvider) => {
        // Cover both selection paths: active archetype (variant omitted) and
        // an explicit `variant` prop — both must yield data-variant === id.
        const { container, unmount } = viaProvider
          ? renderWithPui(<SidebarBrand {...baseProps} />, {
              preferences: { archetypeId },
            })
          : renderWithPui(<SidebarBrand {...baseProps} variant={archetypeId} />);
        try {
          const root = findSidebarRoot(container);
          expect(root.getAttribute('data-variant')).toBe(archetypeId);
          // Rendered without throwing and produced output.
          expect(container.childElementCount).toBeGreaterThan(0);
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );

    // Coverage: the set of supported variants covers every registered id (no
    // archetype lacks a variant). Falling back yields the default id.
    const covered = new Set<string>();
    for (const a of SITE_ARCHETYPES) {
      const { container, unmount } = renderWithPui(
        <SidebarBrand {...baseProps} variant={a.id} />
      );
      covered.add(findSidebarRoot(container).getAttribute('data-variant')!);
      unmount();
    }
    for (const a of SITE_ARCHETYPES) {
      expect(covered.has(a.id)).toBe(true);
    }
    expect(DEFAULT_ARCHETYPE_ID).toBeTruthy();
  });

  // Feature: puijs-theming-and-test-platform, Property 19: Variant-only
  // composition — no inline styles or ad-hoc wrappers (the SidebarBrand root has
  // no inline style attribute; appearance is via data attributes).
  // Validates: Requirements 12.6, 15.3
  it('Property 19: variant selection applies via data attributes, no inline style', () => {
    fc.assert(
      fc.property(variantArb, fc.boolean(), (variant, startCollapsed) => {
        const { container, unmount } = renderWithPui(
          <SidebarBrand
            {...baseProps}
            variant={variant}
            defaultCollapsed={startCollapsed}
          />
        );
        try {
          const root = findSidebarRoot(container);
          // Appearance is data-attribute-driven, not inline-style-driven.
          expect(root.getAttribute('style')).toBeNull();
          // Variant is surfaced via data-variant; state via data-collapsed.
          expect(root.getAttribute('data-variant')).toBe(variant);
          expect(root).toHaveAttribute('data-collapsed');
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });
});
