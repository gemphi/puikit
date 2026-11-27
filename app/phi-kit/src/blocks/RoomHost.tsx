import React from 'react';
import { Button, Modal, Stack, TabList } from '@pui/components';
import { Settings } from 'lucide-react';
import type { People } from '../people';
import { Members, RoleList, RoomRights, type Roles } from '../role';
import { Invites } from '../invite';
import { NoticeTab } from '../notice';
import words from '../talk.json';

const W = words.role;
type Tab = 'members' | 'roles' | 'rights' | 'invite' | 'notice';

/** The button in a room's head that opens its host's settings. The head's tools show only under the pointer, so the
 *  settings themselves are held by the room (`RoomHost`), not by the button. */
export const HostButton: React.FC<{ space: string; onOpen: () => void }> = ({ space, onOpen }) => {
  const name = W.panel.replace('{host}', space);
  return <Button variant="icon" aria-label={name} title={name} onClick={onOpen}><Settings size={15} /></Button>;
};

/**
 * A host's settings, from the head of any of its rooms: its members by role, its roles, who may do what in this room,
 * its invites and what the viewer is told of it. Every part is the kit's (`role.tsx`, `invite.tsx`, `notice.tsx`); an
 * app gives the data (`role.json`, which names the page invites open).
 */
export const RoomHost: React.FC<{ app: string; invite?: string; file: People; roles: Roles; space: string; room: string; label: string; open: boolean; onClose: () => void }> = ({ app, invite, file, roles, space, room, label, open, onClose }) => {
  const [tab, setTab] = React.useState<Tab>('members');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'members', label: W.members }, { id: 'roles', label: W.roles }, { id: 'rights', label: W.rights },
    ...(invite ? [{ id: 'invite' as Tab, label: words.invite.tab }] : []), { id: 'notice', label: words.notice.tab },
  ];
  const name = W.panel.replace('{host}', space);
  return (
    <Modal isOpen={open} onClose={onClose} title={name} size="md">
      <Stack direction="column" gap={3}>
        <TabList size="sm" variant="pills" aria-label={name} activeId={tab} onChange={(id) => setTab(id as Tab)} items={tabs} />
        {tab === 'members' && <Members roles={roles} file={file} space={space} host={space} />}
        {tab === 'roles' && <RoleList roles={roles} file={file} space={space} host={space} />}
        {tab === 'rights' && <RoomRights roles={roles} file={file} space={space} room={room} host={label} />}
        {tab === 'invite' && invite && <Invites app={app} page={invite} host={space} space={space} roles={roles} file={file} />}
        {tab === 'notice' && <NoticeTab app={app} space={space} />}
      </Stack>
    </Modal>
  );
};
