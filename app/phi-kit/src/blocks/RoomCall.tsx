import React from 'react';
import { Box, Button, Frame, Label, ProgressBar, Stack, Stream, Text } from '@pui/components';
import { Mic, MicOff, MonitorUp, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useLine, type Caller } from '../call';
import { usePeers, type Far } from '../peer';
import { useLevel } from '../mic';
import { Face, memberFor, type Member, type People } from '../people';
import { say } from './RoomStream';
import words from '../words.json';

const W = words.room;
const clock = (s: number) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const stop = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop());

/** Another caller's tile: their camera when it is on, else their picture; their screen beside it when they share one.
 *  Their sound plays from a stream of its own, out of sight, so it does not break when their camera goes on or off. */
const Other: React.FC<{ file: People; c: Caller; m?: Member; far?: Far }> = ({ file, c, m, far }) => (
  <>
    <Stack direction="column" gap={1} align="center">
      {far?.video ? <Frame ratio="4/3" width="min(15rem, 100%)" rounded="md"><Stream stream={far.main} label={say(W.theircamera, 'name', c.name)} /></Frame> : <Face file={file} m={m ?? { id: c.peer, name: c.name }} size="xl" />}
      <Text as="span" size="xs" weight="semibold">{m?.name ?? c.name}</Text>
      <Text as="span" size="xs" intent="muted">{far?.quiet ? W.muted : W.incall}</Text>
      <Box hidden><Stream stream={far?.main ?? null} muted={false} label={say(W.theirsound, 'name', c.name)} /></Box>
    </Stack>
    {far?.screen && <Frame ratio="16/9" width="min(24rem, 100%)" rounded="md"><Stream stream={far.screen} label={say(W.theirscreen, 'name', c.name)} /></Frame>}
  </>
);

/**
 * A call in a room, over its stream. The viewer's own side is their microphone (with its level shown, and muted and
 * unmuted), their camera (on and off, as a mirror shows it) and a screen they share, all through the browser. With
 * the API on, the call joins the room's line (`call.ts`): everyone else who joins is connected to (`peer.ts`), sent
 * all of that, and shown in a tile of their own; whoever of the room has not joined reads as ringing. With no API the
 * call stays on this page, and says so. Ending the call leaves the line and lets go of microphone, camera and screen.
 */
export const RoomCall: React.FC<{
  file: People; label: string;
  /** The room, as `<app>/<room>`: the call's line. */
  store: string;
  /** Who is rung: the other side of a direct message, or the people of a room. */
  rung: Member[];
  /** Begin with the camera on. */
  video: boolean; onEnd: () => void;
}> = ({ file, label, store, rung, video, onEnd }) => {
  const [mic, setMic] = React.useState<MediaStream | null>(null);
  const [cam, setCam] = React.useState<MediaStream | null>(null);
  const [screen, setScreen] = React.useState<MediaStream | null>(null);
  const [quiet, setQuiet] = React.useState(false);
  const [fault, setFault] = React.useState('');
  const [since, setSince] = React.useState(0);
  const held = React.useRef<(MediaStream | null)[]>([]);
  held.current = [mic, cam, screen];
  const media = navigator.mediaDevices;
  // The room's line: in it while this call is shown, connected to everyone else who is.
  const { line, state } = useLine(store);
  React.useEffect(() => { if (!line) return; line.join(); return () => line.leave(); }, [line]);
  const far = usePeers(line, state, mic, cam, screen, quiet);
  const other = state.roster.filter((c) => c.peer !== line?.peer);
  const memberOf = (c: Caller) => memberFor(file, c.name, c.handle);

  const camera = (on: boolean) => {
    if (!on) { stop(cam); setCam(null); return; }
    media?.getUserMedia({ video: true }).then(setCam, () => setFault(W.nocamera));
  };
  const share = () => {
    if (screen) { stop(screen); setScreen(null); return; }
    media?.getDisplayMedia({ video: true }).then((s) => { s.getVideoTracks()[0]?.addEventListener('ended', () => setScreen(null)); setScreen(s); }, () => undefined);
  };
  // The call begins: the microphone, and the camera when it is a video call. It ends: everything held is let go.
  React.useEffect(() => {
    if (!media) { setFault(W.nomedia); return; }
    media.getUserMedia({ audio: true }).then(setMic, () => setFault(W.nomic));
    if (video) camera(true);
    const tick = window.setInterval(() => setSince((s) => s + 1), 1000);
    return () => { window.clearInterval(tick); held.current.forEach(stop); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // How loud the viewer is, so they can see the microphone hears them.
  const level = useLevel(mic);
  React.useEffect(() => { mic?.getAudioTracks().forEach((t) => { t.enabled = !quiet; }); }, [mic, quiet]);

  const me = file.member.find((m) => m.id === file.me);
  return (
    <Box className="phi-region" role="group" aria-label={say(W.calling, 'room', label)}>
      <Stack direction="column" gap={3}>
        <Stack direction="row" gap={2} align="center" justify="between" wrap>
          <Label icon={<Phone size={14} />}>{say(W.calling, 'room', label)}</Label>
          <Text as="span" size="sm" intent="muted" numeric>{clock(since)}</Text>
        </Stack>
        <Stack direction="row" gap={2} wrap align="start">
          <Stack direction="column" gap={1} align="center">
            {cam ? <Frame ratio="4/3" width="min(15rem, 100%)" rounded="md"><Stream stream={cam} mirrored label={W.mycamera} /></Frame> : <Face file={file} m={me} size="xl" />}
            <Text as="span" size="xs" intent="muted">{quiet ? W.muted : W.you}</Text>
          </Stack>
          {screen && <Frame ratio="16/9" width="min(24rem, 100%)" rounded="md"><Stream stream={screen} label={W.myscreen} /></Frame>}
          {other.map((c) => <Other key={c.peer} file={file} c={c} m={memberOf(c)} far={far[c.peer]} />)}
          {rung.filter((m) => !other.some((c) => memberOf(c)?.id === m.id)).map((m) => (
            <Stack key={m.id} direction="column" gap={1} align="center">
              <Face file={file} m={m} size="xl" dot />
              <Text as="span" size="xs" weight="semibold">{m.name}</Text>
              <Text as="span" size="xs" intent="muted">{W.ringing}</Text>
            </Stack>))}
        </Stack>
        {mic && <ProgressBar value={quiet ? 0 : level} aria-label={W.level} />}
        <Stack direction="row" gap={2} wrap>
          <Button variant="glass" iconLeft={quiet ? MicOff : Mic} aria-pressed={quiet} disabled={!mic} onClick={() => setQuiet(!quiet)}>{quiet ? W.unmute : W.mute}</Button>
          <Button variant="glass" iconLeft={cam ? VideoOff : Video} aria-pressed={!!cam} onClick={() => camera(!cam)}>{cam ? W.camoff : W.camon}</Button>
          <Button variant="glass" iconLeft={MonitorUp} aria-pressed={!!screen} onClick={share}>{screen ? W.unshare : W.share}</Button>
          <Button variant="glass" iconLeft={PhoneOff} onClick={onEnd}>{W.hangup}</Button>
        </Stack>
        <Text size="xs" intent="muted">{fault || (!line ? W.oneside : state.fault ? W.noline : W.live)}</Text>
      </Stack>
    </Box>
  );
};
