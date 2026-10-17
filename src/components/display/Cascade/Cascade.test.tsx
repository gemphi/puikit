import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Cascade } from './index';

describe('Cascade', () => {
  it('repeats the item behind itself, farthest first, copies hidden from assistive tech', () => {
    const { container, getAllByText } = render(<Cascade depth={3}><span>Look</span></Cascade>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.cascade).toBe('3');
    expect(getAllByText('Look')).toHaveLength(4);
    const copies = root.querySelectorAll('[aria-hidden="true"]');
    expect([...copies].map((c) => (c as HTMLElement).style.getPropertyValue('--pui-cascade-k'))).toEqual(['3', '2', '1']);
  });
  it('renders the item alone at depth 0', () => {
    const { container } = render(<Cascade depth={0}><span>x</span></Cascade>);
    expect(container.innerHTML).toBe('<span>x</span>');
  });
  it('pockets the item: inset sheets at the bottom, front sheet first level, all hidden from assistive tech', () => {
    const { container } = render(<Cascade depth={3} pocket={4}><span>Look</span></Cascade>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.pocket).toBe('4');
    const sheets = root.querySelectorAll('[data-pocket-sheet]');
    expect([...sheets].map((c) => (c as HTMLElement).style.getPropertyValue('--pui-pocket-k'))).toEqual(['4', '3', '2', '1']);
    expect((sheets[0].parentElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });
  it('a tint marks the container so copies and sheets take the colour', () => {
    const { container } = render(<Cascade depth={0} pocket={3} tint="#aabbcc"><span>x</span></Cascade>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute('data-tinted')).toBe(true);
    expect(root.style.getPropertyValue('--pui-cascade-tint')).toBe('#aabbcc');
  });
  it('the cap mirrors the pocket at the top', () => {
    const { container } = render(<Cascade depth={0} pocket={2} cap={3} tint="#aabbcc"><span>x</span></Cascade>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.cap).toBe('3');
    expect(root.querySelectorAll('[data-cap-sheet]')).toHaveLength(3);
    expect(root.querySelectorAll('[data-pocket-sheet]')).toHaveLength(2);
  });
  it('a pocket alone still wraps the item (depth 0, pocket on)', () => {
    const { container } = render(<Cascade depth={0} pocket={2}><span>x</span></Cascade>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.cascade).toBe('0');
    expect(root.querySelectorAll('[data-pocket-sheet]')).toHaveLength(2);
  });
});
