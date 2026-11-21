import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Sections } from './index';

const secs = [
  { id: 'top', title: 'Media', content: 'media', expandable: true, collapsible: true },
  { id: 'mid', title: 'Buy', content: 'buy', closable: true },
  { id: 'bot', title: 'Stats', content: 'stats', collapsible: true, defaultCollapsed: true },
];

describe('Sections', () => {
  it('folds and unfolds a row, and starts folded when asked', () => {
    render(<Sections sections={secs} />);
    expect(screen.queryByText('stats')).toBeNull();
    fireEvent.click(screen.getAllByLabelText('Fold')[0]);
    expect(screen.queryByText('media')).toBeNull();
  });
  it('expands one row over the column and restores', () => {
    render(<Sections sections={secs} />);
    fireEvent.click(screen.getByLabelText('Expand', { selector: '[aria-pressed]' }));
    expect(screen.queryByText('buy')).toBeNull();
    fireEvent.click(screen.getByLabelText('Restore'));
    expect(screen.getByText('buy')).toBeTruthy();
  });
  it('closes a row into the reopen strip', () => {
    render(<Sections sections={secs} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('buy')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(screen.getByText('buy')).toBeTruthy();
  });
});

describe('Sections: the reader sets the order', () => {
  it('moves a section with the arrows on the right, keeps it and resets', () => {
    localStorage.clear();
    const { unmount } = render(<Sections reorderable storageKey="t1" sections={secs} />);
    const titles = () => screen.getAllByRole('region').map((r) => r.getAttribute('data-section'));
    expect(titles()).toEqual(['top', 'mid', 'bot']);
    // A move that cannot be made is not shown: no Move up on the first section, no Move down on the last.
    expect(screen.getAllByLabelText('Move up')).toHaveLength(2);
    expect(screen.getAllByLabelText('Move down')).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('Move down')[0]);
    expect(titles()).toEqual(['mid', 'top', 'bot']);
    unmount();
    render(<Sections reorderable storageKey="t1" sections={secs} />);
    expect(titles()).toEqual(['mid', 'top', 'bot']);
    fireEvent.click(screen.getByRole('button', { name: 'Reset layout' }));
    expect(titles()).toEqual(['top', 'mid', 'bot']);
  });
});
