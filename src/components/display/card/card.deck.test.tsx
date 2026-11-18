import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './index';
import { deckShadow } from '../../../utils/deck';

describe('Card depth (decks are off)', () => {
  it('builds no stacked copies: depth is accepted from older callers and draws nothing', () => {
    const { container } = render(<Card depth={3}>top</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('ARTICLE');
    expect(container.querySelectorAll('[data-deck-level]').length).toBe(0);
    expect(el.textContent).toBe('top');
  });
  it('builds nothing in any direction either', () => {
    const { container } = render(<Card depth={2} deckDirection="both">x</Card>);
    expect(container.querySelectorAll('[data-deck-level]').length).toBe(0);
    expect(deckShadow(2, 7, 6, 'down')).toMatch(/^0 7px/);
  });
  it('is a plain card without depth', () => {
    const el = render(<Card>x</Card>).container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('ARTICLE');
    expect(el.dataset.depth).toBeUndefined();
  });
});

import { useCardTint } from './card';
describe('Card tint from its content', () => {
  const Asset = ({ hex }: { hex: string }) => { useCardTint(hex, 22); return <span>asset</span>; };
  it('takes the colour its content reports, and an explicit tint or none wins', async () => {
    const { container, rerender } = render(<Card><Asset hex="#c2185b" /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    const card = () => container.querySelector('article')!;
    expect(card().style.getPropertyValue('--pui-card-tint')).toBe('#c2185b');
    expect(card().getAttribute('data-tint')).toBe('content');
    rerender(<Card tint="none"><Asset hex="#c2185b" /></Card>);
    expect(card().style.getPropertyValue('--pui-card-tint')).toBe('');
  });
  it('does not pass a report through a card with its own tint', async () => {
    const { container } = render(<Card><Card tint="#1565c0"><Asset hex="#c2185b" /></Card></Card>);
    await new Promise((r) => setTimeout(r, 0));
    const [outer, inner] = [...container.querySelectorAll('article')];
    expect(outer.style.getPropertyValue('--pui-card-tint')).toBe('');
    expect(inner.style.getPropertyValue('--pui-card-tint')).toBe('#1565c0');
  });
});

describe('Card with a card inside', () => {
  const Tileish = () => { useCardTint(undefined, undefined, true); return <span>tile</span>; };
  const Face = () => { useCardTint('#c2185b', 16); return <span>face</span>; };
  it('keeps its own surface and padding when its content is a tile: the tile is its inner layer', async () => {
    const { container } = render(<Card depth={2}><Face /><Tileish /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    const card = container.querySelector('article')!;
    expect(card.getAttribute('data-surface')).toBeNull();
    expect(container.querySelectorAll('[data-deck-level]').length).toBe(0);
  });
  it('keeps its surface when it holds several tiles (a list or a sheet)', async () => {
    const { container } = render(<Card><Tileish /><Tileish /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('article')!.getAttribute('data-surface')).toBeNull();
  });
  it('keeps its surface when a tile leaves too (never bare)', async () => {
    const { container, rerender } = render(<Card><Tileish /><Tileish /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    rerender(<Card><Tileish /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('article')!.getAttribute('data-surface')).toBeNull();
  });
  it('never goes bare with tint="none" (a drawer, a modal)', async () => {
    const { container } = render(<Card tint="none"><Tileish /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('article')!.getAttribute('data-surface')).toBeNull();
  });
  it('takes the first colour reported (its own subject)', async () => {
    const { container } = render(<Card><Face /></Card>);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('article')!.style.getPropertyValue('--pui-card-tint')).toBe('#c2185b');
  });
});
