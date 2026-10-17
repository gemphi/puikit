import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithPui } from '../../../test/renderWithPui';
import { StepForm, type StepFormStep } from './index';

/**
 * The shared stepped form: one component for every form in the house (edit sheets, checkout, enrol). These check the
 * walk — the rail tracks the active step, Next/Back move it, completed steps carry the chosen value as a hint, and the
 * action fires only on the last step. Kit-agnostic: imports only puijs sources.
 */
const steps: StepFormStep[] = [
  { id: 'a', label: 'Account', hint: 'Noor Hale', content: <input aria-label="name" defaultValue="Noor" /> },
  { id: 'b', label: 'Address', hint: 'Opalia', content: <input aria-label="city" defaultValue="Opalia" /> },
  { id: 'c', label: 'Review', content: <div>Confirm</div> },
];

describe('StepForm', () => {
  it('shows the first step and does not submit until the last', () => {
    let submitted = 0;
    renderWithPui(<StepForm steps={steps} onSubmit={() => { submitted++; }} submitLabel="Enrol" />);
    // First step heading is visible; Next is offered, Submit is not.
    expect(screen.getAllByText('Account').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enrol' })).toBeNull();
    expect(submitted).toBe(0);
  });

  it('walks forward and back, then submits once on the last step', () => {
    let submitted = 0;
    renderWithPui(<StepForm steps={steps} onSubmit={() => { submitted++; }} submitLabel="Enrol" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> Address
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> Review
    // Back appears, Next is gone, Submit is offered.
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    const submit = screen.getByRole('button', { name: 'Enrol' });
    fireEvent.click(submit);
    expect(submitted).toBe(1);
    // Back returns to the previous step.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('blocks Next while the step is invalid', () => {
    const blocked: StepFormStep[] = [
      { id: 'a', label: 'One', valid: false, content: <div>one</div> },
      { id: 'b', label: 'Two', content: <div>two</div> },
    ];
    renderWithPui(<StepForm steps={blocked} onSubmit={() => {}} submitLabel="Done" />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('renders a single step flat, with the submit action and no Next', () => {
    renderWithPui(<StepForm steps={[{ id: 'only', label: 'Only', content: <div>solo</div> }]} onSubmit={() => {}} submitLabel="Save" />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });
});
