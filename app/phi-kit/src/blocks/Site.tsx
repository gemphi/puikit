import React from 'react';
import { Button, Stack } from '@pui/components';
import { appMeta, appUrl, assetUrl, currentAppKey, type Block } from '../data';
import { AppGlyph } from '../icons';
import s from '../kit.module.scss';

/** The parts of a product page (a bare app, the way Discord's home is laid): its top bar, a band of words that runs
 *  across, and its footer of link columns. All by data; the styles are kit.module.scss's, every colour the theme's. */

/** A link in a site's data: another app (`app`), a page of this one (`view`) or an address (`href`); `off` shows it
 *  but leads nowhere yet (a download not ready). */
export type SiteLink = { label: string; href?: string; app?: string; view?: string; off?: boolean };
const hrefOf = (l: SiteLink) => (l.app ? appUrl(l.app) : l.view ? '#/' + l.view : l.href || '#');

/** A link as words: followed, or, while it is `off`, its words alone and dimmed. */
const Link: React.FC<{ l: SiteLink }> = ({ l }) => (l.off ? <span className={s.siteLinkOff} aria-disabled="true">{l.label}</span> : <a href={hrefOf(l)}>{l.label}</a>);
/** A link as a button: while it is `off`, a button that cannot be pressed. */
const Way: React.FC<{ l: SiteLink }> = ({ l }) => (l.off ? <Button variant="glass" disabled>{l.label}</Button> : <Button variant="glass" href={hrefOf(l)}>{l.label}</Button>);
/** The ways in a hero or a bar offers, a row of buttons. */
export const Ways: React.FC<{ items?: SiteLink[]; justify?: 'center' }> = ({ items, justify }) => (items?.length ? (
  <Stack direction="row" gap={2} wrap align="center" justify={justify}>{items.map((l, i) => <Way key={i} l={l} />)}</Stack>
) : null);

/** The app's own mark and name, as its logo. */
const Brand: React.FC = () => {
  const app = appMeta(currentAppKey());
  return app ? <a className={s.siteBrand} href="#/"><AppGlyph paths={app.icon} size={26} /><span>{app.name}</span></a> : null;
};

/** `kind: "bar"`: the logo at the start, the links in the middle, one action at the end. */
export const SiteBar: React.FC<{ b: Block }> = ({ b }) => (
  <nav className={s.siteBar}>
    <Brand />
    <div className={s.siteBarLinks}>{(b.items as SiteLink[] | undefined ?? []).map((l, i) => <Link key={i} l={l} />)}</div>
    {b.action ? <Way l={b.action} /> : <span />}
  </nav>
);

/** `kind: "marquee"`: its words run across the page without end, the band in the theme's sweep. */
export const Marquee: React.FC<{ b: Block }> = ({ b }) => {
  const words: string[] = b.items ?? [];
  const run = [...words, ...words, ...words, ...words];
  return (
    <div className={s.marquee} aria-label={words.join(', ')}>
      <div className={s.marqueeRun} aria-hidden>{[...run, ...run].map((w, i) => <span key={i}>{w}</span>)}</div>
    </div>
  );
};

/** `kind: "footer"`: the logo, then columns of links, each with its heading. */
export const SiteFooter: React.FC<{ b: Block }> = ({ b }) => (
  <footer className={s.siteFooter}>
    <div className={s.siteFooterBrand}><Brand />{b.body ? <p>{b.body}</p> : null}</div>
    {(b.columns as { title: string; items: SiteLink[] }[] | undefined ?? []).map((c) => (
      <div key={c.title} className={s.siteFooterCol}><h3>{c.title}</h3>{c.items.map((l, i) => <Link key={i} l={l} />)}</div>
    ))}
  </footer>
);

/** A hero's `variant: "split"`: the words at the start, the picture in its panel at the end with `figures` (full
 *  standing figures on a clear ground) at its feet either side, the way Discord's characters stand round its app. */
export const HeroSplit: React.FC<{ b: Block; actions: React.ReactNode }> = ({ b, actions }) => (
  <section className={s.heroSplit}>
    <div className={s.heroSplitWords}>
      <h1 className={s.heroSplitTitle}>{b.heading}</h1>
      {b.body ? <p className={s.siteCardBody}>{b.body}</p> : null}
      {actions}
    </div>
    <div className={s.heroSplitStage}>
      <div className={s.siteCardPanel}>{b.image ? <img src={assetUrl(b.image)} alt="" /> : null}</div>
      {(b.figures as string[] | undefined ?? []).slice(0, 2).map((f, i) => <img key={f} className={i ? s.heroFigureEnd : s.heroFigureStart} src={assetUrl(f)} alt="" />)}
    </div>
  </section>
);
