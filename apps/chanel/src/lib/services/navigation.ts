import raw from '../../mocks/api-navigation.json';
import { t } from '../../locales/t';

interface NavPayload {
  footer: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  account: Array<{ label: string; path: string }>;
}

const nav = raw as NavPayload;

type FooterKey = keyof typeof t.footer;
type AccountKey = keyof typeof t.account;

/**
 * Navigation as data, with labels resolved through the locale.
 *
 * The payload stores copy *keys*, not copy — so a footer link is translated by
 * the same mechanism as everything else and no label is written in a component.
 */
export const getFooterColumns = () =>
  nav.footer.map((col) => ({
    title: t.footer[col.title as FooterKey] ?? col.title,
    links: col.links.map((l) => ({
      label: t.footer[l.label as FooterKey] ?? l.label,
      href: l.href,
    })),
  }));

export const getAccountNav = () =>
  nav.account.map((item) => ({
    label: t.account[item.label as AccountKey] ?? item.label,
    path: item.path,
  }));
