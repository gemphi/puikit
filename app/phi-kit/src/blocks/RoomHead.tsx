import React from 'react';
import { Button, Popover, Stack, Text, columnStore, useColumnEntries } from '@pui/components';
import { Phone, Pin, Search, Users, Video } from 'lucide-react';
import { useLine } from '../call';
import type { People } from '../people';
import { Line, say, seek, type Message } from './RoomStream';
import words from '../words.json';

const W = words.room;

/** Who is calling in a room whose call the viewer is not in: the first of them, as the room's line says (`call.ts`). */
const useCaller = (store: string) => { const { line, state } = useLine(store); return state.joined ? undefined : state.roster.find((c) => c.peer !== line?.peer); };

/**
 * Beside a room's name while someone else is in a call there and the viewer is not: who is calling, and Join. It sits
 * with the name, not among the head's actions, because those show only under the pointer and a call must be seen.
 */
export const RoomRing: React.FC<{ store: string; onJoin: () => void }> = ({ store, onJoin }) => {
  const caller = useCaller(store);
  if (!caller) return null;
  return (
    <>
      <Button variant="glass" size="sm" iconLeft={Phone} title={say(W.incoming, 'name', caller.name)} onClick={onJoin}>{W.join}</Button>
      <Text as="span" size="xs" intent="muted" truncate role="status">{say(W.incoming, 'name', caller.name)}</Text>
    </>
  );
};

/**
 * What a room's head offers, at the end of its column's head: a call, with the camera or without; search in this room, the messages pinned in it (a press
 * on one leads to it), and showing or hiding the column beside the stream (the members, or a profile). The kit's
 * Columns shows these while the pointer is over the stream, and behind three dots on a phone. While someone else is
 * calling in this room the two call buttons step aside: Join, beside the room's name (RoomRing), is the way in.
 */
export const RoomHead: React.FC<{
  file: People; label: string; store: string; pinned: Message[]; nameOf: (id: string) => string;
  finding: boolean; onFind: () => void;
  /** Begin a call in this room, with the camera or without. */
  onCall: (video: boolean) => void;
  /** The id of the column beside the stream, when it can be shown and hidden. */
  side?: string;
}> = ({ file, label, store, pinned, nameOf, finding, onFind, onCall, side }) => {
  const open = useColumnEntries().find((c) => c.id === side)?.open !== false;
  const caller = useCaller(store);
  return (
    <>
      {!caller && <Button variant="icon" aria-label={W.call} title={W.call} onClick={() => onCall(false)}><Phone size={15} /></Button>}
      {!caller && <Button variant="icon" aria-label={W.videocall} title={W.videocall} onClick={() => onCall(true)}><Video size={15} /></Button>}
      <Button variant="icon" aria-label={say(W.find, 'room', label)} title={say(W.find, 'room', label)} aria-pressed={finding} onClick={onFind}><Search size={15} /></Button>
      <Popover portal placement="bottom-end" trigger={<Button variant="icon" aria-label={W.pins} title={W.pins}><Pin size={15} /></Button>}>
        <Stack direction="column" gap={1} minWidth="14rem" maxWidth="22rem">
          <Text as="span" size="xs" intent="muted">{W.pins}</Text>
          {pinned.length
            ? pinned.map((x) => <Line key={x.id} file={file} x={x} name={nameOf(x.by)} label={say(W.seek, 'name', nameOf(x.by))} onClick={() => seek(store, x.id)} />)
            : <Text as="span" size="sm" intent="muted">{W.unpinned}</Text>}
        </Stack>
      </Popover>
      {side && <Button variant="icon" aria-label={W.beside} title={W.beside} aria-pressed={open} onClick={() => columnStore.toggle(side)}><Users size={15} /></Button>}
    </>
  );
};
