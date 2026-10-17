import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithPui } from '../../../test/renderWithPui';
import { RelationPicker, type RelationOption } from './index';

/** Linking records: the control behind every relation field (a pool's clubs, a club's world). */
const opts: RelationOption[] = [
  { value: 'c1', label: 'Maison Opal' }, { value: 'c2', label: 'Satin Swans' }, { value: 'c3', label: 'Velour Vixens' },
];
const Harness: React.FC<{ multi?: boolean; max?: number }> = ({ multi = true, max }) => {
  const [v, setV] = React.useState<string[]>([]);
  return <><RelationPicker options={opts} value={v} onChange={setV} multi={multi} max={max} searchFrom={2} /><output data-testid="v">{v.join(',')}</output></>;
};

describe('RelationPicker', () => {
  it('links and unlinks several records', () => {
    renderWithPui(<Harness />);
    fireEvent.click(screen.getByRole('option', { name: /Maison Opal/ }));
    fireEvent.click(screen.getByRole('option', { name: /Satin Swans/ }));
    expect(screen.getByTestId('v').textContent).toBe('c1,c2');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Maison Opal' }));
    expect(screen.getByTestId('v').textContent).toBe('c2');
  });
  it('keeps one in single mode', () => {
    renderWithPui(<Harness multi={false} />);
    fireEvent.click(screen.getByRole('option', { name: /Maison Opal/ }));
    fireEvent.click(screen.getByRole('option', { name: /Velour Vixens/ }));
    expect(screen.getByTestId('v').textContent).toBe('c3');
  });
  it('filters by search and respects max', () => {
    renderWithPui(<Harness max={1} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'satin' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.click(screen.getByRole('option', { name: /Satin Swans/ }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('option', { name: /Maison Opal/ }));
    expect(screen.getByTestId('v').textContent).toBe('c2');
  });
});
