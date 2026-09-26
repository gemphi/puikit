import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithPui } from '../test/renderWithPui';
import { deriveGradientTreatment } from './gradient';
import { BRAND_THEMES } from './themes';
import type { BrandTheme } from './types';

/**
 * Snapshot + responsive contract tests for Gradient-by-Default
 * (Test_Platform, Task 5.2).
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 9.3
 *
 * jsdom does not evaluate CSS media queries, so the responsive gradient
 * behavior (Req 9.1-9.3) is asserted against its deterministic contract: the
 * provider-supplied `--phi-gradient-parent` / `--phi-gradient-child` custom
 * properties and the `data-gradient-default` root attribute are present, and
 * the participating elements carry the `data-gradient-parent` /
 * `data-gradient-child` data-attributes that `_theme-styles.scss` binds those
 * tokens to across its breakpoints (576px / 768px / 992px). We capture that
 * contract at two configured viewport widths (narrow vs wide) to satisfy the
 * "minimum of two viewport-width conditions" requirement (Req 4.3, 9.3).
 *
 * Kit-agnostic test logic: only puijs theming values are referenced and no
 * other UI kit is imported ("One UI Kit Per App").
 */

const root = () => document.documentElement;

/**
 * A minimal representative component: a parent element marked
 * `data-gradient-parent` containing a child marked `data-gradient-child`. The
 * gradient itself flows purely from provider tokens + these data-attributes;
 * the component authors no gradient CSS (Req 9.1).
 */
const GradientDemo: React.FC = () => (
  <section data-gradient-parent data-testid="gradient-parent">
    <div data-gradient-child data-testid="gradient-child">
      Gradient content
    </div>
  </section>
);

/**
 * Simulate a viewport width. jsdom exposes a writable `innerWidth`; we set it so
 * a test documents the width condition under which the contract is captured.
 * (jsdom won't apply the SCSS media query, so the assertion targets the
 * deterministic token/attribute contract rather than a computed style.)
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
}

/** The brand `renderWithPui` defaults to (`foundry`), for token expectations. */
const foundry = BRAND_THEMES.find((b) => b.id === 'foundry') as BrandTheme;

afterEach(() => {
  cleanup();
});

describe('Gradient-by-Default snapshot + custom properties (Req 4.1, 4.2)', () => {
  it('captures the gradient markup and applied gradient custom properties in gradient style', () => {
    const { container } = renderWithPui(<GradientDemo />, {
      preferences: { theme: 'light', themeStyle: 'gradient' },
    });

    // Req 4.1 / 4.2: snapshot the rendered gradient markup. A stored snapshot
    // fails the test on any unintended change to the default markup.
    expect(container.firstChild).toMatchSnapshot('gradient-style-markup');

    // The document root opts into gradient-by-default (Req 8.1/8.2 binding).
    expect(root().getAttribute('data-gradient-default')).toBe('true');

    // The provider-supplied custom properties match the derived treatment.
    const expected = deriveGradientTreatment(foundry, 'gradient', false);
    expect(expected).not.toBeNull();
    expect(root().style.getPropertyValue('--phi-gradient-parent')).toBe(expected!.parent);
    expect(root().style.getPropertyValue('--phi-gradient-child')).toBe(expected!.child);

    // Participating elements carry the data-attributes the SCSS binds to.
    expect(container.querySelector('[data-gradient-parent]')).not.toBeNull();
    expect(container.querySelector('[data-gradient-child]')).not.toBeNull();

    // Snapshot the applied custom-property contract itself so drift is caught.
    expect({
      dataGradientDefault: root().getAttribute('data-gradient-default'),
      parent: root().style.getPropertyValue('--phi-gradient-parent'),
      child: root().style.getPropertyValue('--phi-gradient-child'),
    }).toMatchSnapshot('gradient-style-custom-properties');
  });

  it('applies no gradient-by-default in a non-gradient style (apple)', () => {
    const { container } = renderWithPui(<GradientDemo />, {
      preferences: { theme: 'light', themeStyle: 'apple' },
    });

    // Req 8.3: no gradient-by-default attribute and the custom properties are
    // cleared when the style is not `gradient`.
    expect(root().getAttribute('data-gradient-default')).toBeNull();
    expect(root().style.getPropertyValue('--phi-gradient-parent')).toBe('');
    expect(root().style.getPropertyValue('--phi-gradient-child')).toBe('');

    // Snapshot the non-gradient markup so the default (no gradient) output is
    // guarded against unintended change (Req 4.2).
    expect(container.firstChild).toMatchSnapshot('apple-style-markup');
  });
});

describe('Responsive gradient behavior at two viewport conditions (Req 4.3, 9.3)', () => {
  /**
   * jsdom does not apply CSS media queries, so we assert the deterministic
   * SCSS/custom-property contract at each width: the custom properties are set
   * and the participating elements carry the data-attributes the breakpoint
   * rules bind to. Capturing two width conditions (narrow < 576px and wide
   * >= 992px) satisfies the "minimum of two viewport-width conditions"
   * requirement.
   */
  const cases: Array<{ label: string; width: number }> = [
    { label: 'narrow (<576px)', width: 375 },
    { label: 'wide (>=992px)', width: 1280 },
  ];

  for (const { label, width } of cases) {
    it(`holds the gradient token/attribute contract at ${label}`, () => {
      setViewportWidth(width);

      const { container } = renderWithPui(<GradientDemo />, {
        preferences: { theme: 'light', themeStyle: 'gradient' },
      });

      // The gradient-by-default contract is deterministic across widths: the
      // root attribute and both custom properties are present, and both
      // participating elements carry the binding data-attributes that the
      // responsive breakpoint rules target.
      expect(window.innerWidth).toBe(width);
      expect(root().getAttribute('data-gradient-default')).toBe('true');
      expect(root().style.getPropertyValue('--phi-gradient-parent')).not.toBe('');
      expect(root().style.getPropertyValue('--phi-gradient-child')).not.toBe('');
      expect(container.querySelector('[data-gradient-parent]')).not.toBeNull();
      expect(container.querySelector('[data-gradient-child]')).not.toBeNull();

      // Snapshot the rendered markup at this width condition (Req 4.3).
      expect(container.firstChild).toMatchSnapshot(`responsive-markup-${label}`);
    });
  }

  it('captures the responsive contract side-by-side at both widths', () => {
    const snapshot: Record<string, unknown> = {};

    for (const { label, width } of cases) {
      setViewportWidth(width);
      renderWithPui(<GradientDemo />, {
        preferences: { theme: 'light', themeStyle: 'gradient' },
      });

      snapshot[label] = {
        width,
        dataGradientDefault: root().getAttribute('data-gradient-default'),
        parent: root().style.getPropertyValue('--phi-gradient-parent'),
        child: root().style.getPropertyValue('--phi-gradient-child'),
      };

      cleanup();
    }

    // A single snapshot spanning both configured widths documents that the
    // token contract is stable across the responsive conditions (Req 9.3).
    expect(snapshot).toMatchSnapshot('responsive-contract-two-widths');
  });
});
