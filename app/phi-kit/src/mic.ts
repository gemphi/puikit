/** The viewer's microphone, as a call or a voice room holds it: asked for when wanted, let go when not. */
import { useEffect, useState } from 'react';

const stop = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop());

/** The microphone while `on`: the browser asks the person once. `fault` says it was refused or there is none. */
export const useMic = (on: boolean): { mic: MediaStream | null; fault: boolean } => {
  const [mic, setMic] = useState<MediaStream | null>(null);
  const [fault, setFault] = useState(false);
  useEffect(() => {
    if (!on) return;
    const media = navigator.mediaDevices;
    if (!media) { setFault(true); return () => setFault(false); }
    // The answer may come after the room was left: a microphone nobody waits for is let go at once.
    let gone = false; let got: MediaStream | null = null;
    media.getUserMedia({ audio: true }).then((s) => { if (gone) { stop(s); return; } got = s; setMic(s); }, () => { if (!gone) setFault(true); });
    return () => { gone = true; stop(got); setMic(null); setFault(false); };
  }, [on]);
  return { mic, fault };
};

/** How loud a microphone is, from 0 to 1, a few times a second, so the person can see it hears them. */
export const useLevel = (mic: MediaStream | null): number => {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!mic) return;
    const ctx = new AudioContext(); const ear = ctx.createAnalyser(); ear.fftSize = 256;
    ctx.createMediaStreamSource(mic).connect(ear);
    const data = new Uint8Array(ear.frequencyBinCount);
    const tick = window.setInterval(() => { ear.getByteTimeDomainData(data); setLevel(Math.min(1, Math.max(...data.map((v) => Math.abs(v - 128))) / 64)); }, 150);
    return () => { window.clearInterval(tick); void ctx.close(); setLevel(0); };
  }, [mic]);
  return level;
};
