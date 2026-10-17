import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithPui } from '../../../test/renderWithPui';
import { DataTable } from './DataTable';

type R = { id: string; name: string; group: string };
const rows: R[] = [
  { id: 'a', name: 'Floor price', group: 'price' }, { id: 'b', name: 'Top offer', group: 'price' },
  { id: 'c', name: 'Volume 24h', group: 'volume' },
];
const cols = [{ id: 'name', header: 'Stat', cell: (r: R) => r.name }];

/** Grouped tables: each group a header row (label · count) that expands and collapses; sticky and limit modes. */
describe('DataTable groups', () => {
  it('sections rows under group headers with counts', () => {
    renderWithPui(<DataTable rows={rows} getKey={(r) => r.id} columns={cols} groupBy={(r) => r.group} />);
    expect(screen.getByRole('button', { name: /price · 2/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /volume · 1/ })).toBeTruthy();
    expect(screen.getByText('Top offer')).toBeTruthy();
  });
  it('collapses and expands a group', () => {
    renderWithPui(<DataTable rows={rows} getKey={(r) => r.id} columns={cols} groupBy={(r) => r.group} />);
    fireEvent.click(screen.getByRole('button', { name: /price · 2/ }));
    expect(screen.queryByText('Floor price')).toBeNull();
    expect(screen.getByText('Volume 24h')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /price · 2/ }));
    expect(screen.getByText('Floor price')).toBeTruthy();
  });
  it('starts the named groups collapsed', () => {
    renderWithPui(<DataTable rows={rows} getKey={(r) => r.id} columns={cols} groupBy={(r) => r.group} collapsed={['volume']} />);
    expect(screen.queryByText('Volume 24h')).toBeNull();
  });
  it('limits ungrouped rows with a show-all toggle', () => {
    renderWithPui(<DataTable rows={rows} getKey={(r) => r.id} columns={cols} limit={2} stickyHeader stickyFirst maxHeight="10rem" />);
    expect(screen.queryByText('Volume 24h')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show all 3' }));
    expect(screen.getByText('Volume 24h')).toBeTruthy();
  });
});
