import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { TabList, TabPlace, TabRail } from './index';

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

  it('stands as a rail when asked, and when what holds it says so, with the same tabs', () => {
    const onChange = vi.fn();
    const { getByRole, getAllByRole, unmount } = render(<TabList items={items} activeId="a" place="rail" onChange={onChange} aria-label="Clubs" />);
    const rail = getByRole('tablist', { name: 'Clubs' });
    expect(rail.dataset.place).toBe('rail');
    expect(rail.getAttribute('aria-orientation')).toBe('vertical');
    fireEvent.click(getAllByRole('tab')[1]);
    expect(onChange).toHaveBeenCalledWith('b');
    unmount();
    // A page writes its tabs as a row; the layout that holds them (a record's page) makes them the rail.
    const held = render(<TabPlace.Provider value="rail"><TabList items={items} activeId="a" variant="pills" place="center" /></TabPlace.Provider>);
    expect(held.getByRole('tablist').dataset.place).toBe('rail');
    expect(held.getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
  });

  it('TabRail stands the rail beside what the tab shows, and leaves it out for one tab', () => {
    const onChange = vi.fn();
    const { getByRole, getAllByRole, queryByRole, rerender } = render(<TabRail items={items} activeId="b" onChange={onChange} aria-label="Clubs"><p>swans</p></TabRail>);
    expect(getByRole('tablist', { name: 'Clubs' }).dataset.place).toBe('rail');
    expect(getByRole('tabpanel', { name: 'Satin Swans' }).textContent).toBe('swans');
    // The rail comes before what it shows: it stands at the left.
    expect(getByRole('tablist').compareDocumentPosition(getByRole('tabpanel')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(getAllByRole('tab')[0]);
    expect(onChange).toHaveBeenCalledWith('a');
    rerender(<TabRail items={items.slice(0, 1)} activeId="a"><p>opal</p></TabRail>);
    expect(queryByRole('tablist')).toBeNull();
    expect(getByRole('tabpanel').textContent).toBe('opal');
  });
});
