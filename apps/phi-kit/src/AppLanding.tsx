import React from 'react';
import { Button } from '@pui/components';
import { FeatureShowcase, type Feature } from './Showcase';
import { appMeta, type AppData, type NavItem } from './data';

/** Every app's menu as a flat list of leaves (a group with sub-items contributes its leaves). */
const leaves = (nav: NavItem[]): NavItem[] => nav.flatMap((n) => (n.items && n.items.length ? n.items : [n]));

/**
 * The app's welcome page, built from the app's own data — nothing per-app. The hero is the app's name, tagline and
 * description; each feature row is one of the app's menu sections, shown with its live content (the first pulled
 * record's image as the shot, the top records as bullets) and a button into it. So every app's landing is the same
 * Meta/Muse template (the shared {@link FeatureShowcase}); only the data — the content types and the sections —
 * differs, and the app's own colour tints the posters.
 */
export const AppLanding: React.FC<{ data: AppData; go: (id: string) => void }> = ({ data, go }) => {
  const app = appMeta(data.app);
  const all = leaves(data.nav).filter((n) => !n.id.startsWith('_'));
  const withContent = all.filter((n) => n.previews && n.previews.length);
  const secs = (withContent.length ? withContent : all).slice(0, 4);
  // Tinted posters (the app's colour + the section name) rather than screenshots: the data-driven apps don't carry
  // their own art, so a poster reads cleanly everywhere. An app with real shots (phiegg) uses its own WelcomePage.
  const features: Feature[] = secs.map((n) => ({
    eyebrow: n.label,
    title: n.label,
    tint: app?.color,
    bullets: (n.previews ?? []).slice(0, 3).map((p) => p.title).filter(Boolean),
    cta: { label: 'Open ' + n.label, onClick: () => go(n.id) },
  }));
  const first = all[0];
  return (
    <FeatureShowcase
      eyebrow={app?.name}
      title={app?.tagline ?? app?.name ?? ''}
      lede={app?.desc}
      actions={first ? <Button variant="primary" onClick={() => go(first.id)}>Enter {app?.name}</Button> : undefined}
      features={features}
      close={{ title: `Make your move in ${app?.name ?? 'Phiace'}`, body: app?.desc, actions: first ? <Button variant="primary" onClick={() => go(first.id)}>Open {first.label}</Button> : undefined }}
    />
  );
};
