import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderWithPui } from '../../../test/renderWithPui';
import { SidebarBrand, type SidebarBrandProps } from './brand';
import { DEFAULT_ARCHETYPE_ID } from '../../../providers/archetypes';

/**
 * Task 8.3 — theming/gradient/variant wiring for SidebarBrand.
 *
 * These tests cover the behavior added by wiring `usePuiTheme` into
 * `SidebarBrand`: `data-variant` defaults to the ACTIVE archetype id when the
 * `variant` prop is omitted, an explicit `variant` overrides it, and the
 * component renders safely outside a `PuiProvider` (context defaults).
 *
 * Requirement 12.6 — appearance flows from tokens + data attributes only; the
 * variant is surfaced as `data-variant` on the sidebar root.
 */

const baseProps: SidebarBrandProps = {
  logoLabel: 'Acme',
  automations: [{ id: 'a1', label: 'Nightly sync' }],
  recentSessions: [{ id: 's1', label: 'Draft plan' }],
  account: { name: 'Ada Lovelace' },
};

/** The sidebar root carries both data-collapsed and data-variant. */
const findSidebarRoot = (container: HTMLElement): HTMLElement => {
  const root = container.querySelector('[data-variant]');
  if (!(root instanceof HTMLElement)) {
    throw new Error('SidebarBrand root with data-variant not found');
  }
  return root;
};

describe('SidebarBrand theming + variant wiring (8.3)', () => {
  it('defaults data-variant to the active archetype id when variant is omitted', () => {
    const { container } = renderWithPui(<SidebarBrand {...baseProps} />, {
      preferences: { archetypeId: 'docs' },
    });
    expect(findSidebarRoot(container).getAttribute('data-variant')).toBe('docs');
  });

  it('falls back to the default archetype id when no provider preference is set', () => {
    const { container } = renderWithPui(<SidebarBrand {...baseProps} />);
    expect(findSidebarRoot(container).getAttribute('data-variant')).toBe(
      DEFAULT_ARCHETYPE_ID
    );
  });

  it('uses an explicit variant prop over the active archetype id', () => {
    const { container } = renderWithPui(
      <SidebarBrand {...baseProps} variant="marketplace" />,
      { preferences: { archetypeId: 'docs' } }
    );
    expect(findSidebarRoot(container).getAttribute('data-variant')).toBe(
      'marketplace'
    );
  });

  it('renders safely outside a PuiProvider using context defaults', () => {
    const { container } = render(<SidebarBrand {...baseProps} />);
    const root = findSidebarRoot(container);
    expect(root.getAttribute('data-variant')).toBe(DEFAULT_ARCHETYPE_ID);
    expect(root.getAttribute('data-collapsed')).toBe('false');
  });

  it('applies appearance via data attributes only (no inline style on root)', () => {
    const { container } = renderWithPui(<SidebarBrand {...baseProps} />, {
      preferences: { themeStyle: 'gradient' },
    });
    const root = findSidebarRoot(container);
    expect(root.getAttribute('style')).toBeNull();
    expect(root).toHaveAttribute('data-collapsed');
    expect(root).toHaveAttribute('data-variant');
  });
});
