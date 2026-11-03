import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, ChatBubble, Col, DataTable, Grid, ItemCard, Page, Select, Stack, TabList, Tag, Text, Textarea, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { D, eggsOfHost, fmt, hostOf, lookOf, person, poolOf, profileItemOf, profileItemOfHolder, seriesOf, storeOfClub, sumOf, t, usd } from '../../lib/data';
import { useOwned } from '../../lib/cart';
import { useCredits } from '../../lib/productions';
import { SC, fill, removeFlow, saveFlow, useFlows, type Scenario, type Step } from '../../lib/flows';
import { phieggStore } from '../../state/phieggStore';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { ListView } from '../../components/Phiegg/Views';
import type { ID } from '../../types/phiegg';

type Opt = { value: string; label: string };

/**
 * Studio: create value from what you hold. A scenario (runway night, pop-up, watch party, resale loop, fan club,
 * profile drop) asks for items by type, PFT, EGG, SUM, a host, a title, a customer agent, and the persona you greet
 * people with. You link your own items, edit the greeting, see the projected value and save the flow to run later.
 */
export const StudioPage: React.FC = () => {
  const s = useStore(phieggStore); const owned = useOwned(); const flows = useFlows();
  const me = D.core.currentUserId; const u = D.core.users.find((x) => x.id === me); const credits = useCredits(me);
  const [sid, setSid] = useState<string>(SC.scenarios[0].id); const sc = SC.scenarios.find((x) => x.id === sid) as Scenario;
  const [picks, setPicks] = useState<Record<string, ID>>({}); const [voice, setVoice] = useState(SC.voices[0]); const [audience, setAudience] = useState(SC.audiences[0]);
  const [greeting, setGreeting] = useState(sc.greeting[voice]); const [msg, setMsg] = useState('');
  useEffect(() => { setGreeting(sc.greeting[voice] ?? sc.greeting.Warm); }, [sid, voice]);

  // What you can link, by step type: yours first, the rest of the platform after.
  const myHosts = D.hosts.hosts.filter((h) => h.ownerId === me || (u?.hostIds ?? []).includes(h.id));
  const hostsAll = [...myHosts, ...D.hosts.hosts.filter((h) => !myHosts.includes(h))].slice(0, 64);
  const myLooks = Object.keys(owned).map(lookOf).filter((l): l is NonNullable<typeof l> => !!l);
  const clubLooks = (u?.clubIds ?? []).flatMap((c) => storeOfClub(c)?.looks ?? []);
  const looksAll = [...myLooks, ...clubLooks, ...D.ls.looks].filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i).slice(0, 64);
  const optionsFor = (st: Step): Opt[] => {
    switch (st.type) {
      case 'host': return hostsAll.map((h) => ({ value: h.id, label: h.name + (myHosts.includes(h) ? ' · yours' : '') }));
      case 'egg': { const host = picks.host ?? myHosts[0]?.id; const pool = host ? eggsOfHost(host) : [];
        return [...pool, ...D.assets.eggs.filter((e) => !pool.includes(e))].filter((e) => !st.kind || e.kind === st.kind).slice(0, 64).map((e) => ({ value: e.id, label: `${e.name} · ${fmt(e.priceEgg)} EGG` })); }
      case 'pft': return looksAll.map((l) => ({ value: l.id, label: `${l.name} · ${usd(l.usd)}` + (owned[l.id] ? ' · yours' : '') }));
      case 'profile': { const mine = profileItemOfHolder(me); return [...(mine ? [mine] : []), ...D.assets.profiles.filter((p) => p !== mine).slice(0, 63)].map((p) => ({ value: p.id, label: p.name + (p === mine ? ' · yours' : '') })); }
      case 'sum': { const clubs = new Set(u?.clubIds ?? []); return [...D.assets.sums.filter((x) => clubs.has(x.clubId)), ...D.assets.sums.filter((x) => !clubs.has(x.clubId))].slice(0, 64).map((x) => ({ value: x.id, label: `${x.name} · ${x.apy}% APY` })); }
      case 'title': { const mine = new Set((credits ?? []).map(([id]) => id)); return [...D.series.series.filter((x) => mine.has(x.id)), ...D.series.series.filter((x) => !mine.has(x.id))].slice(0, 64).map((x) => ({ value: x.id, label: x.title + (mine.has(x.id) ? ' · cast' : '') })); }
      case 'agent': return D.agents.agents.map((a) => ({ value: a.id, label: `${a.name} · ${a.role}` }));
    }
  };
  const pickOf = (st: Step) => picks[st.id] ?? optionsFor(st)[0]?.value;
  const nameOf = (st: Step, id?: ID) => !id ? '' : st.type === 'host' ? hostOf(id)?.name ?? '' : st.type === 'egg' ? D.assets.eggs.find((e) => e.id === id)?.name ?? '' : st.type === 'pft' ? lookOf(id)?.name ?? ''
    : st.type === 'profile' ? profileItemOf(id)?.name ?? '' : st.type === 'sum' ? sumOf(id)?.name ?? '' : st.type === 'title' ? seriesOf(id)?.title ?? '' : person(id).name;
  const chosen = Object.fromEntries(sc.steps.map((st) => [st.id, pickOf(st)])) as Record<string, ID>;
  const agentStep = sc.steps.find((x) => x.type === 'agent'); const agentId = (agentStep && chosen[agentStep.id]) || D.agents.agents[0].id;
  const names: Record<string, string> = { name: audience === 'VIPs' ? 'dear guest' : 'friend', ...Object.fromEntries(sc.steps.map((st) => [st.id === 'gate' || st.id === 'share' ? st.id : st.type === 'pft' ? 'look' : st.type === 'profile' ? 'pfp' : st.type, nameOf(st, chosen[st.id])])) };
  const gateEgg = D.assets.eggs.find((e) => e.id === chosen.gate)?.priceEgg ?? 0; names.gate = gateEgg ? fmt(gateEgg) + ' EGG' : 'free';

  // Projected value of one night (and the SUM over a year), from the scenario's model and the linked items.
  const value = useMemo(() => {
    const v = sc.model.visitors; const rate = D.assets.eggUsd;
    const gate = v * sc.model.gateConversion * gateEgg * rate;
    const lookStep = sc.steps.find((x) => x.type === 'pft'); const look = lookStep ? lookOf(chosen[lookStep.id]) : undefined;
    const looks = v * sc.model.lookConversion * (look?.usd ?? 0) * 0.05; // your 5% creator / host cut of look sales
    const sum = sumOf(chosen.sum); const yearly = sum ? gate * 0.6 * 52 * (sum.apy / 100) : 0;
    return { visitors: v, gate, looks, yearly, total: gate + looks };
  }, [sid, JSON.stringify(chosen)]);

  const save = () => { saveFlow({ scenarioId: sc.id, picks: chosen, voice, audience, greeting, agentId }); setMsg(t('stSaved')); };
  const held = [myHosts.length ? `${myHosts.length} hosts` : '', myLooks.length ? `${myLooks.length} looks` : ''].filter(Boolean);
  const specs = [...(held.length ? held : [t('stStarter')]), profileItemOfHolder(me)?.name, ...(u?.badges ?? [])].filter(Boolean) as string[];

  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1}><Title level={2} size="xl">{t('stTitle')}</Title><Text intent="secondary">{t('stSub')}</Text></Stack>
      <Grid gap={4} xs={1} lg={12}>
        <Col span={4} xs={12} lg={4}><Stack direction="column" gap={2}>
          <Title level={4} size="md">{t('stTemplates')}</Title>
          {SC.scenarios.map((x) => (
            <ItemCard key={x.id} depth={x.id === sid ? 2 : 0} variant="flat" selected={x.id === sid} onClick={() => { setSid(x.id); setPicks({}); setMsg(''); }}
              title={x.title} meta={x.steps.map((st) => st.type.toUpperCase()).join(' · ')}>{x.summary}</ItemCard>))}
        </Stack></Col>
        <Col span={8} xs={12} lg={8}><Stack direction="column" gap={3}>
          <Card depth={2}><CardBody><Stack direction="column" gap={3}>
            <Stack direction="column" gap={1}><Title level={3} size="lg">{sc.title}</Title><Text size="sm" intent="muted">{sc.summary}</Text></Stack>
            <Text size="xs" weight="bold" intent="muted">{t('stSpecs')}</Text>
            <Stack direction="row" gap={1} wrap>{specs.map((x) => <Tag key={x} minimal round size="sm">{x}</Tag>)}</Stack>
            {sc.steps.map((st, i) => (
              <ItemCard key={st.id} variant="flat" padding="sm" stackBelow="lg" media={<Tag round size="sm" intent="primary">{i + 1}</Tag>} title={st.label} meta={`${st.type.toUpperCase()}${st.kind ? ' · ' + st.kind : ''} · ${st.hint}`}
                actions={<Select size="sm" value={pickOf(st)} aria-label={st.label} onChange={(e) => setPicks({ ...picks, [st.id]: e.target.value })} options={optionsFor(st)} />} />))}
            <Text size="xs" weight="bold" intent="muted">{t('stPersona')}</Text>
            <TabList size="sm" variant="pills" aria-label={t('stVoice')} activeId={voice} onChange={setVoice} items={SC.voices.map((v) => ({ id: v, label: v }))} />
            <Stack direction="row" gap={2} align="center"><Text size="sm">{t('stAudience')}</Text><Select size="sm" value={audience} aria-label={t('stAudience')} onChange={(e) => setAudience(e.target.value)} options={SC.audiences.map((a) => ({ value: a, label: a }))} /></Stack>
            <Textarea value={greeting} aria-label={t('stEdit')} onChange={(e) => setGreeting(e.target.value)} rows={3} />
            <Text size="xs" weight="bold" intent="muted">{t('stPreview')}</Text>
            <ChatBubble avatar={<PersonAvatar id={agentId} size="sm" />} name={person(agentId).name}>{fill(greeting, names)}</ChatBubble>
            <Text size="xs" weight="bold" intent="muted">{t('stValue')}</Text>
            <DataTable rows={[{ id: 'v', k: t('stVisitors'), v: fmt(value.visitors), n: value.visitors }, { id: 'g', k: t('stGate'), v: usd(value.gate), n: value.gate }, { id: 'l', k: t('stLooks'), v: usd(value.looks), n: value.looks },
              { id: 't', k: t('stTotal'), v: usd(value.total), n: value.total }, { id: 's', k: t('stSum'), v: usd(value.yearly), n: value.yearly }]} getKey={(r) => r.id}
              columns={[{ id: 'k', header: t('isField'), cell: (r) => r.k }, { id: 'v', header: t('isValue'), cell: (r) => <Text as="span" size="sm" weight="bold" numeric>{r.v}</Text>, align: 'right', sortValue: (r) => r.n }]} />
            <Stack direction="row" gap={2} align="center" wrap>
              <Button variant="primary" onClick={save}>{t('stSave')}</Button>
              <Button variant="outline" onClick={() => s.openChat(agentId, fill(greeting, names))}>{t('stRun')}</Button>
              {chosen.sum && sumOf(chosen.sum) && <Button variant="ghost" onClick={() => s.openAsset(chosen.sum)}>{sumOf(chosen.sum)!.name}</Button>}
              {chosen.gate && <Button variant="ghost" onClick={() => s.openAsset(chosen.gate)}>{nameOf({ id: 'gate', type: 'egg', label: '', hint: '' }, chosen.gate)}</Button>}
              {msg && <Text size="sm" role="status">{msg}</Text>}
            </Stack>
          </Stack></CardBody></Card>
          <Title level={4} size="md">{t('stFlows')}</Title>
          <ListView rows={flows} keyOf={(f) => f.id} text={(f) => f.greeting} empty={t('stNoFlows')} cols={2}
            facets={[{ id: 'sc', label: t('stTemplates'), get: (f) => SC.scenarios.find((x) => x.id === f.scenarioId)?.title }, { id: 'voice', label: t('stVoice'), get: (f) => f.voice }]}
            sorts={[{ id: 'new', label: t('lsSortRecent'), by: (a, b) => b.at - a.at }]}
            table={[{ id: 'sc', header: t('stTemplates'), cell: (f) => SC.scenarios.find((x) => x.id === f.scenarioId)?.title ?? f.scenarioId }, { id: 'v', header: t('stVoice'), cell: (f) => f.voice }, { id: 'a', header: t('stAgent'), cell: (f) => person(f.agentId).name }, { id: 'at', header: t('isWhen'), cell: (f) => new Date(f.at).toLocaleString(), sortValue: (f) => f.at }]}
            render={(f) => <ItemCard depth={1} media={<PersonAvatar id={f.agentId} size="md" />} title={SC.scenarios.find((x) => x.id === f.scenarioId)?.title ?? f.scenarioId} meta={`${f.voice} · ${f.audience} · ${person(f.agentId).name}`}
              actions={<><Button size="sm" variant="primary" onClick={() => s.openChat(f.agentId, f.greeting)}>{t('stRun')}</Button><Button size="sm" variant="ghost" onClick={() => removeFlow(f.id)}>{t('stDelete')}</Button></>}>{f.greeting}</ItemCard>} />
        </Stack></Col>
      </Grid>
    </Stack></Page>
  );
};
