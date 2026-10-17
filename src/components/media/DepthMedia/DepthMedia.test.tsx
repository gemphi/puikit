import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { DepthMedia } from './index';

describe('DepthMedia', () => {
  it('nests the three layers parent → mid → front', () => {
    const { container } = render(
      <DepthMedia back={{ src: '/a.png', alt: 'world' }} mid={{ src: '/b.png', alt: 'look' }} front={{ node: <span data-testid="face">AB</span> }}>
        caption
      </DepthMedia>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.layers).toBe('3');
    const imgs = [...root.querySelectorAll('img')].filter((i) => !i.closest('[data-mid-ghost]'));
    expect(imgs.map((i) => i.getAttribute('alt'))).toEqual(['world', 'look']);
    // the photo lives inside the mid layer, which lives inside the frame
    const face = root.querySelector('[data-testid="face"]')!;
    expect(imgs[1].parentElement!.parentElement!.contains(face)).toBe(true);
    expect(root.textContent).toContain('caption');
  });

  it('cascades the slanted mid card: copies fanned behind it, deepest first, hidden from readers', () => {
    const { container, rerender } = render(<DepthMedia back={{ background: 'red' }} mid={{ src: '/b.png', alt: 'look' }} midDeck={3} />);
    const ghosts = [...container.querySelectorAll<HTMLElement>('[data-mid-ghost]')];
    expect(ghosts.map((g) => g.dataset.midGhost)).toEqual(['3', '2', '1']);
    expect(ghosts.every((g) => g.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(ghosts[0].style.getPropertyValue('--pui-mid-k')).toBe('3');
    expect(ghosts[0].querySelector('img')!.getAttribute('src')).toBe('/b.png');
    rerender(<DepthMedia back={{ background: 'red' }} mid={{ src: '/b.png' }} midDeck={0} />);
    expect(container.querySelectorAll('[data-mid-ghost]')).toHaveLength(0);
    rerender(<DepthMedia back={{ background: 'red' }} />);
    expect(container.querySelectorAll('[data-mid-ghost]')).toHaveLength(0);
  });

  it('tracks the pointer as CSS variables and resets on leave', () => {
    const { container } = render(<DepthMedia back={{ background: 'red' }} />);
    const root = container.firstElementChild as HTMLElement;
    root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    // jsdom has no PointerEvent: a MouseEvent of type pointermove carries the coordinates React reads.
    fireEvent(root, new MouseEvent('pointermove', { clientX: 100, clientY: 50, bubbles: true }));
    expect(root.style.getPropertyValue('--pui-depth-x')).toBe('1.000');
    expect(root.style.getPropertyValue('--pui-depth-y')).toBe('0.000');
    fireEvent.pointerLeave(root);
    expect(root.style.getPropertyValue('--pui-depth-x')).toBe('0');
  });

  it('is a keyboard button when clickable', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<DepthMedia back={{ background: 'red' }} onClick={onClick} aria-label="open" />);
    fireEvent.keyDown(getByRole('button', { name: 'open' }), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('DepthMedia deck', () => {
  it('repeats the card image behind it once per level, farthest first', () => {
    const { container } = render(<DepthMedia deck={3} back={{ src: '/a.png', alt: 'scene' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.deck).toBe('3');
    const ghosts = root.querySelectorAll('[aria-hidden="true"]');
    expect(ghosts).toHaveLength(3);
    expect([...ghosts].map((g) => (g as HTMLElement).style.getPropertyValue('--pui-deck-k'))).toEqual(['3', '2', '1']);
    expect(root.querySelectorAll('img[src="/a.png"]')).toHaveLength(4);
  });
  it('caps the deck at 8 and renders no wrapper without one', () => {
    const many = render(<DepthMedia deck={20} back={{ background: 'red' }} />).container.firstElementChild as HTMLElement;
    expect(many.dataset.deck).toBe('8');
    const none = render(<DepthMedia back={{ background: 'red' }} />).container.firstElementChild as HTMLElement;
    expect(none.dataset.deck).toBeUndefined();
  });
});
