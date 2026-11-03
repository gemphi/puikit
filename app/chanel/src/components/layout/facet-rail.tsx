import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  FacetFilter,
  Title,
  Button,
  Stack,
} from '@pui/components';
import { X } from 'lucide-react';
import type { ShopFacet } from '@pui/types';
import { useFacets } from '@pui/shop';
import { t } from '../../locales/t';
import s from '../../styles/chanel.module.scss';

export interface FacetRailProps {
  facets: ShopFacet[];
  onClose: () => void;
}

/**
 * The facet rail. It expresses intent only — the catalog store resets
 * pagination on every change, so nothing here knows a page number exists.
 */
export const FacetRail: React.FC<FacetRailProps> = ({ facets, onClose }) => {
  const { selected, setSelection, reset, activeCount } = useFacets();

  return (
    <Sidebar aria-label={t.catalog.refine}>
      <SidebarHeader>
        <Stack direction="row" align="center" justify="between">
          <Title level={6} className={s.label}>
            {t.catalog.refine}
          </Title>
          <Button variant="ghost" size="sm" aria-label={t.nav.hideFilters} onClick={onClose} icon={<X size={14} />} />
        </Stack>
      </SidebarHeader>

      <SidebarBody>
        <Stack direction="column" gap={4}>
          {facets.map((facet) => (
            <FacetFilter
              key={facet.id}
              title={facet.label}
              /* Colourways read as swatches; everything else as counted checkboxes. */
              display={facet.id === 'colour' ? 'swatch' : 'checkbox'}
              collapsible
              maxVisible={8}
              labels={{
                showMore: (n) => t.catalog.showMore.replace('{count}', String(n)),
                showLess: t.catalog.showLess,
                collapse: t.catalog.collapse,
                expand: t.catalog.expand,
              }}
              options={facet.values.map((v) => ({
                value: v.value,
                label: v.label ?? v.value,
                count: v.count,
                hex: (v as { hex?: string }).hex,
              }))}
              selectedValues={selected[facet.id] ?? []}
              onChange={(next) => setSelection(facet.id, next)}
            />
          ))}
        </Stack>
      </SidebarBody>

      {activeCount > 0 && (
        <SidebarFooter>
          <Button variant="outline" size="sm" onClick={reset}>
            {t.catalog.clearFilters}
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
