import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Columns } from './index';

const cols = (onBack = vi.fn(), onClose = vi.fn()) => [
  { id: 'list', title: 'Agents', content: 'list', width: '16rem', closable: true },
  { id: 'chat', title: 'Chat', content: 'chat', expandable: true },
  { id: 'info', title: 'Details', content: 'info', width: '20rem', closable: true, onClose, onBack },
];

describe('Columns', () => {
  it('closes a column into the reopen strip and reopens it', () => {
    render(<Columns columns={cols()} />);
    fireEvent.click(screen.getAllByLabelText('Close')[0]);
    expect(screen.queryByText('list')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Agents' }));
    expect(screen.getByText('list')).toBeTruthy();
  });
  it('expands one column over the row and restores', () => {
    render(<Columns columns={cols()} />);
    fireEvent.click(screen.getByLabelText('Expand'));
    expect(screen.queryByText('list')).toBeNull();
    expect(screen.queryByText('info')).toBeNull();
    fireEvent.click(screen.getByLabelText('Restore'));
    expect(screen.getByText('list')).toBeTruthy();
  });
  it('hands back and caller-owned close to the caller', () => {
    const back = vi.fn(), close = vi.fn();
    render(<Columns columns={cols(back, close)} />);
    fireEvent.click(screen.getByLabelText('Back'));
    expect(back).toHaveBeenCalled();
    fireEvent.click(screen.getAllByLabelText('Close')[1]);
    expect(close).toHaveBeenCalled();
  });
});
