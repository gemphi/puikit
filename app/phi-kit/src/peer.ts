/**
 * The other sides of a call: one WebRTC connection from this page to each other caller on the room's line (`call.ts`).
 *
 * Every caller connects to every other (a mesh). Each connection sends this page's microphone and camera as one stream
 * and a shared screen as another, and shows what comes back. Both ends may offer at once (a camera turned on at the
 * same moment on both sides): the end with the lesser name gives way, which is WebRTC's own "perfect negotiation".
 * Turning the camera or the screen on or off adds or removes a track and the two ends agree again by themselves.
 */
import { useEffect, useRef, useState } from 'react';
import type { Line, LineState, Signal } from './call';

/** Another caller as this page receives them. */
export type Far = {
  /** Their microphone and camera: always played for its sound. */
  main: MediaStream | null;
  /** Their camera is on and arriving. */
  video: boolean;
  /** A screen they share, while it arrives. */
  screen: MediaStream | null;
  quiet: boolean;
};
type Local = { main: MediaStreamTrack[]; screen: MediaStreamTrack[]; quiet: boolean };
type Link = { pc: RTCPeerConnection; polite: boolean; making: boolean; ignore: boolean; sent: Map<MediaStreamTrack, RTCRtpSender>;
  todo: Promise<void>; got: Map<string, MediaStream>; quiet: boolean; screen: string };

const seen = (s?: MediaStream) => !!s && s.getVideoTracks().some((t) => t.readyState === 'live' && !t.muted);

const meshOf = (line: Line, show: (far: Record<string, Far>) => void) => {
  const links = new Map<string, Link>();
  // Two names tracks are sent under, so the other end can tell a screen from a camera.
  const group = { main: new MediaStream(), screen: new MediaStream() };
  let local: Local = { main: [], screen: [], quiet: false }; let ice: RTCIceServer[] = [];
  const publish = () => show(Object.fromEntries([...links].map(([id, l]) => {
    const main = [...l.got.values()].find((s) => s.id !== l.screen && s.getTracks().length) ?? null;
    const screen = l.got.get(l.screen);
    return [id, { main, video: seen(main ?? undefined), screen: seen(screen) ? screen as MediaStream : null, quiet: l.quiet }];
  })));
  const mine = () => ({ state: { quiet: local.quiet, screen: group.screen.id } });
  /** Send exactly the tracks this page has now. */
  const wire = (l: Link) => {
    const want = new Map<MediaStreamTrack, MediaStream>([...local.main.map((t) => [t, group.main] as const), ...local.screen.map((t) => [t, group.screen] as const)]);
    l.sent.forEach((sender, t) => { if (!want.has(t)) { l.pc.removeTrack(sender); l.sent.delete(t); } });
    want.forEach((g, t) => { if (!l.sent.has(t)) l.sent.set(t, l.pc.addTrack(t, g)); });
  };
  const link = (id: string): Link => {
    const had = links.get(id); if (had) return had;
    const pc = new RTCPeerConnection({ iceServers: ice });
    const l: Link = { pc, polite: line.peer < id, making: false, ignore: false, sent: new Map(), todo: Promise.resolve(), got: new Map(), quiet: false, screen: '' };
    links.set(id, l);
    pc.onnegotiationneeded = async () => {
      try { l.making = true; await pc.setLocalDescription(); if (pc.localDescription) line.send(id, { description: pc.localDescription.toJSON() }); }
      catch { /* the connection closed meanwhile */ } finally { l.making = false; }
    };
    pc.onicecandidate = (e) => { if (e.candidate) line.send(id, { candidate: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      e.streams.forEach((s) => { l.got.set(s.id, s); s.onaddtrack = publish; s.onremovetrack = publish; });
      e.track.onmute = publish; e.track.onunmute = publish; e.track.onended = publish; publish();
    };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') pc.restartIce(); };
    line.send(id, mine()); wire(l);
    return l;
  };
  const hear = (from: string, sig: Signal) => {
    if (!line.get().roster.some((c) => c.peer === from)) return;
    const l = link(from);
    l.todo = l.todo.then(async () => {
      if (sig.state) { l.quiet = !!sig.state.quiet; l.screen = String(sig.state.screen); publish(); }
      if (sig.description) {
        const clash = sig.description.type === 'offer' && (l.making || l.pc.signalingState !== 'stable');
        l.ignore = !l.polite && clash; if (l.ignore) return;
        await l.pc.setRemoteDescription(sig.description);
        if (sig.description.type !== 'offer') return;
        await l.pc.setLocalDescription();
        if (l.pc.localDescription) line.send(from, { description: l.pc.localDescription.toJSON() });
      } else if (sig.candidate) await l.pc.addIceCandidate(sig.candidate).catch((e) => { if (!l.ignore) throw e; });
    }).catch(() => undefined);
  };
  const unhear = line.listen(hear);
  return {
    /** Who is in the call and what this page sends changed: connect to who came, let go of who left, send what is on. */
    sync: (state: LineState, now: Local) => {
      const told = now.quiet !== local.quiet; ice = state.ice; local = now;
      const there = state.roster.some((c) => c.peer === line.peer) ? state.roster.filter((c) => c.peer !== line.peer).map((c) => c.peer) : [];
      links.forEach((l, id) => { if (!there.includes(id)) { l.pc.close(); links.delete(id); } });
      there.forEach(link);
      links.forEach((l, id) => { wire(l); if (told) line.send(id, mine()); });
      publish();
    },
    close: () => { unhear(); links.forEach((l) => l.pc.close()); links.clear(); },
  };
};

const tracks = (s: MediaStream | null) => s?.getTracks().filter((t) => t.readyState === 'live') ?? [];

/** Everyone else in the call on `line`, by their page's name, sent this page's microphone, camera and screen. */
export const usePeers = (line: Line | null, state: LineState, mic: MediaStream | null, cam: MediaStream | null, screen: MediaStream | null, quiet: boolean): Record<string, Far> => {
  const [far, setFar] = useState<Record<string, Far>>({});
  const mesh = useRef<ReturnType<typeof meshOf> | null>(null);
  useEffect(() => {
    if (!line) return;
    const m = meshOf(line, setFar); mesh.current = m;
    return () => { m.close(); mesh.current = null; setFar({}); };
  }, [line]);
  useEffect(() => { mesh.current?.sync(state, { main: [...tracks(mic), ...tracks(cam)], screen: tracks(screen), quiet }); }, [line, state, mic, cam, screen, quiet]);
  return far;
};
