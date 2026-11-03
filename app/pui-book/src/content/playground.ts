import type React from 'react';

/**
 * The playground's subject matter, as data.
 *
 * Every control the inspector renders and every line of code it prints is
 * derived from these specs, so adding a component to the playground is adding
 * an entry here — not writing another panel.
 */

export type ControlSpec =
  | { kind: 'select'; prop: string; label: string; options: string[]; initial: string }
  | { kind: 'text'; prop: string; label: string; initial: string }
  | { kind: 'boolean'; prop: string; label: string; initial: boolean }
  | { kind: 'number'; prop: string; label: string; options: number[]; initial: number };

export interface ComponentSpec {
  id: string;
  name: string;
  summary: string;
  controls: ControlSpec[];
  /** Prop rendered as the element's children rather than an attribute. */
  childProp?: string;
}

export const PLAYGROUND_COMPONENTS: ComponentSpec[] = [
  {
    id: 'button',
    name: 'Button',
    summary: 'The action primitive. Every variant shares one height ladder and one radius.',
    childProp: 'children',
    controls: [
      { kind: 'text', prop: 'children', label: 'Label', initial: 'Add to bag' },
      { kind: 'select', prop: 'variant', label: 'Variant', options: ['primary', 'secondary', 'outline', 'ghost', 'danger'], initial: 'primary' },
      { kind: 'select', prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'], initial: 'md' },
      { kind: 'boolean', prop: 'loading', label: 'Loading', initial: false },
      { kind: 'boolean', prop: 'disabled', label: 'Disabled', initial: false },
    ],
  },
  {
    id: 'tag',
    name: 'Tag',
    summary: 'A status or category chip. Intent carries the meaning; minimal and round carry the weight.',
    childProp: 'children',
    controls: [
      { kind: 'text', prop: 'children', label: 'Label', initial: 'Boutique exclusive' },
      { kind: 'select', prop: 'intent', label: 'Intent', options: ['none', 'primary', 'success', 'warning', 'danger'], initial: 'primary' },
      { kind: 'select', prop: 'size', label: 'Size', options: ['sm', 'md'], initial: 'md' },
      { kind: 'boolean', prop: 'minimal', label: 'Minimal', initial: true },
      { kind: 'boolean', prop: 'round', label: 'Round', initial: true },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    summary: 'Text entry, on the shared control height so it lines up with buttons and selects.',
    controls: [
      { kind: 'text', prop: 'placeholder', label: 'Placeholder', initial: 'Search the maison' },
      { kind: 'text', prop: 'value', label: 'Value', initial: '' },
      { kind: 'boolean', prop: 'error', label: 'Error', initial: false },
      { kind: 'boolean', prop: 'disabled', label: 'Disabled', initial: false },
    ],
  },
  {
    id: 'select',
    name: 'Select',
    summary: 'A listbox, not a native menu — so the open list is themed like everything else.',
    controls: [
      { kind: 'select', prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'], initial: 'md' },
      { kind: 'boolean', prop: 'error', label: 'Error', initial: false },
      { kind: 'boolean', prop: 'disabled', label: 'Disabled', initial: false },
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    summary: 'Sized and rounded from the shared control tokens, so it matches radios and swatches.',
    controls: [
      { kind: 'text', prop: 'label', label: 'Label', initial: 'Caviar calfskin' },
      { kind: 'boolean', prop: 'checked', label: 'Checked', initial: true },
      { kind: 'boolean', prop: 'disabled', label: 'Disabled', initial: false },
    ],
  },
  {
    id: 'radio',
    name: 'Radio',
    summary: 'The same control at the same size, with a painted dot rather than a thick border.',
    controls: [
      { kind: 'text', prop: 'label', label: 'Label', initial: 'Complimentary delivery' },
      { kind: 'boolean', prop: 'checked', label: 'Checked', initial: true },
      { kind: 'boolean', prop: 'disabled', label: 'Disabled', initial: false },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    summary: 'For settings that take effect immediately, where a checkbox would imply a save step.',
    controls: [
      { kind: 'text', prop: 'label', label: 'Label', initial: 'Gift wrapping' },
      { kind: 'boolean', prop: 'checked', label: 'Checked', initial: true },
      { kind: 'select', prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'], initial: 'md' },
    ],
  },
  {
    id: 'callout',
    name: 'Callout',
    summary: 'An inline message. Intent sets the colour; the title carries the point.',
    childProp: 'children',
    controls: [
      { kind: 'text', prop: 'title', label: 'Title', initial: 'Complimentary delivery' },
      { kind: 'text', prop: 'children', label: 'Body', initial: 'Delivered within two working days.' },
      { kind: 'select', prop: 'intent', label: 'Intent', options: ['primary', 'success', 'warning', 'danger'], initial: 'success' },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    summary: 'The surface primitive. Padding is a 16/24/32 step, not one value.',
    childProp: 'children',
    controls: [
      { kind: 'text', prop: 'children', label: 'Content', initial: 'Quilted lambskin, chain straps, and the codes of the house.' },
      { kind: 'select', prop: 'variant', label: 'Variant', options: ['default', 'flat', 'outlined'], initial: 'default' },
      { kind: 'select', prop: 'padding', label: 'Padding', options: ['sm', 'md', 'lg'], initial: 'md' },
      { kind: 'boolean', prop: 'hoverable', label: 'Hoverable', initial: true },
    ],
  },
  {
    id: 'price',
    name: 'Price',
    summary: 'From the shop module. Currency and locale come from ShopProvider, never from the call site.',
    controls: [
      { kind: 'number', prop: 'amount', label: 'Amount', options: [165, 1450, 5800, 9700], initial: 9700 },
      { kind: 'select', prop: 'currency', label: 'Currency', options: ['EUR', 'USD', 'GBP', 'JPY'], initial: 'EUR' },
      { kind: 'select', prop: 'size', label: 'Size', options: ['sm', 'md', 'lg'], initial: 'md' },
    ],
  },
];

/** The JSX a given set of prop values corresponds to. */
export function toCode(spec: ComponentSpec, values: Record<string, unknown>): string {
  const attrs: string[] = [];
  let child = '';

  for (const control of spec.controls) {
    const value = values[control.prop];
    if (control.prop === spec.childProp) {
      child = String(value ?? '');
      continue;
    }
    if (value === undefined || value === '' || value === false) continue;
    if (value === true) attrs.push(control.prop);
    else if (typeof value === 'number') attrs.push(`${control.prop}={${value}}`);
    else attrs.push(`${control.prop}="${value}"`);
  }

  const open = attrs.length ? `<${spec.name} ${attrs.join(' ')}` : `<${spec.name}`;
  return child ? `${open}>${child}</${spec.name}>` : `${open} />`;
}
