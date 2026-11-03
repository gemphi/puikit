#!/usr/bin/env node
// Style 05 (the Gilded Zip line, scripts/looks-import.py) in the feeds, reels, chats and shows. Seeded, idempotent.
// Run after items.mjs (the looks have their measured colour) and before pools:
//   node scripts/style05.mjs
// Feeds: three shots of single looks. Reels: two posts that run through the line slide by slide. Chats: the line in
// the Lora Land lobby and in a direct message, each message carrying its look. Shows: Lora's Spark walks all nine
// looks at the Summer Show in Lora Land.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const write = (f, v) => { const prev = readFileSync(join(DATA, f), 'utf8'); const pretty = /\n\s+"/.test(prev.slice(0, 400)); writeFileSync(join(DATA, f), JSON.stringify(v, null, pretty ? 2 : undefined) + (prev.endsWith('\n') ? '\n' : '')); };
const ls = read('ls.json'); const feed = read('feed.json'); const agents = read('agents.json'); const hosts = read('hosts.json'); const messages = read('messages.json'); const shows = read('shows.json'); const core = read('core.json');
const looks = ls.looks.filter((l) => l.id.startsWith('ls-s05-')).sort((a, b) => a.id.localeCompare(b.id));
if (!looks.length) { console.log('style05: no Style 05 looks (run looks-import.py)'); process.exit(0); }
const W = core.worlds.find((w) => w.id === 'w_loraland'); const world = W?.id ?? null; const lawn = W?.cities.find((c) => c.name === 'Summer Show Lawn')?.id ?? W?.cities[0]?.id;
const has = (id) => core.users.some((u) => u.id === id) || agents.agents.some((a) => a.id === id);
const who = (...ids) => ids.find(has) ?? core.currentUserId;
const theo = who('u_theo_blum'), marion = who('u_marion_blum'), lora = who('u_loraland'), ponte = who('ag_ponte'), pip = who('ag_pip'), ines = who('u_ines');
const fam = (hex) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return r > 150 && g > 100 && b < 90 ? 'yellow' : r > g && r > b ? 'orange' : 'yellow'; };
const slide = (l, caption) => ({ title: l.name, tone: 'accent', caption, hex: l.hex, lookId: l.id, family: fam(l.hex) });

// Feeds: three shots, newest first in the feed.
const shotOf = (id, authorId, l, caption, tags, at, likes) => ({ id, authorId, clubId: 'c_loraland', worldId: world, media: { kind: 'look', tone: 'accent', ratio: '4/5', title: l.name, hex: l.hex, lookId: l.id, family: fam(l.hex) },
  caption, likes, comments: Math.round(likes / 14), reshares: Math.round(likes / 9), createdAt: at, tags, lookItems: [] });
const by = (n) => looks.find((l) => l.id === 'ls-s05-' + n) ?? looks[0];
const shots = [
  shotOf('s_style05_1', marion, by('08'), 'The Gilded Pleated Train walks last at the Summer Show. Five in the world.', ['#Style05', '#GildedZip', '#SummerShow'], '2026-10-11T19:30:00Z', 18420),
  shotOf('s_style05_2', theo, by('07'), "Dressed the window of Lora's Spark in the Gilded Fan at dawn. Every pleat by hand.", ['#Style05', '#Window', '#LoraLand'], '2026-10-11T07:10:00Z', 9640),
  shotOf('s_style05_3', lora, by('00'), 'The Original, the first Gilded Zip, before the line had a name.', ['#Style05', '#Original'], '2026-10-10T12:00:00Z', 22310),
];
feed.shots = [...shots, ...feed.shots.filter((s) => !s.id.startsWith('s_style05_'))];

// Reels: two posts that run through the line.
const reel = (id, authorId, list, caption, at, likes) => ({ id, authorId, kind: 'look', clubId: 'c_loraland', worldId: world, caption, likes, createdAt: at, tags: ['#Style05', '#Reel', '#GildedZip'],
  slides: list.map((l, i) => slide(l, `${i + 1} of ${list.length}: ${l.garments.slice(2).join(', ').toLowerCase()}`)),
  comments: [{ id: id + '_c1', authorId: theo, text: 'The zip catches the light on every one.', likes: 320, at: '1h' }, { id: id + '_c2', authorId: marion, text: 'Number eight. Always number eight.', likes: 210, at: '2h' }] });
agents.posts = agents.posts.filter((p) => !p.id.startsWith('p_style05_'));
agents.posts.unshift(reel('p_style05_reel1', ponte, looks, 'Style 05, the Gilded Zip: all nine, from the Original to the Pleated Train.', '2026-10-12T09:00:00Z', 31200),
  reel('p_style05_reel2', pip, [by('01'), by('02'), by('05'), by('06')], 'Four short ones from the Gilded Zip line. Which one are you wearing to the fair?', '2026-10-12T08:00:00Z', 12740));

// Chats: the Lora Land lobby and a direct message, each message with its look.
const lobby = 'n_loraland_lobby';
hosts.messages[lobby] = [...(hosts.messages[lobby] ?? []).filter((m) => !String(m.id).startsWith('st05_')),
  { id: 'st05_1', authorId: lora, at: '18:02', text: 'Style 05 is in the window. Nine looks, one zip.', lookId: by('00').id },
  { id: 'st05_2', authorId: marion, at: '18:05', text: 'I am closing the Summer Show in this one.', lookId: by('08').id },
  { id: 'st05_3', authorId: theo, at: '18:09', text: 'The Fan took the whole night to pleat. Worth it.', lookId: by('07').id }];
const conv = messages.conversations[0]?.id;
if (conv) {
  messages.threads[conv] = [...(messages.threads[conv] ?? []).filter((m) => !String(m.id).startsWith('st05_')),
    { id: 'st05_dm1', authorId: ines, at: '09:31', text: 'Saw this and thought of your Saturday walk.', lookId: by('03').id },
    { id: 'st05_dm2', authorId: ines, at: '09:32', text: 'Or the cocoon, if you want to make an entrance.', lookId: by('04').id }];
  // The open conversation reads `thread`; the same two messages go there too.
  if (messages.thread?.conversationId === conv) messages.thread.messages = [...messages.thread.messages.filter((m) => !String(m.id).startsWith('st05_')), ...messages.threads[conv].filter((m) => String(m.id).startsWith('st05_'))];
}

// Shows: Lora's Spark walks the line at the Summer Show.
const template = shows.shows.find((s) => s.looks?.length) ?? shows.shows[0];
const poses = (shows.poses ?? []).map((p) => p.id);
const show = { ...template, id: 'show_style05', worldId: world, season: 'SS27', title: "Lora's Spark: Style 05, The Gilded Zip", venueCityId: lawn, date: '2027-06-16T19:00:00Z', hostAgentId: ponte, clubId: 'c_loraland', tone: 'accent',
  looks: looks.map((l, i) => ({ id: `show_style05_l${String(i + 1).padStart(2, '0')}`, n: i + 1, title: l.name, tone: 'accent', pieces: l.garments, poseId: poses[i % Math.max(1, poses.length)] ?? template.looks[0].poseId, hex: l.hex, lookId: l.id })),
  poseIds: looks.map((_, i) => poses[i % Math.max(1, poses.length)]).filter(Boolean) };
shows.shows = [...shows.shows.filter((s) => s.id !== 'show_style05'), show];

write('feed.json', feed); write('agents.json', agents); write('hosts.json', hosts); write('messages.json', messages); write('shows.json', shows);
console.log(`style05: ${shots.length} shots, 2 reels, ${3 + (conv ? 2 : 0)} chat messages, 1 show of ${looks.length} looks`);
