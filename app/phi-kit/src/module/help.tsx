import React from 'react';
import { Box, Button, Frame, Input, Label, Picture, Pressable, Stack, Tag, Text, Title } from '@pui/components';
import { usePuiTheme } from '@pui/providers';
import { Search } from 'lucide-react';
import { assetUrl, type Block } from '../data';
import { go, onAddress, readAddress } from '../address';
import { Drawing, Robot } from '../drawing';
import { Loading } from '../loading';

/** A part of an article after its steps: a heading over paragraphs, a list, or both (what it does, good to know,
 *  when it does not work). */
type Part = { head: string; text?: string[]; list?: string[] };
/** An article: its lead, its steps, its parts, the place of the app it is about, whether only the desk's app has it,
 *  and its picture: a capture of the app at that place, dark and light. */
type Article = { id: string; title: string; lead: string; step: string[]; part?: Part[]; where?: string; desk?: boolean; shot?: { dark: string; light: string } };
/** Every word of an article, for the search. */
const wordsOf = (a: Article) => [a.title, a.lead, ...a.step, ...(a.part ?? []).flatMap((p) => [p.head, ...(p.text ?? []), ...(p.list ?? [])])];
type Section = { id: string; label: string; icon: string; lead: string; article: Article[] };
/** A category of the home: the sections under one heading, by their ids. */
type Category = { id: string; label: string; lead: string; section: string[] };
/** A help file (`source`): its words, the robot's pictures for each kind of page, its categories and sections. */
type HelpFile = {
  title: string; lead: string; find: string; unfound: string; articles: string; open: string; desk: string; back: string; steps: string; related: string;
  /** How many articles a section has, in words, by number: figures at a card's small size can read as others. */
  count?: string[];
  robot: Record<'home' | 'section' | 'article' | 'unfound' | 'empty' | 'done', string>; category: Category[]; section: Section[];
};

const say = (s: string, k: string, v: string) => s.replace('{' + k + '}', v);
const files = new Map<string, Promise<HelpFile>>();

/** The help page's place: `<page>/<section>/<article>`. */
const useWhere = () => {
  const read = () => { const { seg0, seg1 } = readAddress(); return [seg0, ...seg1.split('/').filter(Boolean)]; };
  const [at, setAt] = React.useState(read);
  React.useEffect(() => onAddress(() => setAt(read())), []);
  return at;
};

/** One of the house's icons with its words, in the kit's chip of label light that fades towards them (`Label`), as
 *  every icon stands. */
const Ink: React.FC<{ src: string; size?: string; children: React.ReactNode }> = ({ src, size = '1.1rem', children }) => (
  <Label wrap icon={<Drawing src={src} width={size} />}>{children}</Label>
);

/** A group of things on the kit's surface: a region, whose gradient runs against the one that holds it. */
const Region: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <Box surface="region" style={style}>{children}</Box>
);

/**
 * A help centre, the same in every app, laid as a help centre is: its home (the robot, a search, and its categories,
 * each a heading over a card for each of its sections), a section (its articles), and an article (its lead, a picture
 * of the app where it happens, its steps, the way to that place, and the rest of its section). The help is data
 * (`source`): every word, icon, picture and the robot.
 *   { "kind": "help", "source": "data/help.json" }
 */
export const Help: React.FC<{ b: Block }> = ({ b }) => {
  const [file, setFile] = React.useState<HelpFile | null>(null);
  const [find, setFind] = React.useState('');
  const { isDark } = usePuiTheme();
  const src = b.source as string;
  React.useEffect(() => {
    const url = assetUrl(src);
    if (!files.has(url)) files.set(url, fetch(url).then((r) => r.json()));
    void (files.get(url) as Promise<HelpFile>).then(setFile);
  }, [src]);
  const [page, sectionId, articleId] = useWhere();
  if (!file) return <Loading />;
  const to = (...part: string[]) => go([page, ...part].join('/'));
  const section = file.section.find((s) => s.id === sectionId);
  const article = section?.article.find((a) => a.id === articleId);
  const card = (s: Section) => (
    <Region key={s.id} style={{ flex: '1 1 16rem', minWidth: '14rem', padding: 0 }}>
      <Pressable pad="md" hover fill onClick={() => to(s.id)} style={{ alignItems: 'flex-start' }}>
        <Stack direction="column" gap={2}>
          <Ink src={s.icon} size="1.4rem"><Text as="span" size="md" weight="semibold">{s.label}</Text></Ink>
          <Text as="span" size="sm" intent="muted">{s.lead}</Text>
          <Text as="span" size="xs" intent="muted">{file.count?.[s.article.length] ?? say(file.articles, 'n', String(s.article.length))}</Text>
        </Stack>
      </Pressable>
    </Region>
  );
  const row = (s: Section, a: Article) => (
    <Pressable key={s.id + a.id} row gap={2} fill hover pad="sm" onClick={() => to(s.id, a.id)}>
      <Stack direction="column" gap={0} flex="1" minWidth="0">
        <Ink src={s.icon}><Text as="span" size="sm" weight="semibold">{a.title}</Text></Ink>
        <Text as="span" size="xs" intent="muted" truncate>{a.lead}</Text>
      </Stack>
      {a.desk && <Tag size="sm" minimal round>{file.desk}</Tag>}
    </Pressable>
  );
  const head = (robot: string, title: string, lead: string, crumb?: React.ReactNode) => (
    <Region style={{ padding: 'var(--phi-space-4)' }}>
      <Stack direction="row" gap={4} align="center">
        <Robot src={robot} />
        <Stack direction="column" gap={2} flex="1" minWidth="0">
          {crumb}
          <Title level={1}>{title}</Title>
          <Text intent="muted">{lead}</Text>
        </Stack>
      </Stack>
    </Region>
  );
  const back = (...part: { label: string; to: string[] }[]) => (
    <Stack direction="row" gap={1} wrap>
      {part.map((p, i) => <Button key={i} variant="glass" size="sm" onClick={() => to(...p.to)}>{p.label}</Button>)}
    </Stack>
  );

  // An article: the picture of the app where it happens, its steps, the way there, the rest of its section.
  if (section && article) return (
    <Stack direction="column" gap={4} maxWidth="56rem">
      {head(file.robot.article, article.title, article.lead, back({ label: file.back, to: [] }, { label: section.label, to: [section.id] }))}
      {article.shot && <Frame ratio="16/10" rounded="lg"><Picture src={assetUrl(isDark ? article.shot.dark : article.shot.light)} alt={article.title} /></Frame>}
      <Region style={{ padding: 'var(--phi-space-4)' }}>
        <Stack direction="column" gap={3}>
          <Stack direction="row" gap={2} align="center"><Ink src={section.icon}><Text as="span" weight="semibold">{file.steps}</Text></Ink>{article.desk && <Tag size="sm" minimal round>{file.desk}</Tag>}</Stack>
          {article.step.map((s, i) => (
            <Region key={i}>
              <Label wrap icon={<Text as="span" size="sm" weight="semibold" numeric>{i + 1}</Text>}><Text as="span">{s}</Text></Label>
            </Region>))}
          {article.where && <Stack direction="row"><Button variant="glass" onClick={() => go(article.where as string)}>{file.open}</Button></Stack>}
        </Stack>
      </Region>
      {(article.part ?? []).map((p, i) => (
        <Region key={i} style={{ padding: 'var(--phi-space-4)' }}>
          <Stack direction="column" gap={2}>
            <Title level={3}>{p.head}</Title>
            {(p.text ?? []).map((t, j) => <Text key={j}>{t}</Text>)}
            {p.list && <Stack direction="column" gap={1} as="ul" style={{ margin: 0, paddingInlineStart: '1.2rem' }}>
              {p.list.map((t, j) => <Text key={j} as="li">{t}</Text>)}
            </Stack>}
          </Stack>
        </Region>))}
      <Region>
        <Stack direction="column" gap={1}>
          <Text size="sm" intent="muted">{say(file.related, 'section', section.label)}</Text>
          {section.article.filter((a) => a.id !== article.id).map((a) => row(section, a))}
        </Stack>
      </Region>
    </Stack>
  );
  // A section: its articles.
  if (section) return (
    <Stack direction="column" gap={4} maxWidth="56rem">
      {head(file.robot.section, section.label, section.lead, back({ label: file.back, to: [] }))}
      <Region><Stack direction="column" gap={1}>{section.article.map((a) => row(section, a))}</Stack></Region>
    </Stack>
  );
  // The home: a search over every article, else each category over the cards of its sections.
  const sought = find.trim().toLowerCase();
  const found = sought ? file.section.flatMap((s) => s.article.filter((a) => wordsOf(a).join(' ').toLowerCase().includes(sought)).map((a) => row(s, a))) : [];
  return (
    <Stack direction="column" gap={4}>
      {head(file.robot.home, file.title, file.lead)}
      <Input icon={<Search size={14} />} value={find} placeholder={file.find} aria-label={file.find} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
      {sought
        ? (found.length ? <Region><Stack direction="column" gap={1}>{found}</Stack></Region>
          : <Region><Stack direction="row" gap={3} align="center"><Robot src={file.robot.unfound} size="4.5rem" /><Text intent="muted" role="status">{file.unfound}</Text></Stack></Region>)
        : file.category.map((c) => (
          <Region key={c.id}>
            <Stack direction="column" gap={3}>
              <Stack direction="column" gap={1}><Title level={2}>{c.label}</Title><Text size="sm" intent="muted">{c.lead}</Text></Stack>
              <Stack direction="row" gap={3} wrap>{c.section.map((id) => file.section.find((s) => s.id === id)).filter((s): s is Section => !!s).map(card)}</Stack>
            </Stack>
          </Region>))}
    </Stack>
  );
};
