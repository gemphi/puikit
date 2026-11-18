import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { PuiProvider } from '../../../providers/PuiProvider';
import { RADIUS_PRESETS, radiusPresetOf } from '../../../providers/palette';
import { RadiusPicker } from './index';

describe('RadiusPicker', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('style'); });

  it('maps a scale to the nearest preset', () => {
    expect(radiusPresetOf(1)).toBe('medium');
    expect(radiusPresetOf(2.8)).toBe('pill');
    expect(radiusPresetOf(0)).toBe('small');
    expect(radiusPresetOf(1.7)).toBe('large');
  });

  it('sets the theme radius scale every --phi-radius-* token follows', () => {
    const { getByRole } = render(<PuiProvider defaultTheme="light"><RadiusPicker /></PuiProvider>);
    expect(getByRole('radio', { name: '32px' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(getByRole('radio', { name: '48px' }));
    expect(document.documentElement.style.getPropertyValue('--phi-radius-scale')).toBe(String(RADIUS_PRESETS.large));
    expect(getByRole('radio', { name: '48px' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(getByRole('radio', { name: '64px' }));
    expect(document.documentElement.getAttribute('data-radius')).toBe('pill');
  });
});
