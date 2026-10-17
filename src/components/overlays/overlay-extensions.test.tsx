import React from 'react';
import { describe, it, expect } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Popover } from './Popover';
import { Input } from '../forms/Input';
import { ProgressSteps } from '../navigation/ProgressSteps';
import { BRAND_THEMES, THEME_STYLES } from '../../providers/themes';

/**
 * Added for the Phiace header and economy screens:
 *  - Popover closes on Escape and can portal its content out of clipping containers.
 *  - Input takes a `trailing` adornment (shortcut hint).
 *  - ProgressSteps marks completed steps with a check.
 *  - Apple and SpaceX ship as both a theme style and a brand.
 */
describe('Popover', () => {
  it('opens on trigger click and closes on Escape', () => {
    render(<Popover trigger={<span>open</span>}><span>inside</span></Popover>);
    fireEvent.click(screen.getByText('open'));
    expect(screen.getByText('inside')).toBeTruthy();
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(screen.queryByText('inside')).toBeNull();
  });

  it('portals content into document.body when asked, and clicks inside it keep it open', async () => {
    const { container } = render(<div style={{ overflow: 'hidden' }}><Popover portal trigger={<span>open</span>}><span>floating</span></Popover></div>);
    fireEvent.click(screen.getByText('open'));
    const el = await screen.findByText('floating');
    expect(container.contains(el)).toBe(false);
    expect(document.body.contains(el)).toBe(true);
    fireEvent.mouseDown(el);
    expect(screen.queryByText('floating')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('floating')).toBeNull();
  });
});

describe('Input trailing', () => {
  it('renders the adornment after the field', () => {
    render(<Input aria-label="q" trailing={<kbd>Ctrl K</kbd>} />);
    const input = screen.getByLabelText('q');
    expect(input.parentElement?.textContent).toContain('Ctrl K');
    expect(input.getAttribute('class')).toMatch(/withTrailing/);
  });
});

describe('ProgressSteps', () => {
  it('marks completed steps with a check and numbers the rest', () => {
    render(<ProgressSteps activeIndex={1} steps={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('✓');
    expect(items[1].textContent).toContain('2');
    expect(items[1].getAttribute('aria-current')).toBe('step');
  });
});

describe('Apple and SpaceX', () => {
  it('are registered as theme styles and brands', () => {
    expect(THEME_STYLES.map((s) => s.id)).toEqual(expect.arrayContaining(['apple', 'spacex']));
    const apple = BRAND_THEMES.find((b) => b.id === 'apple'); const spacex = BRAND_THEMES.find((b) => b.id === 'spacex');
    expect(apple?.colors.primary).toBe('#0071e3');
    expect(spacex?.colors.primary).toBe('#000000');
    expect(spacex?.colors.primaryDark).toBe('#ffffff');
  });
});

describe('Drawer expandable', () => {
  it('toggles an expanded state with the expand button', async () => {
    const { Drawer } = await import('./Drawer');
    const { getByRole, getByLabelText } = render(<Drawer isOpen onClose={() => {}} expandable title="Profile">body</Drawer>);
    const btn = getByLabelText('Expand');
    fireEvent.click(btn);
    expect(getByLabelText('Collapse').getAttribute('aria-pressed')).toBe('true');
    expect(getByRole('dialog').querySelector('[data-expanded]')).not.toBeNull();
    fireEvent.click(getByLabelText('Collapse'));
    expect(getByRole('dialog').querySelector('[data-expanded]')).toBeNull();
  });
});

describe('Drawer docked', () => {
  it('stays on the page, folds to its header and back', async () => {
    const { Drawer } = await import('./Drawer');
    const { getByRole, getByLabelText, queryByText } = render(<Drawer isOpen docked position="bottom" title="Player" header={<span>controls</span>} foldLabel="Fold" unfoldLabel="Unfold">sheet body</Drawer>);
    expect(getByRole('region')).toBeTruthy();
    expect(queryByText('sheet body')).toBeTruthy();
    fireEvent.click(getByLabelText('Fold', { selector: 'button[aria-expanded]' }));
    expect(queryByText('sheet body')).toBeNull();
    expect(queryByText('controls')).toBeTruthy();
  });
});
