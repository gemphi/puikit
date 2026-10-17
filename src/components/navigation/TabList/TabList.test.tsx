import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { TabList } from './index';

describe('TabList', () => {
  const items = [{ id: 'a', label: 'Maison Opal' }, { id: 'b', label: 'Satin Swans', count: 4 }, { id: 'c', label: 'Off', disabled: true }];

  it('renders one row of tabs with the active one selected', () => {
    const { getAllByRole, getByRole } = render(<TabList items={items} activeId="b" variant="pills" aria-label="Clubs" />);
    expect(getByRole('tablist', { name: 'Clubs' })).toBeTruthy();
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].textContent).toBe('Satin Swans4');
  });

  it('changes on click and ignores disabled tabs', () => {
    const onChange = vi.fn();
    const { getAllByRole } = render(<TabList items={items} activeId="a" onChange={onChange} />);
    fireEvent.click(getAllByRole('tab')[1]);
    fireEvent.click(getAllByRole('tab')[2]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('measures the active tab for the sliding indicator', () => {
    const { getByRole } = render(<TabList items={items} activeId="a" variant="pills" />);
    const row = getByRole('tablist');
    expect(row.dataset.ready).toBe('true');
    expect(row.style.getPropertyValue('--pui-tab-x')).toBe('0px');
  });
});
