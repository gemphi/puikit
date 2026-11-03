import React from 'react';
import { Button, Checkbox, Input, Select, Stack, StepForm, type StepFormStep, TabList, Text, Textarea } from '@pui/components';
import { CheckCircle2 } from 'lucide-react';
import type { Block } from '../data';
import { apiSend, hasApi } from '../api';
import { useMe } from '../auth';
import { AccountPanel } from '../AccountDialog';
import { NavIcon } from '../icons';
import { pullItems, type Pull } from '../pulls';

/**
 * One field of a data-driven form. Controls: text · textarea · select · radio · number · date · link (pick a record
 * of a kind, live from Phiora: `pull`) · consent (a box that must be ticked). `required` blocks Next until filled.
 */
type FieldDef = {
  id: string; label: string; control?: string; options?: string[]; placeholder?: string; hint?: string; full?: boolean;
  required?: boolean; pull?: Pull; min?: number;
};
type StepDef = { id: string; label: string; icon?: string; title?: string; lede?: string; fields?: FieldDef[]; review?: boolean };
type Option = { value: string; label: string; title?: string };

const trim = (s: string, n = 36) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
/** Values handed in the address (`#/back-round?fundingId=…`): a card's "Back this round" opens the form filled in. */
const fromHash = (): Record<string, string> => Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1] ?? ''));
const missing = (f: FieldDef, v: string) => !!f.required && (f.control === 'consent' ? v !== 'yes' : !v.trim());

const Control: React.FC<{ f: FieldDef; value: string; options?: Option[]; onChange: (v: string) => void }> = ({ f, value, options, onChange }) => {
  switch (f.control) {
    case 'textarea': return <Textarea value={value} rows={3} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'select': return <Select value={value} placeholder="Choose" onChange={(e) => onChange(e.target.value)} options={(f.options ?? []).map((o) => ({ value: o, label: o }))} />;
    case 'link': return <Select value={value} placeholder={options ? (options.length ? 'Choose' : 'Nothing to pick yet') : 'Loading'} onChange={(e) => onChange(e.target.value)} options={options ?? []} />;
    case 'radio': return <TabList size="sm" variant="pills" activeId={value} onChange={(id) => onChange(String(id))} items={(f.options ?? []).map((o) => ({ id: o, label: o }))} />;
    case 'number': return <Input type="number" min={f.min} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'date': return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
    case 'consent': return <Checkbox checked={value === 'yes'} label={f.placeholder ?? 'I agree'} onChange={(e) => onChange(e.target.checked ? 'yes' : '')} />;
    default: return <Input value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
};

/**
 * A data-driven form block: the app declares its steps and fields (`{kind:'form', createKind, set, submitLabel, steps}`);
 * this renders them through the shared {@link StepForm}, so every form in every app wears the same rail, icons and
 * field groups. Required fields hold Next; link fields pick records live from Phiora; submit writes one record of
 * `createKind` (plus the fixed props in `set`), owned by the signed-in user, so it shows on their profile. Guests sign
 * in on the review step. Add a form to an app's data, never a form component per app.
 */
export const Form: React.FC<{ b: Block }> = ({ b }) => {
  const defs: StepDef[] = b.steps ?? [];
  const allFields = defs.flatMap((s) => s.fields ?? []);
  const blank = () => ({ ...Object.fromEntries(allFields.map((f) => [f.id, ''])), ...fromHash() });
  const me = useMe();
  const guest = hasApi && (!me || me.guest);
  const [vals, setVals] = React.useState<Record<string, string>>(blank);
  const [at, setAt] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState<{ name: string } | null>(null);
  const [opts, setOpts] = React.useState<Record<string, Option[]>>({});
  const set = (id: string) => (v: string) => setVals((x) => ({ ...x, [id]: v }));

  // Link fields: their choices are records, read live.
  React.useEffect(() => {
    for (const f of allFields) if (f.control === 'link' && f.pull) void pullItems({ n: 50, ...f.pull }).then((items) =>
      setOpts((o) => ({ ...o, [f.id]: items.map((it) => ({ value: it.id ?? it.title, title: it.title, label: it.sub ? it.title + ' · ' + it.sub : it.title })) })));
  }, [b]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelOf = (f: FieldDef, v: string) => (f.control === 'link' ? opts[f.id]?.find((o) => o.value === v)?.label ?? v : f.control === 'consent' ? (v === 'yes' ? 'Yes' : '') : v);
  const submit = async () => {
    if (guest) { setError('Sign in first, then submit.'); return; }
    setBusy(true); setError('');
    const fields: Record<string, unknown> = { ...(b.set ?? {}) };
    for (const f of allFields) { const v = vals[f.id]?.trim(); if (!v) continue; fields[f.id] = f.control === 'number' ? Number(v) : f.control === 'consent' ? true : v; }
    const from = b.nameFrom ? allFields.find((f) => f.id === b.nameFrom) : undefined;
    const name = String(fields.name || fields.title || (from && (opts[from.id]?.find((o) => o.value === vals[from.id])?.title ?? vals[from.id])) || b.heading || 'Untitled');
    fields.name = fields.name ?? (b.namePrefix ? b.namePrefix + ' · ' + name : name);
    fields.submittedAt = new Date().toISOString();
    if (hasApi && b.createKind) {
      const r = await apiSend<{ item: { id: string } }>('POST', '/tree/item', { kind: b.createKind, fields });
      setBusy(false);
      if (!r.ok) { setError(r.message || 'That did not go through. Try again.'); return; }
    } else setBusy(false);
    setDone({ name: String(fields.name) });
  };

  if (done) {
    return (
      <Stack direction="column" gap={3} surface="card" align="start">
        <Stack direction="row" gap={2} align="center"><NavIcon name="check" size={20} /><Text font="heading" size="lg">{b.doneTitle ?? 'Submitted'}</Text></Stack>
        <Text intent="secondary">{b.done ?? 'Received. It is on your profile and under review.'}</Text>
        <Text size="sm" weight="medium">{done.name}</Text>
        <Stack direction="row" gap={2} wrap>
          <Button variant="primary" href="#/_you">See it on your profile</Button>
          <Button variant="outline" onClick={() => { setVals(blank()); setAt(0); setDone(null); }}>{b.againLabel ?? 'Submit another'}</Button>
        </Stack>
      </Stack>
    );
  }

  const steps: StepFormStep[] = defs.map((s) => {
    const icon = s.icon ? <NavIcon name={s.icon} size={16} /> : undefined;
    if (s.review) {
      return {
        id: s.id, label: s.label, icon: icon ?? <CheckCircle2 size={16} />, title: s.title ?? s.label, lede: s.lede,
        valid: !guest,
        content: (
          <Stack direction="column" gap={3}>
            <Stack direction="column" gap={2} surface="card">
              {allFields.map((f) => (
                <Stack key={f.id} direction="row" justify="between" gap={3}>
                  <Text size="sm" intent="muted">{f.label}</Text>
                  <Text size="sm" truncate>{labelOf(f, vals[f.id] ?? '').trim() || '·'}</Text>
                </Stack>
              ))}
            </Stack>
            {guest ? (
              <Stack direction="column" gap={2} surface="card">
                <Text weight="medium">Sign in to submit</Text>
                <Text size="sm" intent="secondary">What you submit is kept on your profile, under your Phione identity.</Text>
                <AccountPanel />
              </Stack>
            ) : null}
            {error ? <Text size="sm" intent="danger">{error}</Text> : null}
          </Stack>
        ),
      };
    }
    const fields = s.fields ?? [];
    const chosen = fields.map((f) => labelOf(f, vals[f.id] ?? '').trim()).filter(Boolean).join(' · ');
    return {
      id: s.id, label: s.label, icon, title: s.title ?? s.label, lede: s.lede, hint: chosen ? trim(chosen) : undefined,
      valid: !fields.some((f) => missing(f, vals[f.id] ?? '')),
      fields: fields.map((f) => ({
        id: f.id, label: f.required ? f.label + ' *' : f.label, hint: f.hint, full: f.full ?? (f.control === 'textarea' || f.control === 'consent'),
        control: <Control f={f} value={vals[f.id] ?? ''} options={opts[f.id]} onChange={set(f.id)} />,
      })),
    };
  });

  return (
    <StepForm steps={steps} activeIndex={at} onStepChange={setAt} onSubmit={submit}
      submitLabel={b.submitLabel ?? 'Submit'} busy={busy} title={b.heading ?? b.title} sub={b.sub} fill={false} />
  );
};
