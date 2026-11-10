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
});
