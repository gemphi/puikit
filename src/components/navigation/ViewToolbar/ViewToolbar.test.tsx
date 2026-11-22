import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ViewToolbar } from './index';
import { WithHeadTools } from '../../layout/HeadTools';
import { Deck } from '../../layout/Deck';

describe('ViewToolbar', () => {
  it('shows one icon for the layout shown; a press drops the layouts and a pick changes it', () => {
    const onMode = vi.fn();
    render(<ViewToolbar mode="grid" onMode={onMode} title="Apps" count="3" noun="items" />);
    expect(screen.getByText('Apps')).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByLabelText('Layout · Grid'));
    expect(screen.getAllByRole('menuitemradio').map((x) => x.textContent)).toEqual(['List', 'Deck', 'Grid']);
    expect(screen.getByRole('menuitemradio', { name: 'Grid' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Deck' }));
    expect(onMode).toHaveBeenCalledWith('deck');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('offers the layout shown even when the data leaves it out, and no switch for one layout', () => {
    const { unmount } = render(<ViewToolbar mode="tile" onMode={() => {}} modes={['list', 'grid']} />);
    fireEvent.click(screen.getByLabelText('Layout · Tile'));
    expect(screen.getAllByRole('menuitemradio').map((x) => x.textContent)).toEqual(['Tile', 'List', 'Grid']);
    unmount();
    render(<ViewToolbar mode="grid" onMode={() => {}} modes={['grid']} />);
    expect(screen.queryByLabelText(/Layout/)).toBeNull();
  });

  it('lays the total, its word and the layout at the left, search in the centre, Filter and Sort at the right', () => {
    const onFilters = vi.fn(), onSort = vi.fn();
    const { container } = render(<ViewToolbar mode="list" onMode={() => {}} count="79" noun="items" search="" onSearch={() => {}} center={<span>tabs</span>}
      onFilters={onFilters} activeFilters={2} onSort={onSort} sortLabel="Name" />);
    // In the order they are read: the total on its own ground, the word, the layout, then the centre, then the right.
    expect(container.textContent).toBe('79itemstabs');
    expect(screen.getAllByRole('button').map((x) => x.getAttribute('aria-label'))).toEqual(['Layout · List', 'Search', 'Filter', 'Sort']);
    expect(screen.getByText('79').textContent).toBe('79');
    fireEvent.click(screen.getByLabelText('Filter')); fireEvent.click(screen.getByLabelText('Sort'));
    expect(onFilters).toHaveBeenCalled(); expect(onSort).toHaveBeenCalled();
    expect(screen.getByLabelText('Filter').getAttribute('aria-pressed')).toBe('true');
  });

  it('opens the search field from its icon, and clears the search when it is closed', () => {
    const onSearch = vi.fn();
    const { rerender } = render(<ViewToolbar mode="grid" onMode={() => {}} search="" onSearch={onSearch} />);
    expect(screen.queryByRole('searchbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'sau' } });
    expect(onSearch).toHaveBeenCalledWith('sau');
    rerender(<ViewToolbar mode="grid" onMode={() => {}} search="sau" onSearch={onSearch} />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenLastCalledWith('');
    rerender(<ViewToolbar mode="grid" onMode={() => {}} search="" onSearch={onSearch} />);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('under a header that takes tools, stands in that header\'s three slots and draws no bar of its own', () => {
    render(<WithHeadTools>{(slot) => (
      <section><header data-testid="head"><h2>Coins</h2>{slot.start}{slot.center}{slot.end}</header>
        <main data-testid="body"><ViewToolbar mode="deck" onMode={() => {}} title="Coins" count="9" noun="items" search="" onSearch={() => {}} onSort={() => {}} /></main></section>)}
    </WithHeadTools>);
    const place = (name: string) => screen.getByTestId('head').querySelector(`[data-head-tools="${name}"]`) as HTMLElement;
    expect(place('start').textContent).toBe('9items');
    expect(place('start').contains(screen.getByLabelText('Layout · Deck'))).toBe(true);
    expect(place('center').contains(screen.getByRole('button', { name: 'Search' }))).toBe(true);
    expect(place('end').contains(screen.getByLabelText('Sort'))).toBe(true);
    expect(screen.getByTestId('body').textContent).toBe('');
    expect(screen.getAllByText('Coins')).toHaveLength(1);
  });
});

describe('Deck', () => {
  it('stands two bars above its card, more when asked', () => {
    const { container, rerender } = render(<Deck><span>card</span></Deck>);
    expect(container.querySelectorAll('[data-k]')).toHaveLength(2);
    expect(container.querySelector('.pui-deck')?.lastElementChild?.textContent).toBe('card');
    rerender(<Deck bars={3}><span>card</span></Deck>);
    expect([...container.querySelectorAll('[data-k]')].map((x) => x.getAttribute('data-k'))).toEqual(['3', '2', '1']);
  });
});
