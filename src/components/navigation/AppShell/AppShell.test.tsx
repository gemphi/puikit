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
