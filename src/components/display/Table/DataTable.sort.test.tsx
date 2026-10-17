import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';

const rows = [{ n: 'b', v: 2 }, { n: 'a', v: 3 }, { n: 'c', v: 1 }];
describe('DataTable sorting', () => {
  it('sorts by a header ascending, then descending', () => {
    render(<DataTable rows={rows} getKey={(r) => r.n} columns={[{ id: 'n', header: 'Name', cell: (r) => r.n, sortValue: (r) => r.n }, { id: 'v', header: 'Value', cell: (r) => String(r.v), sortValue: (r) => r.v }]} />);
    const firstCol = () => screen.getAllByRole('row').slice(1).map((tr) => tr.firstElementChild!.textContent);
    fireEvent.click(screen.getByText('Value'));
    expect(firstCol()).toEqual(['c', 'b', 'a']);
    fireEvent.click(screen.getByText('Value'));
    expect(firstCol()).toEqual(['a', 'b', 'c']);
    expect(screen.getByText('Value').closest('th')!.getAttribute('aria-sort')).toBe('descending');
  });
});
