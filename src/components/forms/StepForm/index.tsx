'use client';

import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Title } from '../../primitives/Title';
import { Text } from '../../primitives/Text';
import { Button } from '../../primitives/Button';
import { Check } from 'lucide-react';
import styles from './styles.module.scss';

/** One field: a label over its control, rendered as a bordered sub-group. */
export type StepFormField = {
  id?: string;
  label: string;
  /** A line under the control (a hint, a unit, an error). */
  hint?: string;
  /** The control itself (an Input, Select, TabList, Textarea…). */
  control: React.ReactNode;
  /** Span the full width of the field grid instead of one column. */
  full?: boolean;
};

/** A titled section of fields, bordered as a group. */
export type StepFormSection = {
  id?: string;
  title?: string;
  hint?: string;
  fields: StepFormField[];
};

export type StepFormStep = {
  id: string;
  /** Rail label. */
  label: string;
  /** Rail icon, shown in the step marker (falls back to the step number). */
  icon?: React.ReactNode;
  /** Rail supporting line, e.g. the value chosen on a completed step. */
  hint?: string;
  /** Heading above this step's fields. Defaults to the label. */
  title?: string;
  /** One line under the heading. */
  lede?: string;
  /** Titled, bordered sections (application forms). Takes precedence over `fields`. */
  sections?: StepFormSection[];
  /** Flat fields; each renders as its own bordered sub-group. */
  fields?: StepFormField[];
  /** Escape hatch when neither fits. */
  content?: React.ReactNode;
  /** Block Next until true. Omitted = always allowed. */
  valid?: boolean;
};

export type StepFormProps = {
  steps: StepFormStep[];
  activeIndex?: number;
  defaultIndex?: number;
  onStepChange?: (index: number) => void;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  nextLabel?: string;
  backLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  busy?: boolean;
  /** Title at the top of the form, spanning both columns. */
  title?: string;
  /** One line under the title. */
  sub?: string;
  /** A panel pinned under the rail: an order summary, a running total. */
  aside?: React.ReactNode;
  /** Content above the actions on the last step (a review, a total). */
  review?: React.ReactNode;
  /** Fill the host's height, rail fixed and the fields scrolling. Default true. */
  fill?: boolean;
  className?: string;
};

const FieldGroup: React.FC<{ field: StepFormField }> = ({ field }) => (
  <Box className={cn(styles.group, field.full && styles.full)}>
    <Text as="label" size="sm" intent="muted" className={styles.groupLabel}>{field.label}</Text>
    <Box className={styles.control}>{field.control}</Box>
    {field.hint && <Text size="xs" intent="muted" className={styles.groupHint}>{field.hint}</Text>}
  </Box>
);

const StepBody: React.FC<{ step?: StepFormStep }> = ({ step }) => {
  if (!step) return null;
  if (step.sections?.length) {
    return (
      <Stack direction="column" gap={4}>
        {step.sections.map((sec, i) => (
          <Box key={sec.id ?? i} as="section" className={styles.section}>
            {(sec.title || sec.hint) && (
              <Box className={styles.sectionHead}>
                {sec.title && <Text weight="bold" className={styles.sectionTitle}>{sec.title}</Text>}
                {sec.hint && <Text size="xs" intent="muted">{sec.hint}</Text>}
              </Box>
            )}
            <Box className={styles.fieldGrid}>
              {sec.fields.map((f, j) => <FieldGroup key={f.id ?? j} field={f} />)}
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }
  if (step.fields?.length) {
    return <Box className={styles.fieldGrid}>{step.fields.map((f, j) => <FieldGroup key={f.id ?? j} field={f} />)}</Box>;
  }
  return <>{step.content}</>;
};

/**
 * One full-screen, stepped form for the whole library. A header spans the top; below it a fixed rail of steps on the
 * left (icon, the active one filled and lit, a check on the ones done, the chosen value as a hint) sits beside the
 * active step's fields on the right, each field a bordered sub-group laid across the width; Back / Next / Submit span
 * the foot. The two columns share one grid so their tops align. Every inset, gap, radius and surface is a theme token,
 * so density and palette flow straight through and each app wears its own colours. A single step renders flat, no rail.
 * Pair it with an expandable Drawer for an edit sheet that fills the window.
 */
export const StepForm: React.FC<StepFormProps> = ({
  steps,
  activeIndex,
  defaultIndex = 0,
  onStepChange,
  onSubmit,
  submitLabel,
  nextLabel = 'Next',
  backLabel = 'Back',
  cancelLabel = 'Cancel',
  onCancel,
  busy = false,
  title,
  sub,
  aside,
  review,
  fill = true,
  className = '',
}) => {
  const [own, setOwn] = React.useState(defaultIndex);
  // The form answers to its own width (a drawer, a column), not the window's.
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const el = rootRef.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 720)); ro.observe(el); return () => ro.disconnect();
  }, []);
  const at = activeIndex ?? own;
  const go = (i: number) => {
    const n = Math.max(0, Math.min(steps.length - 1, i));
    if (activeIndex === undefined) setOwn(n);
    onStepChange?.(n);
  };
  const multi = steps.length > 1;
  const step = steps[at] ?? steps[0];
  const last = at === steps.length - 1;
  const blocked = step?.valid === false;

  return (
    <Box ref={rootRef} data-narrow={narrow || undefined} className={cn(styles.root, fill && styles.fill, multi ? styles.withRail : styles.single, className)}>
      {(title || sub) && (
        <Box className={styles.header}>
          <Stack direction="column" gap={0}>
            {title && <Title variant="h3" className={styles.formTitle}>{title}</Title>}
            {sub && <Text size="sm" intent="muted">{sub}</Text>}
          </Stack>
          {multi && <Text size="sm" intent="muted" className={styles.counter}>{`Step ${at + 1} of ${steps.length}`}</Text>}
        </Box>
      )}

      {multi && (
        <Box as="nav" className={styles.rail} aria-label={title ?? 'Steps'}>
          <Stack direction="column" gap={2} className={styles.railInner}>
            {steps.map((s, i) => {
              const state = i < at ? 'complete' : i === at ? 'active' : 'upcoming';
              const navigable = i <= at;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={styles.railRow}
                  data-state={state}
                  aria-current={state === 'active' ? 'step' : undefined}
                  disabled={!navigable}
                  onClick={() => { if (navigable) go(i); }}
                >
                  <span className={styles.railMarker} aria-hidden="true">
                    {state === 'complete' ? <Check size={15} /> : (s.icon ?? i + 1)}
                  </span>
                  <span className={styles.railText}>
                    <Text as="span" size="sm" className={styles.railLabel}>{s.label}</Text>
                    {s.hint && <Text as="span" size="xs" intent="muted" className={styles.railHint}>{s.hint}</Text>}
                  </span>
                </button>
              );
            })}
            {aside && <Box className={styles.aside}>{aside}</Box>}
          </Stack>
        </Box>
      )}

      <Box className={styles.main}>
        <Box className={styles.scroll}>
          <Stack direction="column" gap={4} className={styles.panel}>
            <Stack direction="column" gap={1} className={styles.stepHead}>
              <Title variant="h2" className={styles.stepTitle}>{step?.title ?? step?.label}</Title>
              {step?.lede && <Text intent="muted">{step.lede}</Text>}
            </Stack>
            <StepBody step={step} />
            {last && review && <Box className={styles.review}>{review}</Box>}
          </Stack>
        </Box>
      </Box>

      <Box className={styles.foot}>
        <Box className={styles.actionsLeft}>{onCancel && <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>}</Box>
        <Stack direction="row" gap={2} align="center">
          {at > 0 && <Button variant="outline" onClick={() => go(at - 1)}>{backLabel}</Button>}
          {!last && <Button variant="primary" disabled={blocked} onClick={() => go(at + 1)}>{nextLabel}</Button>}
          {last && <Button variant="primary" disabled={busy || blocked} onClick={() => void onSubmit()}>{submitLabel}</Button>}
        </Stack>
      </Box>
    </Box>
  );
};

export default StepForm;
