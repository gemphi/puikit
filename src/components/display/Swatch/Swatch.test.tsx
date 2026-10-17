import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Swatch } from './index';
import { Card } from '../card';

describe('Swatch', () => {
  it('shows the exact colour and reads it out', () => {
    render(<Swatch color="#c2185b" label="Crimson" size="md" />);
    const el = screen.getByRole('img', { name: 'Crimson' });
    expect(el.style.getPropertyValue('--pui-swatch')).toBe('#c2185b');
  });
});

describe('Card tint', () => {
  it('sets the surface tokens from the colour on the card (and its deck)', () => {
    const { container, rerender } = render(<Card tint="#1565c0" tintPrimary>tinted</Card>);
    const card = container.querySelector('article')!;
    expect(card.style.getPropertyValue('--pui-card-tint')).toBe('#1565c0');
    expect(card.style.getPropertyValue('--phi-color-primary')).toBe('#1565c0');
    expect(card.hasAttribute('data-tint')).toBe(true);
    rerender(<Card tint="#1565c0" depth={2}>deck</Card>);
    const deck = container.firstElementChild as HTMLElement;
    expect(deck.style.getPropertyValue('--pui-card-tint')).toBe('#1565c0');
    expect(deck.style.getPropertyValue('--phi-color-primary')).toBe('');
  });
});
