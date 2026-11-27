/**
 * Who is writing in a room now, as its line says (`call.ts`, Phiora's `typing`), and this page saying that it is: a
 * word typed tells the others, again every few seconds while the typing goes on, and a pause or a sent message says it
 * stopped (`limit.json` `typing`). One who has said nothing for a while is no longer writing. With no line nobody is.
 */
import { useEffect, useRef, useState } from 'react';
import { useLine } from './call';
import words from './talk.json';
import limit from './limit.json';

const W = words.typing;
const L = limit.typing;

export const useTyping = (store: string) => {
  const { line, state } = useLine(store);
  const [now, setNow] = useState(() => Date.now());
  const said = useRef(0); const quiet = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fresh = state.typing.filter((t) => t.peer !== line?.peer && now - t.since < L.seconds * 1000);
  // While somebody writes, the clock moves, so one who went quiet goes from the line.
  useEffect(() => { if (!state.typing.length) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [state.typing.length]);
  useEffect(() => () => { clearTimeout(quiet.current); }, []);
  const stop = () => { clearTimeout(quiet.current); if (said.current) line?.type(false); said.current = 0; };
  const poke = (draft: string) => {
    if (!line) return;
    if (!draft.trim()) return stop();
    if (Date.now() - said.current > L.every * 1000) { line.type(true); said.current = Date.now(); }
    clearTimeout(quiet.current); quiet.current = setTimeout(stop, L.seconds * 1000);
  };
  const names = [...new Set(fresh.map((t) => t.name))];
  const writing = names.length === 0 ? '' : names.length === 1 ? W.one.replace('{name}', names[0]) : names.length === 2 ? W.two.replace('{a}', names[0]).replace('{b}', names[1]) : W.many;
  return { said: writing, poke, stop };
};
