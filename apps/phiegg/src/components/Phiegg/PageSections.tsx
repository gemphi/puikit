import React from 'react';
import { Sections, type SectionDef } from '@pui/components';
import { t } from '../../lib/data';

/**
 * The sections of a page or a sheet, one way everywhere: every section folds, closes and moves up or down with the
 * arrows on the right of its header, and the reader's layout is kept per page (`id`). Labels are plain nouns.
 */
export const PageSections: React.FC<{ id: string; sections: SectionDef[]; size?: 'sm' | 'lg' }> = ({ id, sections, size = 'lg' }) => (
  <Sections reorderable storageKey={'phiegg:' + id} size={size} variant={size === 'lg' ? 'plain' : 'card'} sections={sections.map((x) => ({ collapsible: true, closable: true, ...x }))}
    expandLabel={t('expand')} collapseLabel={t('collapse')} foldLabel={t('fold')} closeLabel={t('close')} upLabel={t('secUp')} downLabel={t('secDown')} resetLabel={t('secReset')} />
);
