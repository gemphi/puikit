import React from 'react';
/** next/link shim — the site is a pure Vite SPA. */
const Link: React.FC<{ href: string; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>{children}</a>
);
export default Link;
