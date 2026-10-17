import React from 'react';
import { Modal } from '../Modal';
import { Button } from '../../primitives/Button';
import { Title } from '../../primitives/Title';
import { Text } from '../../primitives/Text';
import { Stack } from '../../layout/Stack';
import { Select } from '../../forms/Select';
import { FormGroup } from '../../forms/FormGroup';
import { usePuiTheme } from '../../../providers/PuiProvider';
import type { Theme, ThemeStyle } from '../../../providers/types';

/**
 * Discrete radius steps, applied as the `--phi-radius-scale` multiplier. `0`
 * squares every corner in the system; `1.6` rounds them uniformly.
 */
export const RADIUS_STEPS = [
  { label: 'Small', value: 0.5 },
  { label: 'Medium', value: 1 },
  { label: 'Large', value: 1.75 },
  { label: 'Pill (egg)', value: 3 },
] as const;

/**
 * Discrete density steps, applied as the `--phi-space-scale` multiplier. The
 * names describe the resulting UI, not the number, because that is what a
 * person is actually choosing between.
 */
export const DENSITY_STEPS = [
  { label: 'Compact', value: 0.8 },
  { label: 'Default', value: 1 },
  { label: 'Relaxed', value: 1.2 },
  { label: 'Spacious', value: 1.4 },
] as const;

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const STYLES: Array<{ value: ThemeStyle; label: string }> = [
  { value: 'apple', label: 'Apple' },
  { value: 'flat', label: 'Flat' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'elevated', label: 'Elevated' },
  { value: 'glass', label: 'Glass' },
];

/**
 * Map an arbitrary persisted scale onto the nearest named step, so a value
 * saved before these steps existed still selects a sensible option instead of
 * rendering the picker blank.
 */
const nearestStep = (steps: ReadonlyArray<{ value: number }>, value: number): number =>
  steps.reduce((best, step) =>
    Math.abs(step.value - value) < Math.abs(best.value - value) ? step : best
  ).value;

export interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Hide the archetype picker in apps that pin one structure. */
  showArchetype?: boolean;
  /** Hide the brand picker in apps that ship a single brand. */
  showBrand?: boolean;
}

/**
 * The preference surface, shared by every app.
 *
 * Every control is a **discrete option picker** — no sliders, no free numeric
 * entry. A preference surface should offer the values the design system
 * actually supports rather than inviting arbitrary ones, so any two users land
 * on the same set of looks.
 *
 * Changes round-trip through `PuiProvider`, which persists them per user. The
 * default identity is `guest`, so an anonymous visitor's choices survive a
 * reload and are swapped wholesale when they sign in.
 */
export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  title = 'Preferences',
  showArchetype = true,
  showBrand = true,
}) => {
  const {
    theme, setTheme,
    themeStyle, setThemeStyle,
    brandId, setBrandId,
    archetypeId, setArchetypeId,
    borderRadius, setBorderRadius,
    density, setDensity,
    brands, archetypes,
    setPreferences,
    userId,
  } = usePuiTheme();

  const reset = () =>
    setPreferences({
      theme: 'system',
      themeStyle: 'apple',
      brandId: brands[0]?.id ?? brandId,
      archetypeId: archetypes[0]?.id ?? archetypeId,
      borderRadius: 1,
      density: 1,
    });

  const footer = (
    <Stack direction="row" gap={2} justify="end">
      <Button variant="outline" size="sm" onClick={reset}>
        Reset to defaults
      </Button>
      <Button variant="primary" size="sm" onClick={onClose}>
        Done
      </Button>
    </Stack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" footer={footer}>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Title level={6}>Appearance</Title>
          <Text size="sm" intent="secondary">
            Applied live and saved for {userId === 'guest' ? 'this browser' : userId}.
          </Text>
        </Stack>

        <FormGroup label="Theme" labelFor="pref-theme">
          <Select id="pref-theme" value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            {THEMES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup label="Theme style" labelFor="pref-style">
          <Select id="pref-style" value={themeStyle} onChange={(e) => setThemeStyle(e.target.value as ThemeStyle)}>
            {STYLES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </FormGroup>

        {showBrand && (
          <FormGroup label="Brand" labelFor="pref-brand">
            <Select id="pref-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </FormGroup>
        )}

        {showArchetype && (
          <FormGroup label="Archetype" labelFor="pref-archetype">
            <Select id="pref-archetype" value={archetypeId} onChange={(e) => setArchetypeId(e.target.value)}>
              {archetypes.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </FormGroup>
        )}

        <FormGroup
          label="Corner radius"
          labelFor="pref-radius"
          helperText="Scales every radius token together, from square to fully rounded."
        >
          <Select
            id="pref-radius"
            value={String(nearestStep(RADIUS_STEPS, borderRadius))}
            onChange={(e) => setBorderRadius(Number(e.target.value))}
          >
            {RADIUS_STEPS.map((step) => (
              <option key={step.label} value={step.value}>{step.label}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup
          label="Density"
          labelFor="pref-density"
          helperText="Scales every spacing token together, tightening or loosening the whole UI."
        >
          <Select
            id="pref-density"
            value={String(nearestStep(DENSITY_STEPS, density))}
            onChange={(e) => setDensity(Number(e.target.value))}
          >
            {DENSITY_STEPS.map((step) => (
              <option key={step.label} value={step.value}>{step.label}</option>
            ))}
          </Select>
        </FormGroup>
      </Stack>
    </Modal>
  );
};
