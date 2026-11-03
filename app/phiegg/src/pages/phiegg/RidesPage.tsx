import React from 'react';
import { Page, Stack, Text, Title } from '@pui/components';
import { D, rideMode, t } from '../../lib/data';
import { PageSections } from '../../components/Phiegg/PageSections';
import { RideList } from '../../components/Phiegg/Rides';
import type { RideMode } from '../../types/phiegg';

/** Rides: for sale, for fun and for hire, each a section that folds, closes and moves; each list filters by kind and world. */
export const RidesPage: React.FC = () => {
  const by = (m: RideMode) => D.ride.list.filter((r) => r.mode === m);
  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}><Title level={2} size="xl">{t('rdTitle')}</Title><Text intent="secondary">{t('rdSub')}</Text></Stack>
        <PageSections id="rides" sections={(['sale', 'fun', 'hire'] as RideMode[]).map((m) => ({ id: m, title: rideMode(m), hint: `${by(m).length}`, expandable: true, content: <RideList rows={by(m)} /> }))} />
      </Stack>
    </Page>
  );
};
