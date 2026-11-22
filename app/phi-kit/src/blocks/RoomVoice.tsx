import React from 'react';
import { Button, Pressable, ProgressBar, Stack, Text } from '@pui/components';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { hasApi } from '../api';
import { useLine } from '../call';
import { Face, crowdOf, memberFor, type People } from '../people';
import { LIVE, VOICE, enterVoice, leaveVoice, setVoice, useInside } from '../voice';
import { say } from './RoomStream';
import words from '../words.json';

const W = words.room;

/**
 * A voice room: who is in it, each a picture with their name, and the way in and out. Joining puts the viewer among
 * them here and under the room's entry in the menu. With the API on the room carries sound: the viewer's microphone
 * goes to everyone else who joined and theirs plays here (`voice.tsx` holds it, so it goes on when the page changes),
 * and whoever is in it live is shown from the room's line, joined or not. With no API it shows who is in it, and says
 * no sound is carried.
 */
export const RoomVoice: React.FC<{
  file: People; room: string; label: string; topic?: string;
  /** The room, as `<app>/<room>`: its line, and where the viewer's being in it is kept. */
  store: string; onWho: (id: string) => void;
}> = ({ file, room, label, topic, store, onWho }) => {
  const inside = !!useInside()[store];
  const v = VOICE.use(); const live = LIVE.use();
  // The room's line, held while the room is shown, so who is in it live is seen before joining too.
  const { line, state } = useLine(store);
  const other = state.roster.filter((c) => c.peer !== line?.peer).map((c) => ({ c, m: memberFor(file, c.name, c.handle) }));
  // Someone the room's data names who is also in it live is shown once, live.
  const crowd = crowdOf(file, room, inside).filter((m) => !other.some((o) => o.m?.id === m.id));
  const note = !hasApi ? W.soundless : !inside ? W.voicewait : live.fault === 'line' || state.fault ? W.voicefault : live.fault === 'mic' ? W.nomic : W.voicelive;
  return (
    <Stack direction="column" gap={3}>
      {topic && <Text size="sm" intent="muted">{topic}</Text>}
      <Stack direction="row" gap={2} wrap>
        {crowd.map((m) => (
          <Pressable key={m.id} card column gap={2} pad="md" aria-label={say(W.open, 'name', m.name)} onClick={() => onWho(m.id)}>
            <Face file={file} m={m} size="lg" dot />
            <Text as="span" size="sm" weight="semibold">{m.name}</Text>
            <Text as="span" size="xs" intent="muted">{m.id === file.me && v.quiet ? W.muted : m.state}</Text>
          </Pressable>))}
        {other.map(({ c, m }) => (
          <Pressable key={c.peer} card column gap={2} pad="md" aria-label={say(W.open, 'name', m?.name ?? c.name)} onClick={() => { if (m) onWho(m.id); }}>
            <Face file={file} m={m ?? { id: c.peer, name: c.name }} size="lg" />
            <Text as="span" size="sm" weight="semibold">{m?.name ?? c.name}</Text>
            <Text as="span" size="xs" intent="muted">{inside && live.far[c.peer]?.quiet ? W.muted : W.inroom}</Text>
          </Pressable>))}
        {!crowd.length && !other.length && <Text size="sm" intent="muted">{W.empty}</Text>}
      </Stack>
      {inside && live.heard && <ProgressBar value={live.level} aria-label={W.level} />}
      <Stack direction="row" gap={2} wrap>
        <Button variant="glass" iconLeft={inside ? PhoneOff : Phone} aria-pressed={inside} onClick={() => (inside ? leaveVoice(store) : enterVoice(store, label))}>{inside ? W.leave : W.join}</Button>
        {inside && <Button variant="glass" iconLeft={v.quiet ? MicOff : Mic} aria-pressed={v.quiet} onClick={() => setVoice({ quiet: !v.quiet })}>{v.quiet ? W.unmute : W.mute}</Button>}
        {inside && hasApi && <Button variant="glass" iconLeft={v.deaf ? VolumeX : Volume2} aria-pressed={v.deaf} onClick={() => setVoice({ deaf: !v.deaf })}>{v.deaf ? W.undeafen : W.deafen}</Button>}
      </Stack>
      <Text size="xs" intent="muted" role="status">{note}</Text>
    </Stack>
  );
};
