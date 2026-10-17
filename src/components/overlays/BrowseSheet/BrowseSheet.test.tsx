import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowseSheet } from './index';

describe('BrowseSheet', () => {
  it('takes data for each area: filters left, grid centre, layout + aside right', () => {
    const onSelect = vi.fn(), onLayout = vi.fn();
    render(<BrowseSheet isOpen onClose={() => {}} title="Drops" count="3"
      facets={[{ id: 'kind', label: 'Kind', options: [{ id: 'show', label: 'Show', count: 2 }, { id: 'pft', label: 'PFT', count: 1 }] }]}
      selected={{}} onSelect={onSelect} layout={{ mode: 'grid', cols: 3 }} onLayout={onLayout} aside={<span>chat here</span>}>
      <span>a</span><span>b</span><span>c</span>
    </BrowseSheet>);
    expect(screen.getByText('chat here')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Show/ }));
    expect(onSelect).toHaveBeenCalledWith('kind', 'show');
    fireEvent.click(screen.getByRole('tab', { name: 'Tile' }));
    expect(onLayout).toHaveBeenCalledWith({ mode: 'tile', cols: 3 });
  });
});
