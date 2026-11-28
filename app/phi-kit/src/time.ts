/** A span of minutes in words, the largest whole step that fits it: minutes, hours, days, weeks (`words.time`). */
import words from './talk.json';

const W = words.time;
const n = (s: string, v: number) => s.replace('{n}', String(v));

export const span = (minutes: number): string => {
  const step: [number, string, string][] = [[10080, W.week, W.weeks], [1440, W.day, W.days], [60, W.hour, W.hours]];
  const fit = step.find(([size]) => minutes >= size && minutes % size === 0) ?? step.find(([size]) => minutes >= size);
  if (!fit) return n(W.minutes, Math.max(1, Math.round(minutes)));
  const v = Math.round(minutes / fit[0]);
  return v === 1 ? fit[1] : n(fit[2], v);
};

/** A moment as the clock reads it: today's hour, else the day and the hour. */
export const clock = (at: number): string => {
  const d = new Date(at); const today = d.toDateString() === new Date().toDateString();
  return today ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
};
