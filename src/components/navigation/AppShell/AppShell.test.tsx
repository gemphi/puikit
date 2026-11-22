import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppShell, useShell } from './index';

const groups = [{ id: 'home', label: 'Home', items: [{ id: 'welcome', label: 'Welcome' }, { id: 'feed', label: 'Feed', previews: [{ id: 'p1', label: 'First post' }] }] }];
const Open = () => <span data-testid="open">{String(useShell().navOpen)}</span>;
const shell = () => render(<AppShell brand={{ name: 'Phitest' }} groups={groups} view="welcome" onView={() => {}}><Open /></AppShell>);

describe('AppShell', () => {
  beforeEach(() => { localStorage.clear(); });
  it('opens and closes its menu panel with the pin, and tells the page', () => {
    shell();
    expect(screen.getByTestId('open').textContent).toBe('true');
    expect(screen.getByRole('complementary', { name: 'Home' })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Close the menu'));
    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(screen.queryByRole('complementary', { name: 'Home' })).toBeNull();
    expect(localStorage.getItem('pui:shell:open')).toBe('0');
  });
  it('folds a menu and an entry’s records with the arrow at the left', () => {
    shell();
    expect(screen.queryByText('First post')).toBeNull();
    fireEvent.click(screen.getByLabelText('Open Feed'));
    expect(screen.getByText('First post')).toBeTruthy();
    fireEvent.click(screen.getAllByLabelText('Fold Home')[0]);
    expect(screen.queryByText('First post')).toBeNull();
  });
  it('folds a heading’s rooms without going anywhere, and knows the group of a page under a heading', () => {
    const went: string[] = [];
    const chat = [{ id: 'space', label: 'Space', items: [{ id: 'text', label: 'Text', head: true, open: true, items: [{ id: 'lobby', label: 'lobby' }] },
      { id: 'lounge', label: 'Lounge', steady: true, previews: [{ id: 'tavi', label: 'Tavi' }] }] }];
    render(<AppShell brand={{ name: 'Phitest' }} groups={chat} view="lobby" onView={(id) => went.push(id)}><Open /></AppShell>);
    expect(screen.getByRole('complementary', { name: 'Space' })).toBeTruthy();
    // A steady entry shows what it holds and has no fold arrow.
    expect(screen.getByText('Tavi')).toBeTruthy();
    expect(screen.queryByLabelText('Fold Lounge')).toBeNull();
    fireEvent.click(screen.getByText('Text'));
    expect(went).toEqual([]);
    expect(screen.queryByText('lobby', { selector: 'button *' })).toBeNull();
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(screen.getByText('lobby', { selector: 'button *' }));
    expect(went).toEqual(['lobby']);
  });
  it('shows what waits: a count on a group’s rail icon and at an entry’s end, none at 0', () => {
    const chat = [{ id: 'space', label: 'Space', count: 3, items: [{ id: 'lobby', label: 'lobby', count: 3 }, { id: 'help', label: 'help', count: 0 }] }];
    render(<AppShell brand={{ name: 'Phitest' }} groups={chat} view="help" onView={() => {}}>page</AppShell>);
    expect(screen.getByLabelText('Space, 3')).toBeTruthy();
    expect(screen.getAllByText('3')).toHaveLength(2);
    expect(screen.queryByText('0')).toBeNull();
  });
  it('folds sub-menus as deep as a storefront: department > category > item, open when the page is inside', () => {
    const shop = [{ id: 'shop', label: 'Shop', items: [{ id: 'women', label: 'Women', items: [
      { id: 'women/rtw', label: 'Ready-to-wear', items: [{ id: 'women/rtw/dresses', label: 'Dresses' }, { id: 'women/rtw/tops', label: 'Tops' }] },
      { id: 'women/shoes', label: 'Shoes', items: [{ id: 'women/shoes/boots', label: 'Boots' }] },
    ] }] }];
    const seen: string[] = [];
    const { rerender } = render(<AppShell brand={{ name: 'Phitest' }} groups={shop} view="shop" onView={(id) => seen.push(id)}>page</AppShell>);
    expect(screen.queryByText('Ready-to-wear')).toBeNull();
    fireEvent.click(screen.getByText('Women'));
    expect(seen).toEqual(['women']);
    expect(screen.getByText('Ready-to-wear')).toBeTruthy();
    expect(screen.queryByText('Dresses')).toBeNull();
    fireEvent.click(screen.getByLabelText('Open Ready-to-wear'));
    expect(screen.getByText('Dresses')).toBeTruthy();
    // A page inside a sub-menu opens every fold above it, and is named in the crumbs as well as in its menu.
    rerender(<AppShell brand={{ name: 'Phitest' }} groups={shop} view="women/shoes/boots" onView={() => {}}>page</AppShell>);
    expect(screen.getAllByText('Boots')).toHaveLength(2);
  });
  it('lists one-page groups as one menu with no heading over itself', () => {
    const pages = [{ id: 'home', label: 'Home', items: [{ id: 'home', label: 'Home' }] }, { id: 'docs', label: 'Docs', items: [{ id: 'docs', label: 'Docs' }] }];
    render(<AppShell brand={{ name: 'Phitest' }} groups={pages} view="home" onView={() => {}}>page</AppShell>);
    const panel = screen.getByRole('complementary', { name: 'Home' });
    expect(panel.textContent).toContain('Docs');
    expect(panel.textContent?.match(/Home/g)?.length).toBe(1);
  });
  it('lays a group in runs, opens a held panel, and closes on the current rail icon', () => {
    const runs = [{ id: 'menu', label: 'Menu', items: [], sections: [
      { id: 'a', items: [{ id: 'shows', label: 'Shows' }] },
      { id: 'b', end: true, items: [{ id: 'look', label: 'Look', panel: <span>Look panel</span>, open: true }] },
    ] }];
    const seen: string[] = [];
    render(<AppShell brand={{ name: 'Phitest' }} groups={runs} view="shows" onView={(id) => seen.push(id)}><Open /></AppShell>);
    expect(screen.getByText('Look panel')).toBeTruthy();
    fireEvent.click(screen.getByText('Look'));
    expect(screen.queryByText('Look panel')).toBeNull();
    expect(seen).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Menu', pressed: true }));
    expect(screen.getByTestId('open').textContent).toBe('false');
  });
});
