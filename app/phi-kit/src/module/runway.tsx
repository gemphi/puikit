import { Box, Button, Frame, Image, Stack, Text, Title } from '@pui/components';
import React from 'react';
import { assetUrl, type Block } from '../data';

type Swatch = { name: string; hex: string };
type Item = { name: string; about?: string };
type Look = { id: string; number: number; title: string; color: Swatch; cut: string; about?: string; items?: Item[]; views: { label: string; image: string }[] };

const wrap: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' };
const dot = (hex: string, on: boolean): React.CSSProperties => ({ width: 28, height: 28, padding: 0, borderRadius: '50%', background: hex, cursor: 'pointer', border: 0, outline: on ? '1px solid currentColor' : 'none', outlineOffset: 3 });
const plain: React.CSSProperties = { display: 'block', width: '100%', padding: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' };

/** One look: its angles, what she wears, and the colours the same cut comes in. */
const LookPage: React.FC<{ look: Look; looks: Look[]; onLook: (id: string | null) => void }> = ({ look, looks, onLook }) => {
  const [angle, setAngle] = React.useState(0);
  React.useEffect(() => setAngle(0), [look.id]);
  const shown = look.views[angle] ?? look.views[0];
  const sameCut = looks.filter((l) => l.cut === look.cut);
  return (
    <Stack as="article" direction="column" gap={4}>
      <Button variant="ghost" onClick={() => onLook(null)} style={{ alignSelf: 'flex-start' }}>All looks</Button>
      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        <Stack direction="column" gap={3}>
          {shown ? <Frame ratio="1/1" rounded="none"><Image src={assetUrl(shown.image)} alt={look.title + ', ' + shown.label} fit="cover" fill /></Frame> : null}
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {look.views.map((v, i) => (
              <button key={v.label} type="button" onClick={() => setAngle(i)} aria-label={v.label} aria-pressed={i === angle} style={{ ...plain, opacity: i === angle ? 1 : 0.6 }}>
                <Frame ratio="1/1" rounded="none"><Image src={assetUrl(v.image)} alt="" fit="cover" fill loading="lazy" /></Frame>
                <Text as="span" size="xs" intent="secondary">{v.label}</Text>
              </button>
            ))}
          </Box>
        </Stack>
        <Stack direction="column" gap={4}>
          <Box>
            <Text as="p" size="sm" intent="secondary">Look {look.number}</Text>
            <Title level={1} size="2xl" lineHeight={1.1}>{look.title}</Title>
            {look.about ? <Text intent="secondary" marginTop={2} maxWidth="48ch">{look.about}</Text> : null}
          </Box>
          <Box>
            <Text as="p" size="sm">{look.color.name}</Text>
            <Box style={{ ...wrap, marginTop: '0.5rem' }}>
              {sameCut.map((l) => <button key={l.id} type="button" title={l.color.name} aria-label={l.color.name} aria-pressed={l.id === look.id} onClick={() => onLook(l.id)} style={dot(l.color.hex, l.id === look.id)} />)}
            </Box>
          </Box>
          {look.items?.length ? (
            <Stack direction="column" gap={2}>
              {look.items.map((it) => (
                <Box key={it.name} style={{ borderTop: '1px solid var(--phi-border, currentColor)', paddingTop: '0.75rem' }}>
                  <Text as="p">{it.name}</Text>
                  {it.about ? <Text as="p" size="sm" intent="secondary">{it.about}</Text> : null}
                </Box>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
};

/**
 * A fashion show as a page: the show itself across the top, then every look, each opening on its angles, its
 * pieces and its colours. Config: { "kind": "runway", "title", "sub", "hero": "show/line.jpg", "wide": [images],
 * "looks": [...] }. spark/make_site.py writes this from the finished renders.
 */
export const Runway: React.FC<{ b: Block }> = ({ b }) => {
  const looks = (b.looks ?? []) as Look[];
  const read = () => window.location.hash.match(/[?&]look=([\w-]+)/)?.[1] ?? null;
  const [lookId, setLookId] = React.useState(read);
  React.useEffect(() => { const f = () => setLookId(read()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const choose = (id: string | null) => {
    const page = window.location.hash.split('?')[0] || '#/';
    window.location.hash = id ? page + '?look=' + id : page;
    window.scrollTo({ top: 0 });
  };
  const look = looks.find((l) => l.id === lookId);
  const mark = b.wordmark ? <Text as="p" align="center" size="2xl" style={{ fontFamily: b.wordmarkFont, cursor: 'pointer', marginBottom: '1.5rem' }} onClick={() => choose(null)}>{b.wordmark}</Text> : null;
  if (look) return <>{mark}<LookPage look={look} looks={looks} onLook={choose} /></>;
  return (
    <Stack direction="column" gap={5}>
      {mark}
      {b.hero ? (
        <Box as="header">
          <Frame ratio="1/1" style={{ maxHeight: '86vh', width: '100%' }} rounded="none"><Image src={assetUrl(b.hero)} alt={b.heroAlt ?? ''} fit="cover" fill style={{ objectPosition: '50% 70%' }} /></Frame>
          {b.sub ? <Text as="p" intent="secondary" marginTop={2} maxWidth="60ch">{b.sub}</Text> : null}
        </Box>
      ) : null}
      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 15rem), 1fr))', gap: '2rem 1rem' }}>
        {looks.map((l) => (
          <button key={l.id} type="button" onClick={() => choose(l.id)} style={plain}>
            {l.views[0] ? <Frame ratio="3/4" rounded="none"><Image src={assetUrl(l.views[0].image)} alt={l.title} fit="cover" fill loading="lazy" /></Frame> : null}
            <Text as="p" size="sm" intent="secondary" marginTop={1}>Look {l.number}</Text>
            <Text as="p">{l.title}</Text>
          </button>
        ))}
      </Box>
      {(b.wide as string[] | undefined)?.map((src) => <Frame key={src} ratio="1/1" rounded="none" style={{ maxHeight: '86vh', width: '100%' }}><Image src={assetUrl(src)} alt="" fit="cover" fill loading="lazy" /></Frame>)}
    </Stack>
  );
};
