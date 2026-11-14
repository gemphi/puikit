import React from 'react';
import { Button } from '@pui/components';
import { FeatureShowcase, type Feature } from './Showcase';
import { appMeta, type AppData, type NavItem } from './data';
import words from './words.json';

/** A word from words.json with its {slots} filled. */
const say = (w: string, slots: Record<string, string>) => w.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? '');

/** Every app's menu as a flat list of leaves, each with the group it sits in (a lone page has none). */
const leaves = (nav: NavItem[]): { n: NavItem; group?: NavItem }[] =>
  nav.flatMap((g) => (g.items && g.items.length ? g.items.map((n) => ({ n, group: g })) : [{ n: g }]));

/**
 * The app's welcome page, built from the app's own data — nothing per-app. The hero is the app's tagline and
 * description; each feature row is one of the app's menu sections: its own picture (the section's image, else its first
 * pulled record's), its line from the view, the group it belongs to as the label above, the top records as bullets and
 * a button into it. A section with no picture gets a poster in the app's colour. Words come from words.json.
 */
export const AppLanding: React.FC<{ data: AppData; go: (id: string) => void }> = ({ data, go }) => {
  const app = appMeta(data.app);
  const name = app?.name ?? '';
  const all = leaves(data.nav).filter(({ n }) => !n.id.startsWith('_'));
  // Four sections: those with live records first, then those with a picture, kept in the menu's order.
  const worth = ({ n }: { n: NavItem }) => (n.previews?.length ? 2 : 0) + (n.image ? 1 : 0);
  const picked = new Set([...all].sort((a, b) => worth(b) - worth(a)).slice(0, 4));
  const secs = all.filter((s) => picked.has(s));
  const features: Feature[] = secs.map(({ n, group }) => ({
    eyebrow: group && group.label !== n.label ? group.label : undefined,
    title: n.label,
    body: data.views[n.id]?.sub || undefined,
    image: n.image ?? n.previews?.find((p) => p.image)?.image,
    tint: app?.color,
    bullets: (n.previews ?? []).slice(0, 3).map((p) => p.title).filter(Boolean),
    cta: { label: say(words.landing.open, { page: n.label }), onClick: () => go(n.id) },
  }));
  const first = all[0]?.n;
  return (
    <FeatureShowcase
      title={app?.tagline ?? name}
      lede={app?.desc}
      actions={first ? <Button variant="primary" onClick={() => go(first.id)}>{say(words.landing.enter, { app: name })}</Button> : undefined}
      features={features}
      close={{ title: say(words.landing.close, { app: name }), body: app?.desc, actions: first ? <Button variant="primary" onClick={() => go(first.id)}>{say(words.landing.open, { page: first.label })}</Button> : undefined }}
    />
  );
};
