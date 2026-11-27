/**
 * The viewer's status, kept like every user document: how they show (here, away, do not disturb, or unseen, which
 * shows them as off), and words of their own, cleared after a while or never (`limit.json` `status`). Wherever the
 * people of an app are drawn the viewer is drawn so (`useStatus`), the dot and the line under their name.
 */
import React from 'react';
import { Avatar, Button, Input, Modal, Pressable, Select, Stack, Text } from '@pui/components';
import { persisted } from './api';
import type { People, Presence } from './people';
import { span } from './time';
import words from './talk.json';
import limit from './limit.json';

const W = words.status;
const L = limit.status;
type Shown = 'here' | 'away' | 'busy' | 'unseen';
const SHOWN: Shown[] = ['here', 'away', 'busy', 'unseen'];
/** As the kit's dot draws each: unseen is drawn as off. */
const DOT: Record<Shown, Presence> = { here: 'here', away: 'away', busy: 'busy', unseen: 'off' };
type Status = { shown?: Shown; words?: string; until?: number };
const KEPT = persisted<Status>('me-status', {});

const live = (s: Status) => !!s.words && (!s.until || s.until > Date.now());

/** The people of an app with the viewer as their status says. */
export const useStatus = <T extends People>(file: T | null): T | null => {
  const s = KEPT.use();
  return React.useMemo(() => {
    if (!file || (!s.shown && !live(s))) return file;
    const member = file.member.map((m) => (m.id !== file.me ? m : {
      ...m, presence: s.shown ? DOT[s.shown] : m.presence,
      state: live(s) ? s.words : s.shown ? W[(s.shown + 'Sub') as 'hereSub'] : m.state,
    }));
    return { ...file, member };
  }, [file, s]);
};

/** Setting the status: how to show, the words, when they clear. */
export const StatusDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const s = KEPT.use();
  const [said, setSaid] = React.useState(s.words ?? '');
  const [clear, setClear] = React.useState(String(L.minutes[L.minutes.length - 1]));
  React.useEffect(() => { if (open) setSaid(live(s) ? s.words ?? '' : ''); }, [open]);
  const save = () => { const m = Number(clear); KEPT.set({ ...KEPT.get(), words: said.trim() || undefined, until: said.trim() && m ? Date.now() + m * 60000 : undefined }); onClose(); };
  return (
    <Modal isOpen={open} onClose={onClose} title={W.edit} size="sm">
      <Stack direction="column" gap={3}>
        <Text size="sm" weight="medium">{W.presence}</Text>
        <Stack direction="column" gap={1}>
          {SHOWN.map((v) => (
            <Pressable key={v} row gap={2} fill hover pad="sm" aria-pressed={(s.shown ?? 'here') === v} onClick={() => KEPT.set({ ...KEPT.get(), shown: v })}>
              <Avatar size="xs" alt="" deck={0} initials=" " presence={DOT[v]} />
              <Stack direction="column" gap={0}>
                <Text as="span" size="sm" weight={(s.shown ?? 'here') === v ? 'semibold' : 'normal'}>{W[v]}</Text>
                <Text as="span" size="xs" intent="muted">{W[(v + 'Sub') as 'hereSub']}</Text>
              </Stack>
            </Pressable>))}
        </Stack>
        <Input value={said} maxLength={L.words} placeholder={W.words} aria-label={W.words} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaid(e.target.value)} />
        <Select aria-label={W.clear} value={clear} options={L.minutes.map((m) => ({ value: String(m), label: m ? span(m) : W.never }))} onChange={(e) => setClear(e.target.value)} />
        <Stack direction="row" gap={2} justify="end">
          {live(s) && <Button variant="glass" onClick={() => { KEPT.set({ ...KEPT.get(), words: undefined, until: undefined }); onClose(); }}>{W.remove}</Button>}
          <Button variant="glass" onClick={save}>{W.save}</Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
