import React, { useState } from 'react';
import { Button } from '@pui/components';
import { X } from 'lucide-react';
import { Logo } from '../brand/logo';

/** House hamburger: the middle bar is two-thirds of the outer bars, centred. */
const MenuGlyph: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
    <line x1="1.5" y1="4" x2="16.5" y2="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <line x1="4" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <line x1="1.5" y1="14" x2="16.5" y2="14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
import { useRouter } from '../../router';
import { routes, href, EMAILS, FOUNDED } from '../../lib/routes';
import s from '../../styles/uaia.module.scss';

const NAV: Array<{ label: string; to: string }> = [
  { label: 'About', to: routes.about() },
  { label: 'Framework', to: routes.framework() },
  { label: 'Evaluations', to: routes.evaluations() },
  { label: 'Registry', to: routes.certification() },
  { label: 'Standards', to: routes.standards() },
  { label: 'Newsroom', to: routes.newsroom() },
];

const FOOTER_COLS: Array<{ head: string; links: Array<{ label: string; to: string }> }> = [
  {
    head: 'Agency',
    links: [
      { label: 'About', to: routes.about() },
      { label: 'Mission & Vision', to: routes.mission() },
      { label: 'Governance & Charter', to: routes.governance() },
      { label: 'Leadership & Council', to: routes.leadership() },
    ],
  },
  {
    head: 'Regulation',
    links: [
      { label: 'Regulatory Framework', to: routes.framework() },
      { label: 'Evaluations', to: routes.evaluations() },
      { label: 'Certification & Registry', to: routes.certification() },
      { label: 'Standards Catalog', to: routes.standards() },
    ],
  },
  {
    head: 'World',
    links: [
      { label: 'Global Partnerships', to: routes.partnerships() },
      { label: 'Newsroom & Statements', to: routes.newsroom() },
      { label: 'Research & Publications', to: routes.research() },
      { label: 'Policy Topics', to: routes.policy() },
    ],
  },
  {
    head: 'Agency Ops',
    links: [
      { label: 'Careers & Open Seats', to: routes.careers() },
      { label: 'Contact', to: routes.contact() },
      { label: 'Legal & Transparency', to: routes.legal() },
    ],
  },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const go = (to: string) => { setOpen(false); navigate(to); };
  return (
    <div className={s.page}>
      <nav className={s.nav} aria-label="Primary">
        <a
          href={href(routes.home())}
          style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex' }}
          aria-label="UAIA home"
        >
          <Logo size={30} variant={path === routes.home() ? 'filled' : 'line'} />
        </a>
        <Button
          variant="ghost"
          size="sm"
          className={s.navToggle}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          icon={open ? <X size={18} /> : <MenuGlyph />}
        />
        <div className={`${s.navLinks} ${open ? s.navOpen : ''}`}>
          {NAV.map((item) => (
            <a
              key={item.to}
              className={`${s.navLink} ${path === item.to ? s.navLinkActive : ''}`}
              href={href(item.to)}
              aria-current={path === item.to || undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Button variant="primary" size="sm" onClick={() => go(routes.newsroom())}>
            Declaration
          </Button>
        </div>
      </nav>

      <main>{children}</main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <Logo size={34} variant="mono" />
          <div className={s.footerCols}>
            {FOOTER_COLS.map((col) => (
              <div key={col.head}>
                <div className={s.footerHead}>{col.head}</div>
                {col.links.map((l) => (
                  <a key={l.to} className={s.footerLink} href={href(l.to)}>
                    {l.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className={s.footerLine}>
            <span>© 2026 Unified Artificial Intelligence Agency</span>
            <span>uaiagency.org</span>
            <a className={s.footerLink} style={{ display: 'inline', padding: 0 }} href={`mailto:${EMAILS.info}`}>{EMAILS.info}</a>
            <a className={s.footerLink} style={{ display: 'inline', padding: 0 }} href={`mailto:${EMAILS.hello}`}>{EMAILS.hello}</a>
            <span>Founded {FOUNDED}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
