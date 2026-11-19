import React from 'react';
import { Icon, Sections, Stack, Text, type SectionDef } from '@pui/components';
import * as L from 'lucide-react';
import { useStore } from '@pui/store';
import { site, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';

/** A section's glyph by its id (about, zones, posts, chat, stats…), from site.json sectionIcons: lucide names. */
const ICONS = (site as unknown as { sectionIcons: Record<string, string> }).sectionIcons;
const LAYOUTS = (site as unknown as { layouts: { list: { id: string; label: string; icon: string }[] } }).layouts.list;
const glyphOf = (name: string) => { const G = (L as unknown as Record<string, L.LucideIcon>)[name]; return G ? <Icon icon={G} size="sm" /> : null; };
const iconOf = (id: string) => { const name = ICONS[id]; const G = name ? (L as unknown as Record<string, L.LucideIcon>)[name] : undefined; return G ? <Icon icon={G} size="sm" /> : undefined; };

/**
 * The sections of a page or a sheet, one way everywhere: every section is a card on the app's gradient (never a bare
 * row on the page), its icon before its title, its header staying at the top while it scrolls by; every section
 * folds, closes and moves up or down with the arrows on the right of its header, and the reader's layout is kept per
 * page (`id`). The first section is the page's own subject (the look, the world): it folds and moves but never closes,
 * so opening another item never lands on a page with its picture shut away. Labels are plain nouns.
 */
/** A heading carries a count at most; a sentence is no heading, so it opens the section's body instead. */
const PHRASE = 24;
const tidy = (x: SectionDef): SectionDef => (typeof x.hint === 'string' && x.hint.length > PHRASE
  ? { ...x, hint: undefined, content: <Stack direction="column" gap={3}><Text size="sm" intent="muted">{x.hint}</Text>{x.content}</Stack> }
  : x);
/** A section marked `switchable` holds a grid: its header gets the one layout icon (tile, grid, list: site.json layouts),
 *  which sets the app's list view, so the grid under it (ViewGrid, ListView) follows. */
export const PageSections: React.FC<{ id: string; sections: (SectionDef & { switchable?: boolean })[]; size?: 'sm' | 'lg'; variant?: 'card' | 'band' }> = ({ id, sections, size = 'lg', variant = 'card' }) => {
  const { view, setView } = useStore(phieggStore);
  const layouts = LAYOUTS.map((l) => ({ id: l.id, label: l.label, icon: glyphOf(l.icon) }));
  return (
  <Sections reorderable storageKey={'phiegg:' + id} size={size} variant={variant} sections={sections.map(({ switchable, ...x }, i) => ({ collapsible: true, closable: true, icon: iconOf(x.id), ...tidy(x), ...(i === 0 ? { closable: false } : {}),
    ...(switchable ? { layouts, layout: view.mode, onLayout: (m: string) => setView({ ...view, mode: m as typeof view.mode }) } : {}) }))}
    expandLabel={t('expand')} collapseLabel={t('collapse')} foldLabel={t('fold')} closeLabel={t('close')} upLabel={t('secUp')} downLabel={t('secDown')} resetLabel={t('secReset')} />
  );
};
