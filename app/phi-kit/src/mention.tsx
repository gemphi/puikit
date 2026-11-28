/**
 * Mentions: `@handle` names someone in a message, `@everyone` and `@here` the whole room (`words.mention`). A message
 * is read into its words and its mentions, and a mention is lit where it is drawn, the viewer's own most of all. The
 * composer offers the room's people while a word begins with `@` (`suggestOf`), as many as `limit.json` `mention`.
 */
import React from 'react';
import { Text } from '@pui/components';
import { Face, type Member, type People } from './people';
import words from './talk.json';
import limit from './limit.json';

const W = words.mention;
/** A piece of a message: words, or a mention of someone or of the room. */
type Part = { text: string; who?: Member; all?: 'everyone' | 'here' };
const TOKEN = /(@[\w.-]+)/g;

/** A message's words and mentions, in order. */
export const partsOf = (text: string, file: People): Part[] => text.split(TOKEN).filter(Boolean).map((t) => {
  if (!t.startsWith('@')) return { text: t };
  const name = t.slice(1).toLowerCase();
  if (name === W.everyone || name === W.here) return { text: t, all: name === W.everyone ? 'everyone' : 'here' };
  const who = file.member.find((m) => (m.handle ?? m.id).toLowerCase() === name);
  return who ? { text: t, who } : { text: t };
});

/** Whether a message names the viewer, or the whole room. */
export const mentions = (text: string | undefined, file: People): { me: boolean; all: boolean } => {
  const parts = partsOf(text ?? '', file);
  return { me: parts.some((p) => p.who?.id === file.me), all: parts.some((p) => !!p.all) };
};

/** A message's words with its mentions lit; a press on one who is named opens them. */
export const Said: React.FC<{ text: string; file: People; onWho?: (id: string) => void }> = ({ text, file, onWho }) => (
  <Text as="span" size="sm">
    {partsOf(text, file).map((p, i) => (p.who || p.all
      ? <Text key={i} as="span" size="sm" weight="semibold" intent={p.who?.id === file.me || p.all ? 'primary' : 'secondary'}
          role={p.who ? 'button' : undefined} onClick={p.who ? () => onWho?.((p.who as Member).id) : undefined}>{p.text}</Text>
      : <React.Fragment key={i}>{p.text}</React.Fragment>))}
  </Text>
);

/** What the composer offers for a word that begins with `@`: the room's people whose handle or name begins so, then
 *  the whole room. */
export const suggestOf = (file: People, people: Member[]) => (word: string) => {
  if (!word.startsWith('@')) return [];
  const sought = word.slice(1).toLowerCase();
  const fits = (s?: string) => !!s && s.toLowerCase().startsWith(sought);
  const who = people.filter((m) => m.id !== file.me && (fits(m.handle) || fits(m.name))).slice(0, limit.mention.most)
    .map((m) => ({ key: m.id, label: m.name, sub: '@' + (m.handle ?? m.id), insert: '@' + (m.handle ?? m.id), lead: <Face file={file} m={m} size="xs" /> }));
  const room = [[W.everyone, W.everyoneSub], [W.here, W.hereSub]].filter(([w]) => fits(w)).map(([w, sub]) => ({ key: w, label: '@' + w, sub, insert: '@' + w }));
  return [...who, ...room];
};
