import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Lightbox, type LightboxItem } from './index';

const LIST: LightboxItem[] = [
  { src: '/a.png', name: 'Lora Vale', when: 'Today 09:12' },
  { src: '/b.png', name: 'Lora Vale', when: 'Today 09:12' },
  { src: '/c.png', name: 'Kairo Finch', when: 'Yesterday 18:40' },
];

const open = (index: number) => {
  const onIndex = vi.fn(); const onClose = vi.fn();
  render(<Lightbox list={LIST} index={index} onIndex={onIndex} onClose={onClose} label="Pictures in Lora Vale" />);
  return { onIndex, onClose };
};

describe('Lightbox', () => {
  it('shows the picture, who posted it and when, and a strip of every picture with the one shown marked', async () => {
    open(2);
    const view = await screen.findByRole('dialog', { name: 'Pictures in Lora Vale' });
    expect(view.querySelector('img')?.getAttribute('src')).toBe('/c.png');
    expect(screen.getByText('Kairo Finch')).toBeTruthy();
    expect(screen.getByText('Yesterday 18:40')).toBeTruthy();
    const tab = screen.getAllByRole('tab');
    expect(tab.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
  });

  it('steps with its arrows, the arrow keys and the strip, and offers no step past either end', async () => {
    const { onIndex } = open(0);
    await screen.findByRole('dialog');
    expect(screen.queryByLabelText('Previous')).toBeNull();
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onIndex).toHaveBeenLastCalledWith(1);
    act(() => { fireEvent.keyDown(window, { key: 'ArrowLeft' }); });
    expect(onIndex).toHaveBeenCalledTimes(1);
    act(() => { fireEvent.keyDown(window, { key: 'ArrowRight' }); });
    expect(onIndex).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getAllByRole('tab')[2]);
    expect(onIndex).toHaveBeenLastCalledWith(2);
  });

  it('closes by its button, by Escape and by a press beside the picture, and has its tools', async () => {
    const { onClose } = open(1);
    const view = await screen.findByRole('dialog');
    fireEvent.click(screen.getByLabelText('Close'));
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }); });
    fireEvent.click(view.querySelector('[aria-hidden="true"]') as Element);
    expect(onClose).toHaveBeenCalledTimes(3);
    // Larger and back; the file to keep; the picture alone in a new tab.
    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(screen.getByLabelText('Fit to the screen').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Download').getAttribute('download')).toBe('b.png');
    expect(screen.getByLabelText('Open in a new tab').getAttribute('target')).toBe('_blank');
    expect(screen.getByLabelText('Share')).toBeTruthy();
  });

  it('has no strip and no arrows for one picture alone', async () => {
    render(<Lightbox list={LIST.slice(0, 1)} index={0} onIndex={() => undefined} onClose={() => undefined} label="One" />);
    await screen.findByRole('dialog');
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryByLabelText('Next')).toBeNull();
  });
});
