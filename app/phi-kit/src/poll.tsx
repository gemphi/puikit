/**
 * A poll in a message: a question, its answers (`limit.json` `poll`: how many, how long the words), one pick or
 * several, and how long it is open. The app's data may hold polls with the votes they have (`count`); the viewer's
 * own picks are kept like every user document and added to them. A poll the viewer makes is posted from the
 * composer, open from that moment for the time chosen; once it is over nobody picks, and the shares stand.
 */
import React from 'react';
import { Button, Checkbox, Input, Popover, Pressable, ProgressBar, Select, Stack, Text } from '@pui/components';
import { BarChart3, Check, Plus, X } from 'lucide-react';
import { persisted } from './api';
import { span } from './time';
import words from './talk.json';
import limit from './limit.json';

const W = words.poll;
const L = limit.poll;
const say = (s: string, k: Record<string, string>) => Object.entries(k).reduce((t, [a, b]) => t.replace('{' + a + '}', b), s);

/** A poll: when it was made and for how many minutes it is open (0, or neither, for as long as its data says). */
export type Poll = { question: string; answer: string[]; count?: number[]; many?: boolean; made?: number; minutes?: number; over?: boolean };
const VOTE = persisted<Record<string, number[]>>('room-vote', {});

const overOf = (p: Poll) => !!p.over || (!!p.made && !!p.minutes && Date.now() > p.made + p.minutes * 60000);

/** A poll as a message shows it: each answer a bar as long as its share, the viewer's picks marked, a press picking. */
export const PollView: React.FC<{ poll: Poll; id: string }> = ({ poll, id }) => {
  const vote = VOTE.use(); const mine = vote[id] ?? []; const over = overOf(poll);
  const count = poll.answer.map((_, i) => (poll.count?.[i] ?? 0) + (mine.includes(i) ? 1 : 0));
  const total = count.reduce((a, b) => a + b, 0);
  const pick = (i: number) => {
    if (over) return;
    const next = poll.many ? (mine.includes(i) ? mine.filter((x) => x !== i) : [...mine, i]) : (mine.includes(i) ? [] : [i]);
    VOTE.set({ ...VOTE.get(), [id]: next });
  };
  const left = poll.made && poll.minutes ? poll.made + poll.minutes * 60000 - Date.now() : 0;
  return (
    <Stack direction="column" gap={2} minWidth="16rem" maxWidth="32rem">
      <Text as="span" size="sm" weight="semibold">{poll.question}</Text>
      <Text as="span" size="xs" intent="muted">{poll.many ? W.picks : W.pick}</Text>
      {poll.answer.map((a, i) => (
        <Pressable key={i} fill pad="sm" hover={!over} aria-pressed={mine.includes(i)} disabled={over} onClick={() => pick(i)}>
          <Stack direction="column" gap={1} width="100%">
            <Stack direction="row" gap={2} align="center" justify="between">
              <Text as="span" size="sm">{mine.includes(i) ? <Check size={13} aria-hidden /> : null} {a}</Text>
              <Text as="span" size="xs" intent="muted" numeric>{total ? Math.round((count[i] / total) * 100) : 0}%</Text>
            </Stack>
            <ProgressBar value={total ? count[i] / total : 0} aria-label={a} />
          </Stack>
        </Pressable>))}
      <Text as="span" size="xs" intent="muted" numeric>
        {[total === 1 ? W.vote : say(W.votes, { n: String(total) }), over ? W.ended : left > 0 ? words.time.left.replace('{when}', span(left / 60000)) : ''].filter(Boolean).join(' · ')}
      </Text>
    </Stack>
  );
};

/** Making a poll, from a button beside the composer: the question, the answers, how long, one pick or several. */
export const PollMaker: React.FC<{ onPost: (poll: Poll) => void }> = ({ onPost }) => {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState<string[]>(['', '']);
  const [minutes, setMinutes] = React.useState(String(L.minutes[3]));
  const [many, setMany] = React.useState(false);
  const [open, setOpen] = React.useState(0);
  const filled = answer.map((a) => a.trim()).filter(Boolean);
  const ready = !!question.trim() && filled.length >= L.least;
  const post = () => { onPost({ question: question.trim(), answer: filled, many, made: Date.now(), minutes: Number(minutes) }); setQuestion(''); setAnswer(['', '']); setMany(false); setOpen(open + 1); };
  return (
    <Popover key={open} portal placement="top-end" trigger={<Button variant="icon" aria-label={W.make} title={W.make}><BarChart3 size={16} /></Button>}>
      <Stack direction="column" gap={2} minWidth="18rem">
        <Text as="span" size="xs" intent="muted">{W.make}</Text>
        <Input value={question} maxLength={L.question} placeholder={W.question} aria-label={W.question} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)} />
        {answer.map((a, i) => (
          <Stack key={i} direction="row" gap={1} align="center">
            <Input value={a} maxLength={L.words} placeholder={say(W.answer, { n: String(i + 1) })} aria-label={say(W.answer, { n: String(i + 1) })}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswer(answer.map((x, j) => (j === i ? e.target.value : x)))} />
            {answer.length > L.least && <Button variant="icon" aria-label={W.remove} title={W.remove} onClick={() => setAnswer(answer.filter((_, j) => j !== i))}><X size={14} /></Button>}
          </Stack>))}
        {answer.length < L.answer && <Button variant="glass" iconLeft={Plus} onClick={() => setAnswer([...answer, ''])}>{W.more}</Button>}
        <Select aria-label={W.lasts} value={minutes} options={L.minutes.map((m) => ({ value: String(m), label: span(m) }))} onChange={(e) => setMinutes(e.target.value)} />
        <Checkbox label={W.many} checked={many} onChange={(e) => setMany(e.target.checked)} />
        <Button variant="glass" disabled={!ready} onClick={post}>{W.post}</Button>
      </Stack>
    </Popover>
  );
};
