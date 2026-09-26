import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import styles from './styles.module.scss';

type SliderProps = {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
};

export const Slider = ({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  label,
  showValue = false,
  className = '',
}: SliderProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;
  const isControlled = value !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <Stack direction="column" gap={1} className={cn(styles.sliderContainer, disabled && styles.disabled, className)}>
      {(label || showValue) && (
        <Stack direction="row" align="center" justify="between" className={styles.sliderHeader}>
          {label && <span className={styles.sliderLabel}>{label}</span>}
          {showValue && <span className={styles.sliderValue}>{currentValue}</span>}
        </Stack>
      )}
      <Box className={styles.sliderWrapper}>
        <Box className={styles.track} />
        <Box className={styles.fill} style={{ width: `${percentage}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
          aria-label={label}
        />
      </Box>
    </Stack>
  );
};

Slider.displayName = 'Slider';
