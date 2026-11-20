'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/Button';
import { Icon } from '../../primitives/Icon';
import { Span } from '../../primitives/Span';
import { Stack } from '../../layout/Stack';
import styles from './styles.module.scss';

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

export const Stepper = ({ value, onChange, min = 1, max = 99, className = '' }: StepperProps) => {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };
  const increase = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <Stack direction="row" align="center" gap={2} className={cn(styles.stepper, className)}>
      <Button variant="icon" onClick={decrease} disabled={value <= min} aria-label="Decrease quantity">
        <Icon name={Minus} size="sm" />
      </Button>
      <Span className={styles.value}>{value}</Span>
      <Button variant="icon" onClick={increase} disabled={value >= max} aria-label="Increase quantity">
        <Icon name={Plus} size="sm" />
      </Button>
    </Stack>
  );
};
