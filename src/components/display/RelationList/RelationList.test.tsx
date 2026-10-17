import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { RelationList } from './index';

describe('RelationList', () => {
  const items = Array.from({ length: 9 }, (_, i) => ({ id: 'w' + i, label: 'World ' + i }));
  it('groups related records, hides empty groups and folds long ones', () => {
    const open = vi.fn();
    const { getByText, queryByText, getAllByRole } = render(
      <RelationList title="Connected" max={3} groups={[{ id: 'worlds', label: 'Worlds', items: items.map((x) => ({ ...x, onClick: open })) }, { id: 'none', label: 'Nothing', items: [] }]} />,
    );
    expect(queryByText('Nothing')).toBeNull();
    expect(getAllByRole('button').filter((b) => /World/.test(b.textContent ?? ''))).toHaveLength(3);
    fireEvent.click(getByText('Show all 9'));
    expect(getAllByRole('button').filter((b) => /World/.test(b.textContent ?? ''))).toHaveLength(9);
    fireEvent.click(getByText('World 4'));
    expect(open).toHaveBeenCalled();
  });
});
