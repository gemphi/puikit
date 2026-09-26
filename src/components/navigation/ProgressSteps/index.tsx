import React from 'react';
import { cn } from '../../../utils/cn';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import styles from './styles.module.scss';

export interface ProgressStep {
  id: string;
  label: string;
  /** Optional supporting line, e.g. the value chosen at a completed step. */
  description?: string;
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  /** Index of the step currently in progress. */
  activeIndex: number;
  /** Allow returning to a completed step. Future steps are never clickable. */
  onStepClick?: (index: number, step: ProgressStep) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * A multi-step progress indicator, for checkout and other linear flows.
 *
 * Distinct from {@link Stepper}, which increments a numeric value. This one
 * shows where someone is in a sequence: completed steps read as done, the
 * active step is marked current for assistive technology, and steps ahead are
 * inert. Only completed steps are navigable, because letting someone jump
 * forward past validation is how half-filled orders happen.
 */
export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  activeIndex,
  onStepClick,
  orientation = 'horizontal',
  className = '',
}) => (
  <Stack
    direction={orientation === 'vertical' ? 'column' : 'row'}
    gap={orientation === 'vertical' ? 3 : 0}
    align={orientation === 'vertical' ? 'stretch' : 'center'}
    className={cn(styles.root, styles[orientation], className)}
    role="list"
    aria-label="Progress"
  >
    {steps.map((step, i) => {
      const state = i < activeIndex ? 'complete' : i === activeIndex ? 'active' : 'upcoming';
      const navigable = state === 'complete' && Boolean(onStepClick);

      return (
        <Stack
          key={step.id}
          direction={orientation === 'vertical' ? 'row' : 'column'}
          align="center"
          gap={2}
          role="listitem"
          aria-current={state === 'active' ? 'step' : undefined}
          className={cn(styles.step, styles[state], navigable && styles.navigable)}
          onClick={navigable ? () => onStepClick?.(i, step) : undefined}
        >
          <Span className={styles.marker} aria-hidden="true">
            {state === 'complete' ? '' : i + 1}
          </Span>
          <Stack direction="column" gap={0} align={orientation === 'vertical' ? 'start' : 'center'}>
            <Text as="span" size="sm" className={styles.label}>
              {step.label}
            </Text>
            {step.description && (
              <Text as="span" size="xs" intent="muted">
                {step.description}
              </Text>
            )}
          </Stack>
        </Stack>
      );
    })}
  </Stack>
);
