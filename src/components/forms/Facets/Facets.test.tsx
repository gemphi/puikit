import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FacetFilters, facetCols } from './index';

const facets = [
  { id: 'rarity', label: 'Rarity', options: [{ id: 'Rare', label: 'Rare', count: 3 }, { id: 'Epic', label: 'Epic', count: 2 }] },
  { id: 'colour', label: 'Colour', options: [{ id: 'Cornflower to navy', label: 'Cornflower to navy', count: 1 }] },
  { id: 'world', label: 'World', options: [{ id: 'w', label: 'A very long world name for the test', count: 1 }] },
  { id: 'pool', label: 'Pool', options: [{ id: 'p', label: 'P', count: 1 }] },
];

describe('FacetFilters', () => {
  it('picks one, two or three options a row from the labels', () => {
    expect(facetCols(['All', 'Rare · 3'])).toBe(3);
    expect(facetCols(['Cornflower · 12'])).toBe(2);
    expect(facetCols(['A very long world name for the test'])).toBe(1);
  });
  it('folds groups past the first three and shows the choice in the header', () => {
    const onSelect = vi.fn();
    const { container } = render(<FacetFilters facets={facets} selected={{ rarity: 'Epic' }} onSelect={onSelect} sorts={[{ id: 'a', label: 'A to Z' }]} sort="a" />);
    const heads = [...container.querySelectorAll('button[aria-expanded]')];
    expect(heads.map((h) => h.getAttribute('aria-expanded'))).toEqual(['true', 'true', 'true', 'false', 'false']);
    expect(screen.getByRole('group', { name: 'Rarity' }).textContent).toContain('Epic');
    fireEvent.click(heads[3]); expect(heads[3].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('checkbox', { name: /Rare/ })); expect(onSelect).toHaveBeenCalledWith('rarity', 'Rare');
  });
});
