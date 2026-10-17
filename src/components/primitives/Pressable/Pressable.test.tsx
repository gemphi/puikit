import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { Pressable } from './index';
import { Frame } from '../../media/Frame';
import { Stack } from '../../layout/Stack';
import { Text } from '../Text';

describe('Pressable', () => {
  it('is a button by default, a link with href, and passes clicks', () => {
    const on = vi.fn();
    const { getByRole } = render(<><Pressable onClick={on}>tap</Pressable><Pressable href="#x">go</Pressable></>);
    const b = getByRole('button', { name: 'tap' });
    expect(b.getAttribute('type')).toBe('button');
    fireEvent.click(b); expect(on).toHaveBeenCalled();
    expect(getByRole('link', { name: 'go' }).getAttribute('href')).toBe('#x');
  });
  it('marks the chosen one and never forwards style props to the DOM', () => {
    const { getByRole } = render(<Pressable selected width="4rem" flex="none">x</Pressable>);
    const b = getByRole('button');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.style.width).toBe('4rem');
    expect(b.getAttribute('width')).toBeNull();
    expect(b.getAttribute('flex')).toBeNull();
  });
});

describe('Frame and style props', () => {
  it('frames content at a ratio on a tint', () => {
    const { container } = render(<Frame ratio="1/1" tint="#c2185b" tintStrength={100} ink="#fff" width="2rem">A</Frame>);
    const f = container.firstElementChild as HTMLElement;
    expect(f.style.aspectRatio.replace(/ /g, '')).toBe('1/1');
    expect(f.style.getPropertyValue('--pui-frame-tint')).toBe('#c2185b');
    expect(f.style.width).toBe('2rem');
  });
  it('turns layout props into CSS on Stack and Text', () => {
    const { container } = render(<Stack flex="1" scroll="y" maxHeight="52vh" pushEnd rounded="full"><Text truncate width="5rem" pre>t</Text></Stack>);
    const st = container.firstElementChild as HTMLElement;
    expect(st.style.flex).toContain('1');
    expect(st.style.overflowY).toBe('auto');
    expect(st.style.maxHeight).toBe('52vh');
    expect(st.style.borderRadius).toBe('999px');
    expect(st.getAttribute('scroll')).toBeNull();
    expect((st.firstElementChild as HTMLElement).style.width).toBe('5rem');
  });
});

describe('Cards, grids and highlights as props', () => {
  it('Pressable card is a column, current is aria-current not aria-pressed', () => {
    const { getByRole } = render(<Pressable card column current accent>c</Pressable>);
    const b = getByRole('button');
    expect(b.getAttribute('aria-current')).toBe('true');
    expect(b.getAttribute('aria-pressed')).toBeNull();
  });
  it('surface and autoFill become CSS and never reach the DOM', () => {
    const { container } = render(<Stack surface="card" autoFill="220px" gap={3}>x</Stack>);
    const st = container.firstElementChild as HTMLElement;
    expect(st.style.display).toBe('grid');
    expect(st.style.gridTemplateColumns).toContain('220px');
    expect(st.style.padding).toBe('1rem');
    expect(st.getAttribute('surface')).toBeNull();
  });
  it('padding props win over a surface padding', () => {
    const { container } = render(<Stack surface="hero" padding={2}>x</Stack>);
    expect((container.firstElementChild as HTMLElement).style.paddingTop).toBe('0.5rem');
  });
});
