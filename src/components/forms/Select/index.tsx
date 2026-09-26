'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';
import { Box } from '../../layout/Box';

export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'size' | 'onChange' | 'value' | 'defaultValue'
> & {
  options?: SelectOption[];
  /** `<option>` children, for call sites written against the native element. */
  children?: React.ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  /**
   * Kept in the native element's shape — `e.target.value` — so every existing
   * call site keeps working against this control unchanged.
   */
  onChange?: (event: { target: { value: string } }) => void;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  placeholder?: string;
  className?: string;
};

/** `<option>` children flattened into the option list. */
function readChildren(children: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
    out.push({
      value: props.value ?? '',
      label: typeof props.children === 'string' ? props.children : String(props.children ?? ''),
      disabled: props.disabled,
    });
  });
  return out;
}

/**
 * The select control, built rather than borrowed.
 *
 * A native `<select>` renders its list with the operating system, which means
 * the one part of the control people actually look at cannot be themed: not
 * its radius, not its type, not its colours, and not in dark mode. This is a
 * listbox composed from the same tokens as every other control, so the open
 * menu belongs to the design system too.
 *
 * The keyboard contract is the native one — Up/Down/Home/End to move, Enter or
 * Space to commit, Escape to dismiss, printable keys to jump — and the ARIA
 * roles say what it is, so nothing is lost by not being a `<select>`.
 */
export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      children,
      value,
      defaultValue,
      onChange,
      size = 'md',
      error,
      placeholder,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const items = useMemo(() => options ?? readChildren(children), [options, children]);
    const listId = useId();

    const [uncontrolled, setUncontrolled] = useState<string | number | undefined>(defaultValue);
    const current = value !== undefined ? value : uncontrolled;
    const selectedIndex = items.findIndex((o) => String(o.value) === String(current));
    const selected = selectedIndex >= 0 ? items[selectedIndex] : undefined;

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));
    const [above, setAbove] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const typed = useRef({ text: '', at: 0 });

    const commit = useCallback(
      (index: number) => {
        const option = items[index];
        if (!option || option.disabled) return;
        if (value === undefined) setUncontrolled(option.value);
        onChange?.({ target: { value: String(option.value) } });
        setOpen(false);
      },
      [items, onChange, value]
    );

    // Dismiss on an outside press or on Escape, like any other menu surface.
    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent) => {
        if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', onDown);
      return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // Open upward when there is not room below, so the list is never clipped.
    useEffect(() => {
      if (!open || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setAbove(window.innerHeight - rect.bottom < 260 && rect.top > 260);
      setActiveIndex(Math.max(selectedIndex, 0));
    }, [open, selectedIndex]);

    useEffect(() => {
      if (!open) return;
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [open, activeIndex]);

    const step = (delta: number) => {
      setActiveIndex((i) => {
        let next = i;
        for (let n = 0; n < items.length; n++) {
          next = (next + delta + items.length) % items.length;
          if (!items[next].disabled) return next;
        }
        return i;
      });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          step(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          step(-1);
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(items.findIndex((o) => !o.disabled));
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          commit(activeIndex);
          break;
        case 'Tab':
          setOpen(false);
          break;
        default: {
          if (e.key.length !== 1) return;
          const now = Date.now();
          typed.current.text = now - typed.current.at > 700 ? e.key : typed.current.text + e.key;
          typed.current.at = now;
          const match = items.findIndex(
            (o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text.toLowerCase())
          );
          if (match >= 0) setActiveIndex(match);
        }
      }
    };

    return (
      <Box ref={wrapperRef} className={cn(styles.wrapper, className)} data-filled={selected ? 'true' : undefined}>
        <button
          ref={ref}
          type="button"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          className={cn(styles.trigger, styles[size], error && styles.error)}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onKeyDown}
          {...props}
        >
          <span className={cn(styles.value, !selected && styles.placeholder)}>
            {selected?.label ?? placeholder ?? ''}
          </span>
          <ChevronDown size={16} className={styles.chevron} />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-activedescendant={`${listId}-${activeIndex}`}
            className={cn(styles.listbox, above && styles.above)}
          >
            {items.map((option, i) => (
              <li
                key={`${option.value}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === selectedIndex}
                aria-disabled={option.disabled || undefined}
                className={cn(styles.option, i === activeIndex && styles.active)}
                onMouseEnter={() => !option.disabled && setActiveIndex(i)}
                onClick={() => commit(i)}
              >
                <span>{option.label}</span>
                {i === selectedIndex && <Check size={14} className={styles.tick} />}
              </li>
            ))}
          </ul>
        )}
      </Box>
    );
  }
);
Select.displayName = 'Select';

export default Select;
