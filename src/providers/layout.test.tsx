import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { PuiProvider } from './PuiProvider';
import { useLayout, useLayoutRoot } from './layout';
import { Player } from '../components/display/Player';

/** The shell keeps the root in step with the person, as AppShell does. */
const Shell: React.FC = () => { useLayoutRoot('guest'); return null; };

const Pick: React.FC<{ id: string }> = ({ id }) => {
  const [value, set] = useLayout('tabs', 'horizontal');
  return <button data-testid={id} onClick={() => set('vertical')}>{value}</button>;
};

describe('a layout choice', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.removeAttribute('data-phi-tabs'); });

  it('is heard by every reader, put on the root, and kept for the person', () => {
    render(<PuiProvider><Pick id="one" /><Pick id="two" /></PuiProvider>);
    expect(screen.getByTestId('two').textContent).toBe('horizontal');
    act(() => screen.getByTestId('one').click());
    expect(screen.getByTestId('two').textContent).toBe('vertical');
    expect(document.documentElement.getAttribute('data-phi-tabs')).toBe('vertical');
    expect(window.localStorage.getItem('phi-layout-tabs::guest')).toBe('vertical');
  });

  it('is put back on the root when the app starts again', () => {
    window.localStorage.setItem('phi-layout-ground::guest', 'ripple');
    render(<PuiProvider><Shell /></PuiProvider>);
    expect(document.documentElement.getAttribute('data-phi-ground')).toBe('ripple');
  });
});

describe('the Player', () => {
  it('lays one picture three times, its ground and depth hidden from a reader', () => {
    const { container } = render(<Player image="/a.png" label="A" />);
    const pictures = container.querySelectorAll('img');
    expect(pictures).toHaveLength(3);
    expect(Array.from(pictures).filter((p) => p.alt === 'A')).toHaveLength(1);
  });
});
