import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderWithPui } from '../../../test/renderWithPui';
import { SidebarBrand, type SidebarBrandProps } from './brand';
import { DEFAULT_ARCHETYPE_ID } from '../../../providers/archetypes';

/**
 * Task 8.5 — unit + smoke tests for {@link SidebarBrand}.
 *
 * This file is intentionally separate from `brand.test.tsx` (8.3 theming/variant
 * wiring) and the property tests (8.4). It covers:
 *
 * 1. Region presence — logo/header, Automations section, New Session action,
 *    recent-sessions panel, footer account menu (R12.1).
 * 2. Open vs collapsed rendering — labels visible when open, icon-only when
 *    collapsed (R12.2, R12.4).
 * 3. Theme/gradient participation — rendering under a gradient `PuiProvider`
 *    does not throw and the sidebar carries `data-variant` (R12.6).
 * 4. One UI Kit Per App — a source-level smoke test asserting `brand.tsx`
 *    imports ONLY puijs (relative), `lucide-react`, and `react`, and imports NO
 *    other UI kit.
 */

const baseProps: SidebarBrandProps = {
  logoLabel: 'Acme',
  automations: [
    { id: 'a1', label: 'Nightly sync' },
    { id: 'a2', label: 'Weekly report' },
  ],
  recentSessions: [
    { id: 's1', label: 'Draft plan' },
    { id: 's2', label: 'Review notes' },
  ],
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

describe('SidebarBrand regions (8.5, R12.1)', () => {
  it('renders the logo/header region with the logo label when open', () => {
    const { container, getByText } = renderWithPui(
      <SidebarBrand {...baseProps} />
    );
    // Header region is present as the card header hook.
    expect(container.querySelector('.pui-sidebar-header')).not.toBeNull();
    // Logo label is visible in the open state.
    expect(getByText('Acme')).toBeInTheDocument();
  });

  it('renders the collapse control with an accessible name', () => {
    const { getByRole } = renderWithPui(<SidebarBrand {...baseProps} />);
    // Open state -> control offers to collapse.
    expect(
      getByRole('button', { name: 'Collapse sidebar' })
    ).toBeInTheDocument();
  });

  it('renders the Automations section heading and its entries', () => {
    const { getByText } = renderWithPui(<SidebarBrand {...baseProps} />);
    expect(getByText('Automations')).toBeInTheDocument();
    expect(getByText('Nightly sync')).toBeInTheDocument();
    expect(getByText('Weekly report')).toBeInTheDocument();
  });

  it('renders the New Session action', () => {
    const { getByRole } = renderWithPui(<SidebarBrand {...baseProps} />);
    expect(getByRole('button', { name: 'New session' })).toBeInTheDocument();
  });

  it('renders the recent-sessions panel and its entries', () => {
    const { getByText } = renderWithPui(<SidebarBrand {...baseProps} />);
    expect(getByText('Recent sessions')).toBeInTheDocument();
    expect(getByText('Draft plan')).toBeInTheDocument();
    expect(getByText('Review notes')).toBeInTheDocument();
  });

  it('renders the footer account menu with the account name', () => {
    const { container, getByText } = renderWithPui(
      <SidebarBrand {...baseProps} />
    );
    expect(container.querySelector('.pui-sidebar-footer')).not.toBeNull();
    expect(getByText('Ada Lovelace')).toBeInTheDocument();
  });
});

describe('SidebarBrand open vs collapsed rendering (8.5, R12.2/R12.4)', () => {
  it('shows labels in the open state (data-collapsed="false")', () => {
    const { container, queryByText } = renderWithPui(
      <SidebarBrand {...baseProps} defaultCollapsed={false} />
    );
    const root = findSidebarRoot(container);
    expect(root.getAttribute('data-collapsed')).toBe('false');
    // Text labels are present when open.
    expect(queryByText('Acme')).not.toBeNull();
    expect(queryByText('Automations')).not.toBeNull();
    expect(queryByText('Recent sessions')).not.toBeNull();
    expect(queryByText('New session')).not.toBeNull();
    expect(queryByText('Nightly sync')).not.toBeNull();
    expect(queryByText('Ada Lovelace')).not.toBeNull();
  });

  it('renders icon-only (no text labels) in the collapsed state', () => {
    const { container, queryByText } = renderWithPui(
      <SidebarBrand {...baseProps} defaultCollapsed />
    );
    const root = findSidebarRoot(container);
    expect(root.getAttribute('data-collapsed')).toBe('true');
    // Section labels and entry labels are hidden when collapsed.
    expect(queryByText('Acme')).toBeNull();
    expect(queryByText('Automations')).toBeNull();
    expect(queryByText('Recent sessions')).toBeNull();
    expect(queryByText('New session')).toBeNull();
    expect(queryByText('Nightly sync')).toBeNull();
    expect(queryByText('Ada Lovelace')).toBeNull();

    // Icon-only controls remain reachable via their accessible names/titles.
    expect(root.querySelector('.pui-sidebar-header')).not.toBeNull();
    expect(root.querySelector('.pui-sidebar-footer')).not.toBeNull();
  });

  it('exposes the expand control when collapsed', () => {
    const { getByRole } = renderWithPui(
      <SidebarBrand {...baseProps} defaultCollapsed />
    );
    expect(getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });
});

describe('SidebarBrand theme/gradient participation (8.5, R12.6)', () => {
  it('renders under a gradient PuiProvider without throwing and carries data-variant', () => {
    expect(() =>
      renderWithPui(<SidebarBrand {...baseProps} />, {
        preferences: { themeStyle: 'gradient' },
      })
    ).not.toThrow();
  });

  it('carries data-variant on the sidebar root under gradient style', () => {
    const { container } = renderWithPui(<SidebarBrand {...baseProps} />, {
      preferences: { themeStyle: 'gradient' },
    });
    const root = findSidebarRoot(container);
    expect(root).toHaveAttribute('data-variant');
    // Appearance flows from tokens + data attributes only — no inline style.
    expect(root.getAttribute('style')).toBeNull();
    // Default variant tracks the active archetype id.
    expect(root.getAttribute('data-variant')).toBe(DEFAULT_ARCHETYPE_ID);
  });
});

describe('SidebarBrand One UI Kit Per App smoke (8.5)', () => {
  // Resolve the source file relative to the package root so the smoke test
  // reads the actual `brand.tsx` source (not a compiled/bundled artifact),
  // regardless of the test runner's module-URL scheme.
  const brandSourcePath = path.resolve(
    process.cwd(),
    'src/components/navigation/sidebar/brand.tsx'
  );
  const brandSource = readFileSync(brandSourcePath, 'utf8');

  /** Extract the module specifier from every static `import ... from '<x>'`. */
  const importSpecifiers = (source: string): string[] => {
    const specs: string[] = [];
    const re = /import\s+[^;]*?from\s+['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      specs.push(m[1]);
    }
    return specs;
  };

  it('imports only puijs (relative), lucide-react, and react', () => {
    const specs = importSpecifiers(brandSource);
    expect(specs.length).toBeGreaterThan(0);

    for (const spec of specs) {
      const isRelativePuijs = spec.startsWith('.') || spec.startsWith('..');
      const isAllowedExternal = spec === 'react' || spec === 'lucide-react';
      expect(
        isRelativePuijs || isAllowedExternal,
        `Unexpected import "${spec}" in brand.tsx — only puijs (relative), react, and lucide-react are allowed`
      ).toBe(true);
    }
  });

  it('imports NO other UI kit (One UI Kit Per App)', () => {
    const specs = importSpecifiers(brandSource);
    // Forbidden UI-kit / other-kit package specifiers.
    const forbidden = [
      'buikit',
      'suikit',
      'puikit',
      '@mui/material',
      '@mui/',
      'antd',
      '@chakra-ui/react',
      '@chakra-ui/',
      '@mantine/core',
      'react-bootstrap',
      '@radix-ui/',
      '@fluentui/',
      'semantic-ui-react',
      'grommet',
      '@blueprintjs/core',
    ];

    for (const spec of specs) {
      for (const bad of forbidden) {
        expect(
          spec === bad || spec.startsWith(bad),
          `brand.tsx imports a forbidden UI kit "${spec}" (matched "${bad}")`
        ).toBe(false);
      }
    }
  });

  it('does not import from a sibling @phiace UI package other than puijs', () => {
    const specs = importSpecifiers(brandSource);
    for (const spec of specs) {
      // No bare @phiace/* imports — the component is self-contained via relatives.
      expect(
        spec.startsWith('@phiace/'),
        `brand.tsx should not import "${spec}"; compose puijs via relative paths`
      ).toBe(false);
    }
  });
});
