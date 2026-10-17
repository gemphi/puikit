import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Grid } from './Grid';
import { Col } from './Col';
import { Row } from './Row';
import { Stack } from './Stack';
import { Link } from '../navigation/Link';
import { ProgressBar } from '../feedback/ProgressBar';
import { Text } from '../primitives/Text';

/**
 * Props and behaviour added for the Phiace apps:
 *  - Grid `columns` takes a raw track list; numeric columns expose --pui-grid-cols.
 *  - Col inside a Grid spans tracks (in twelfths of the grid), but not inside a Row or with no span.
 *  - Link `plain` variant, ProgressBar `size` + `info` intent, Stack `grow`/`overflow`, Text `mono`.
 */
const cls = (el: Element | null) => (el?.getAttribute('class') ?? '');
const style = (el: Element | null) => (el as HTMLElement | null)?.style;

describe('Grid columns', () => {
  it('passes a track-list string straight through', () => {
    const { container } = render(<Grid columns="repeat(auto-fit, minmax(240px, 1fr))"><span /></Grid>);
    expect(style(container.firstElementChild)?.getPropertyValue('--grid-columns')).toBe('repeat(auto-fit, minmax(240px, 1fr))');
    expect(style(container.firstElementChild)?.getPropertyValue('--pui-grid-cols')).toBe('');
  });
  it('turns a number into equal tracks and exposes the count', () => {
    const { container } = render(<Grid columns={4}><span /></Grid>);
    expect(style(container.firstElementChild)?.getPropertyValue('--grid-columns')).toBe('repeat(4, minmax(0, 1fr))');
    expect(style(container.firstElementChild)?.getPropertyValue('--pui-grid-cols')).toBe('4');
  });
});

describe('Col inside Grid', () => {
  it('spans grid tracks with per-breakpoint vars', () => {
    const { container } = render(<Grid lg={12}><Col span={8} xs={12} lg={8}>a</Col></Grid>);
    const col = container.firstElementChild!.firstElementChild!;
    expect(cls(col)).toMatch(/inGrid/);
    expect(style(col)?.getPropertyValue('--col-span')).toBe('12');
    expect(style(col)?.getPropertyValue('--col-span-lg')).toBe('8');
  });
  it('fills the row for span true / auto', () => {
    const { container } = render(<Grid columns={3}><Col span>a</Col></Grid>);
    expect(style(container.firstElementChild!.firstElementChild)?.getPropertyValue('--col-span')).toBe('12');
  });
  it('stays a single auto cell when no span is given', () => {
    const { container } = render(<Grid columns={4}><Col>a</Col></Grid>);
    expect(cls(container.firstElementChild!.firstElementChild)).not.toMatch(/inGrid/);
  });
  it('is a flex column again inside a Row nested in a Grid', () => {
    const { container } = render(<Grid columns={2}><Row><Col span={6}>a</Col></Row></Grid>);
    const col = container.querySelector('[class*="col-6"]');
    expect(col).not.toBeNull();
    expect(cls(col)).not.toMatch(/inGrid/);
  });
  it('does not leak grid context to Cols nested inside a Col', () => {
    const { container } = render(<Grid columns={2}><Col span={6}><Col span={3}>inner</Col></Col></Grid>);
    const inner = container.firstElementChild!.firstElementChild!.firstElementChild!;
    expect(cls(inner)).not.toMatch(/inGrid/);
  });
});

describe('Link plain', () => {
  it('drops the coloured base class but keeps caller classes', () => {
    const { container } = render(<><Link href="/a">default</Link><Link href="/b" variant="plain" className="mine">plain</Link></>);
    const [a, b] = Array.from(container.querySelectorAll('a'));
    expect(cls(a)).toMatch(/link/);
    expect(cls(b)).not.toMatch(/_link_/);
    expect(cls(b)).toMatch(/mine/);
    expect(b.getAttribute('href')).toBe('/b');
  });
});

describe('ProgressBar', () => {
  it('applies size and the info intent', () => {
    const { container } = render(<ProgressBar value={0.5} size="sm" intent="info" />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(cls(bar)).toMatch(/size-sm/);
    expect(cls(bar)).toMatch(/intent-info/);
    expect(bar?.getAttribute('aria-valuenow')).toBe('50');
  });
  it('defaults to md', () => {
    const { container } = render(<ProgressBar value={1} />);
    expect(cls(container.querySelector('[role="progressbar"]'))).toMatch(/size-md/);
  });
});

describe('Stack grow / overflow', () => {
  it('maps to inline flex-grow and overflow', () => {
    const { container } = render(<Stack grow={1} overflow="auto">x</Stack>);
    expect(style(container.firstElementChild)?.flexGrow).toBe('1');
    expect(style(container.firstElementChild)?.overflow).toBe('auto');
  });
  it('leaves both unset by default', () => {
    const { container } = render(<Stack>x</Stack>);
    expect(style(container.firstElementChild)?.flexGrow).toBe('');
    expect(style(container.firstElementChild)?.overflow).toBe('');
  });
});

describe('Text mono', () => {
  it('adds the mono class only when asked', () => {
    const { container } = render(<><Text mono>1</Text><Text>2</Text></>);
    const [a, b] = Array.from(container.querySelectorAll('p'));
    expect(cls(a)).toMatch(/mono/);
    expect(cls(b)).not.toMatch(/mono/);
  });
});

describe('Icon buttons', () => {
  it('render a child glyph when no icon prop is given (Modal / Drawer close)', async () => {
    const { Button } = await import('../primitives/Button');
    const { container } = render(<Button variant="icon" aria-label="Close"><svg data-testid="x" /></Button>);
    expect(container.querySelector('button svg')).not.toBeNull();
  });
  it('still prefer the icon prop', async () => {
    const { Button } = await import('../primitives/Button');
    const { container } = render(<Button variant="icon" aria-label="Go" icon={<svg data-k="icon" />}><svg data-k="child" /></Button>);
    expect(container.querySelector('[data-k="icon"]')).not.toBeNull();
    expect(container.querySelector('[data-k="child"]')).toBeNull();
  });
});

describe('Modal surface', () => {
  it('sizes to content on an opaque, positioned surface', async () => {
    const { Modal } = await import('../overlays/Modal');
    render(<Modal isOpen onClose={() => {}} title="T">body</Modal>);
    const card = document.querySelector('.pui-modal');
    expect(card).not.toBeNull();
    expect(card?.getAttribute('class')).toMatch(/modal/);
    expect(document.querySelector('.pui-modal [aria-label="Close"] svg')).not.toBeNull();
  });
});

describe('Rows responsive', () => {
  it('fits cards to the measured width', async () => {
    const { fitCols } = await import('./Rows');
    expect(fitCols(1000, 240, 12, 4)).toBe(4);
    expect(fitCols(500, 240, 12, 4)).toBe(2);
    expect(fitCols(200, 240, 12, 4)).toBe(1);
    expect(fitCols(0, 240, 12, 4)).toBe(4);
  });
});
