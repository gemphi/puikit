import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StageSlider } from './index';

const items = ['a', 'b', 'c', 'd', 'e'].map((x) => ({ id: x, node: <span>{x}</span> }));

describe('StageSlider', () => {
  it('puts one slide in the centre and its neighbours half its height, half tucked under', () => {
    const { container } = render(<StageSlider items={items} sides={1} />);
    const slides = [...container.querySelectorAll('[data-offset]')] as HTMLElement[];
    expect(slides.map((x) => x.getAttribute('data-offset'))).toEqual(['-1', '0', '1']);
    expect(slides[2].style.transform).toBe('translateX(50%) scale(0.5)');
    expect(slides[1].style.transform).toBe('translateX(0%) scale(1)');
  });
  it('steps with the side arrows and the keyboard, and shows the position', () => {
    render(<StageSlider items={items} positionLabel={(i, n) => `${i} of ${n}`} />);
    expect(screen.getByText('1 of 5')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('2 of 5')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' });
    expect(screen.getByText('1 of 5')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(screen.getByText('5 of 5')).toBeTruthy();
  });
});
