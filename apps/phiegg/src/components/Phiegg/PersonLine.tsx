import React from 'react';
import { Pressable, Stack, Text, Tag } from '@pui/components';
import { PersonAvatar } from './PersonAvatar';
import { useStore } from '@pui/store';
import { person, t } from '../../lib/data';
import { phieggStore } from '../../state/phieggStore';

export const PersonLine: React.FC<{ id: string; sub?: string; size?: 'sm' | 'md' | 'lg' }> = ({ id, sub, size = 'md' }) => {
  const p = person(id);
  const { openPerson } = useStore(phieggStore);
  return (
    <Pressable row gap={2} onClick={() => openPerson(id)}>
      <PersonAvatar id={id} size={size} />
      <Stack direction="column" gap={0}>
        <Stack direction="row" gap={1} align="center"><Text size="sm" weight="bold">{p.name}</Text>{p.isAgent && <Tag intent="success" minimal round size="sm">{t('aiAgent')}</Tag>}</Stack>
        {sub && <Text size="xs" intent="muted">{sub}</Text>}
      </Stack>
    </Pressable>
  );
};
