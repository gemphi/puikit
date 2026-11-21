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

  it('is one stop for the Tab key, and the arrows move between the tabs that can be picked', () => {
    const onChange = vi.fn();
    const { getAllByRole, getByRole } = render(<TabList items={items} activeId="b" onChange={onChange} />);
    const tabs = getAllByRole('tab');
    expect(tabs.map((x) => x.tabIndex)).toEqual([-1, 0, -1]);
    expect(tabs.map((x) => x.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    tabs[1].focus();
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[0]); // the disabled tab is passed over, round to the first
    fireEvent.keyDown(getByRole('tablist'), { key: 'End' });
    expect(document.activeElement).toBe(tabs[1]);
    expect(onChange).not.toHaveBeenCalled(); // moving is not picking: Enter or Space picks
  });

  it('gives the Tab key the first tab when none is on', () => {
    const { getAllByRole } = render(<TabList items={items} />);
    expect(getAllByRole('tab').map((x) => x.tabIndex)).toEqual([0, -1, -1]);
  });
});
