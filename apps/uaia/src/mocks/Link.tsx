import React from 'react';
import { Link as PuiLink } from '@pui/components';

/** next/link shim — the site is a pure Vite SPA; renders puijs Link (plain, so callers' classes style it). */
const Link: React.FC<{ href: string; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => (
  <PuiLink variant="plain" href={href} {...rest}>{children}</PuiLink>
);
export default Link;
