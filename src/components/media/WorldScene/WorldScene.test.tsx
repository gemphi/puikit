import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { WorldScene } from './index';

describe('WorldScene', () => {
  it('draws the sun cut like the profile circles: ring, top semicircle, two bottom quarters', () => {
    const { container } = render(<WorldScene seed="w_opalia" />);
    const sun = container.querySelector('[data-part="sun"]')!;
    expect(sun.querySelectorAll('circle')).toHaveLength(1);
    const paths = [...sun.querySelectorAll('path')].map((p) => p.getAttribute('d')!);
    expect(paths).toHaveLength(3);
    expect(paths[0]).toMatch(/A.* 0 0 1 /); // top semicircle
  });
  it('is stable per seed and different across seeds', () => {
    const a = render(<WorldScene seed="w_a" />).container.innerHTML;
    const b = render(<WorldScene seed="w_a" />).container.innerHTML;
    const c = render(<WorldScene seed="w_b" />).container.innerHTML;
    expect(a).toBe(b); expect(a).not.toBe(c);
  });
});
