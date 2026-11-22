/**
 * The voice room this page is in. A person is in one voice room at a time, and stays in it while they move between
 * pages: the room's line (`call.ts`) and the connections to everyone else in it (`peer.ts`) are held here, once, by
 * the shell, not by the room's page. The page only shows what this keeps (`LIVE`).
 *
 * With no API there is no line: being in a room is then only a mark kept like every user document (`JOINED`), and no
 * sound is carried.
 */
import React, { useSyncExternalStore } from 'react';
import { Box, Button, Label, Stack, Stream } from '@pui/components';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { hasApi } from './api';
import { useLine, type Caller } from './call';
import { useLevel, useMic } from './mic';
import { usePeers, type Far } from './peer';
import { JOINED } from './people';
import words from './words.json';

const W = words.room;

/** A value parts of the page share while it is open; nothing of it is kept. */
const cell = <T,>(init: T) => {
  let v = init; const subs = new Set<() => void>();
  const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
  return { get: () => v, set: (next: T) => { v = next; subs.forEach((f) => f()); }, use: () => useSyncExternalStore(subscribe, () => v) };
};

/** Where the viewer is: the room (`<app>/<room>`) and its name, their microphone off, everyone else's sound off. */
type Voice = { store: string | null; label: string; quiet: boolean; deaf: boolean };
const OUT: Voice = { store: null, label: '', quiet: false, deaf: false };
export const VOICE = cell<Voice>(OUT);
/** The room as it is now: this page's name on its line, who else is in it and how each arrives, how loud the viewer
 *  is, and what went wrong (the microphone refused, or the line). */
export type Live = { peer: string | null; other: Caller[]; far: Record<string, Far>; level: number; heard: boolean; fault: '' | 'mic' | 'line' };
const QUIET: Live = { peer: null, other: [], far: {}, level: 0, heard: false, fault: '' };
export const LIVE = cell<Live>(QUIET);

const NONE: Record<string, boolean> = {};
/** The voice rooms the viewer is in, by `<app>/<room>`: the one this page is in, or with no API the ones marked. */
export const useInside = (): Record<string, boolean> => {
  const v = VOICE.use(); const kept = JOINED.use();
  return hasApi ? (v.store ? { [v.store]: true } : NONE) : kept;
};
export const enterVoice = (store: string, label: string) => {
  VOICE.set({ ...OUT, store: hasApi ? store : null, label });
  if (!hasApi) JOINED.set({ ...JOINED.get(), [store]: true });
};
/** Leave the room this page is in (with no API: the one named). */
export const leaveVoice = (store?: string) => {
  VOICE.set(OUT);
  if (!hasApi && store) JOINED.set({ ...JOINED.get(), [store]: false });
};
export const setVoice = (next: Partial<Pick<Voice, 'quiet' | 'deaf'>>) => VOICE.set({ ...VOICE.get(), ...next });

/**
 * The room's sound, mounted once by the shell. While the viewer is in a voice room it joins the room's line, holds
 * the microphone, connects to everyone else who is in, and plays each of them from a stream out of sight.
 */
export const VoiceLine: React.FC = () => {
  const v = VOICE.use();
  const { line, state } = useLine(v.store);
  React.useEffect(() => { if (!line) return; line.join(); return () => line.leave(); }, [line]);
  const { mic, fault } = useMic(!!line);
  React.useEffect(() => { mic?.getAudioTracks().forEach((t) => { t.enabled = !v.quiet; }); }, [mic, v.quiet]);
  const far = usePeers(line, state, mic, null, null, v.quiet);
  const level = useLevel(mic);
  const other = line && state.joined ? state.roster.filter((c) => c.peer !== line.peer) : [];
  const wrong = !line ? '' : state.fault ? 'line' : fault ? 'mic' : '';
  React.useEffect(() => { LIVE.set(line ? { peer: line.peer, other, far, level: v.quiet ? 0 : level, heard: !!mic, fault: wrong } : QUIET); }, [line, state, far, level, mic, wrong, v.quiet]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!line) return null;
  return <Box hidden>{other.map((c) => <Stream key={c.peer} stream={far[c.peer]?.main ?? null} muted={v.deaf} label={W.theirsound.replace('{name}', c.name)} />)}</Box>;
};

/**
 * At the foot of the menu while the viewer is in a voice room: the room (a press goes to it), the microphone, everyone
 * else's sound, and the way out. It is there on every page, because the room goes on when the page changes.
 */
export const VoiceBar: React.FC<{ go: (store: string) => void }> = ({ go }) => {
  const v = VOICE.use();
  if (!v.store) return null;
  const store = v.store;
  return (
    <Stack direction="row" gap={1} align="center" justify="between" paddingX={2} role="group" aria-label={W.connected}>
      <Button variant="ghost" size="sm" title={W.connected} onClick={() => go(store)}><Label icon={<Volume2 size={14} />}>{v.label}</Label></Button>
      <Stack direction="row" gap={0} align="center">
        <Button variant="icon" aria-label={v.quiet ? W.unmute : W.mute} title={v.quiet ? W.unmute : W.mute} aria-pressed={v.quiet} onClick={() => setVoice({ quiet: !v.quiet })}>{v.quiet ? <MicOff size={15} /> : <Mic size={15} />}</Button>
        <Button variant="icon" aria-label={v.deaf ? W.undeafen : W.deafen} title={v.deaf ? W.undeafen : W.deafen} aria-pressed={v.deaf} onClick={() => setVoice({ deaf: !v.deaf })}>{v.deaf ? <VolumeX size={15} /> : <Volume2 size={15} />}</Button>
        <Button variant="icon" aria-label={W.leave} title={W.leave} onClick={() => leaveVoice()}><PhoneOff size={15} /></Button>
      </Stack>
    </Stack>
  );
};
