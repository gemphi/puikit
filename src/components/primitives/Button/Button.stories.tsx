/**
 * Button usage examples (documentation source).
 *
 * These are plain, framework-agnostic example descriptors consumed textually by
 * `scripts/generate-docs.mjs` (it reads the `title` and exported example names).
 * This file intentionally does NOT depend on Storybook or any external
 * documentation framework (Requirements 13.4, 14.4). The `PuiExample` type is a
 * local, self-contained shape — no `@storybook/*` import.
 */
import { ShoppingCart } from 'lucide-react';
import { Button } from './index';

/** Local, self-contained example descriptor (no external framework). */
interface PuiExample {
  args?: Record<string, unknown>;
  render?: () => unknown;
}

interface PuiExampleMeta {
  title: string;
  component: unknown;
}

const meta: PuiExampleMeta = {
  title: 'Primitives/Button',
  component: Button,
};

export default meta;

export const Primary: PuiExample = {
  args: { children: 'Primary' },
};

export const Secondary: PuiExample = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Outline: PuiExample = {
  args: { variant: 'outline', children: 'Outline' },
};

export const Ghost: PuiExample = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const Danger: PuiExample = {
  args: { variant: 'danger', children: 'Danger' },
};

export const WithIcon: PuiExample = {
  args: { iconLeft: ShoppingCart, children: 'Add to cart' },
};

export const Loading: PuiExample = {
  args: { loading: true, children: 'Saving...' },
};

export const IconOnly: PuiExample = {
  args: {
    variant: 'icon',
    iconLeft: ShoppingCart,
    'aria-label': 'Open cart',
  },
};
