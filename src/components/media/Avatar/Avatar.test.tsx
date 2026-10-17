import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Avatar } from './index';

describe('Avatar default profile icon', () => {
  it('draws the ring, the top semicircle and the two bottom quarters when there is no photo', () => {
    const { container } = render(<Avatar initials="NH" alt="Noor Hale" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.tone).toMatch(/^[0-5]$/);
    const disc = root.querySelector('[aria-hidden="true"]')!;
    expect(disc.children).toHaveLength(3);
    expect(root.textContent).toBe('NH');
  });
  it('keeps the same shade set for the same seed and none for photos or shades={false}', () => {
    const a = render(<Avatar initials="A" seed="w_opalia" />).container.firstElementChild as HTMLElement;
    const b = render(<Avatar initials="B" seed="w_opalia" />).container.firstElementChild as HTMLElement;
    expect(a.dataset.tone).toBe(b.dataset.tone);
    expect((render(<Avatar src="/x.png" alt="x" />).container.firstElementChild as HTMLElement).dataset.tone).toBeUndefined();
    expect((render(<Avatar initials="C" shades={false} />).container.firstElementChild as HTMLElement).querySelector('[aria-hidden]')).toBeNull();
  });
});

describe('Avatar sprite', () => {
  it('cuts one cell from a sheet', async () => {
    const { Avatar, spriteVars } = await import('./index');
    const v = spriteVars({ src: 's.webp', cols: 8, index: 9 }) as Record<string, string>;
    expect(v['--pui-sprite-size']).toBe('800% 800%'); expect(v['--pui-sprite-pos']).toBe(`${(1 / 7) * 100}% ${(1 / 7) * 100}%`);
    const { getByRole } = render(<Avatar alt="Pup" sprite={{ src: 's.webp', cols: 8, index: 9 }} />);
    expect(getByRole('img', { name: 'Pup' })).toBeTruthy();
  });
});
