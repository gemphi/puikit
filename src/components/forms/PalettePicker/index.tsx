import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import { usePuiTheme } from '../../../providers/PuiProvider';
import { GRADIENT_LEVELS, RADIUS_LABELS, RADIUS_PRESETS, radiusPresetOf, type RadiusPreset, hsl, paletteColors, type GradientLevel, type SeedPalette } from '../../../providers/palette';
import styles from './styles.module.scss';

export type PalettePickerProps = {
  /** Selected palette id ('none' = brand colours). Defaults to the provider's. */
  value?: string;
  onChange?: (id: string) => void;
  /** Offer a "None" swatch that keeps the brand colours. */
  allowNone?: boolean;
  noneLabel?: string;
  palettes?: SeedPalette[];
  className?: string;
};

/** Swatches for the seeded palettes: ground, accent and second accent of each, in the current mode. */
export const PalettePicker = ({ value, onChange, allowNone = true, noneLabel = 'None', palettes, className }: PalettePickerProps) => {
  const ctx = usePuiTheme();
  const list = palettes ?? ctx.palettes;
  const cur = value ?? (ctx.paletteId || 'none');
  const set = onChange ?? ctx.setPaletteId;
  return (
    <Box className={cn(styles.grid, className)} role="radiogroup" aria-label="Palette">
      {allowNone && (
        <Box as="button" role="radio" aria-checked={cur === 'none'} className={cn(styles.swatch, cur === 'none' && styles.on)} onClick={() => set('none')}>
          <Box as="span" className={styles.chip} style={{ background: 'var(--phi-color-background-secondary)' }} />
          <Text size="xs">{noneLabel}</Text>
        </Box>
      )}
      {list.map((p) => {
        const c = paletteColors(p, ctx.isDark);
        return (
          <Box key={p.id} as="button" role="radio" aria-checked={cur === p.id} title={p.source} className={cn(styles.swatch, cur === p.id && styles.on)} onClick={() => set(p.id)}>
            <Box as="span" className={styles.chip} style={{ background: `linear-gradient(135deg, ${hsl(c.accent)} 0 34%, ${hsl(c.accent2)} 34% 52%, ${hsl(c.card)} 52% 100%)` }} />
            <Text size="xs">{p.name}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

export type GradientLevelPickerProps = { value?: GradientLevel; onChange?: (l: GradientLevel) => void; labels?: Partial<Record<GradientLevel, string>>; className?: string };

/** Flat · Soft · Vivid · Aurora, each previewed with the active accents. */
export const GradientLevelPicker = ({ value, onChange, labels = {}, className }: GradientLevelPickerProps) => {
  const ctx = usePuiTheme();
  const cur = value ?? (ctx.gradientLevel || 'flat');
  const set = onChange ?? ctx.setGradientLevel;
  const look: Record<GradientLevel, string> = {
    flat: 'var(--phi-color-background-card)',
    soft: 'linear-gradient(160deg, color-mix(in srgb, var(--phi-color-primary) 22%, var(--phi-color-background-card)), var(--phi-color-background-card) 70%)',
    vivid: 'linear-gradient(145deg, color-mix(in srgb, var(--phi-color-primary) 55%, var(--phi-color-background-card)), color-mix(in srgb, var(--phi-color-accent-2, var(--phi-color-success)) 45%, var(--phi-color-background-card)))',
    aurora: 'radial-gradient(70% 70% at 10% 10%, color-mix(in srgb, var(--phi-color-primary) 65%, transparent), transparent 70%), radial-gradient(70% 70% at 90% 90%, color-mix(in srgb, var(--phi-color-accent-2, var(--phi-color-success)) 55%, transparent), transparent 70%), radial-gradient(60% 60% at 90% 10%, color-mix(in srgb, var(--phi-color-accent-3, var(--phi-color-info)) 50%, transparent), transparent 70%), var(--phi-color-background-card)',
  };
  return (
    <Box className={cn(styles.grid, className)} role="radiogroup" aria-label="Gradient">
      {GRADIENT_LEVELS.map((l) => (
        <Box key={l} as="button" role="radio" aria-checked={cur === l} className={cn(styles.swatch, cur === l && styles.on)} onClick={() => set(l)}>
          <Box as="span" className={styles.chip} style={{ background: look[l] }} />
          <Text size="xs">{labels[l] ?? l[0].toUpperCase() + l.slice(1)}</Text>
        </Box>
      ))}
    </Box>
  );
};

export type RadiusPickerProps = { value?: RadiusPreset; onChange?: (s: RadiusPreset) => void; labels?: Partial<Record<RadiusPreset, string>>; className?: string };

/** Small · Medium · Large · Pill (egg) — sets the theme radius scale that every `--phi-radius-*` token follows. */
export const RadiusPicker = ({ value, onChange, labels = {}, className }: RadiusPickerProps) => {
  const ctx = usePuiTheme();
  const cur = value ?? radiusPresetOf(ctx.borderRadius ?? 1);
  const set = onChange ?? ((s: RadiusPreset) => ctx.setBorderRadius(RADIUS_PRESETS[s]));
  return (
    <Box className={cn(styles.grid, className)} role="radiogroup" aria-label="Radius">
      {(Object.keys(RADIUS_PRESETS) as RadiusPreset[]).map((k) => (
        <Box key={k} as="button" role="radio" aria-checked={cur === k} className={cn(styles.swatch, cur === k && styles.on)} onClick={() => set(k)}>
          <Box as="span" className={styles.chip} style={{ width: k === 'pill' ? '1.9rem' : '2.6rem', height: k === 'pill' ? '2.4rem' : '1.9rem', background: 'color-mix(in srgb, var(--phi-color-primary) 45%, var(--phi-color-background-card))', borderRadius: k === 'pill' ? '50% 50% 50% 50% / 60% 60% 40% 40%' : `${Math.round(6 * RADIUS_PRESETS[k])}px` }} />
          <Text size="xs">{labels[k] ?? RADIUS_LABELS[k]}</Text>
        </Box>
      ))}
    </Box>
  );
};
