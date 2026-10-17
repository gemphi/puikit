import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { StatusRail } from './index';
import { deckShadow } from '../../../utils/deck';

describe('StatusRail', () => {
  it('renders each status as one capsule holding its thumbnail and caption', () => {
    const open = vi.fn();
    const { getAllByRole, getByRole } = render(<StatusRail aria-label="Stories" items={[
      { id: 'a', thumb: <span data-testid="t">A</span>, label: 'noor.hale', sub: 'Live', live: true, onClick: open },
      { id: 'b', thumb: <span>B</span>, label: 'ines.v', seen: true },
    ]} />);
    expect(getByRole('list', { name: 'Stories' })).toBeTruthy();
    const items = getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('Anoor.haleLive');
    fireEvent.click(items[0]); expect(open).toHaveBeenCalledOnce();
  });
});

describe('deck direction', () => {
  it('stacks copies above by default and below for the opposite cascade', () => {
    expect(deckShadow(2)).toMatch(/^0 -7px/);
    expect(deckShadow(2, 7, 6, 'down')).toMatch(/^0 7px/);
  });
});
