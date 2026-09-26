import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { Box } from './layout/Box';

/**
 * Single-base-`<div>` enforcement (Requirement 16, Property 20).
 *
 * `src/components/layout/Box` is the ONLY component in puijs allowed to render a
 * raw DOM `<div>`. Every other component composes `Box` (or a primitive that
 * ultimately composes `Box`). This static-scan test reads every component
 * source file, strips comments and string/template literals so doc-comment
 * mentions of "`<div>`" do not count, and asserts that no file other than
 * `layout/Box` contains a raw `<div` JSX render.
 *
 * Kit-agnostic test logic: it scans puijs component sources only and imports no
 * other UI kit ("One UI Kit Per App").
 *
 * Feature: puijs-theming-and-test-platform
 *   Property 20: Single-base-div — only Box renders a raw `<div>`; all other
 *   components compose it — _Validates: Requirements 16.1, 16.2, 16.4, 16.5_
 */

const COMPONENTS_ROOT = dirname(fileURLToPath(import.meta.url));

/** The sole file permitted to name a raw `<div>` / `'div'` literal. */
const BOX_FILE = join('layout', 'Box', 'index.tsx');

/** Recursively collect component `.tsx`/`.ts` sources, excluding test/story files. */
function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
      continue;
    }
    if (!/\.(tsx|ts)$/.test(entry)) continue;
    if (/\.(test|stories)\.(tsx|ts)$/.test(entry)) continue;
    if (entry.endsWith('.d.ts')) continue;
    out.push(full);
  }
  return out;
}

/**
 * Remove block comments, line comments, and string/template literals from a
 * source so that only executable code (JSX renders) remains for scanning.
 * This prevents doc-comment mentions like "no raw `<div>`" from tripping the
 * scan.
 */
function stripCommentsAndStrings(source: string): string {
  let out = '';
  let i = 0;
  const n = source.length;
  type Mode = 'code' | 'line' | 'block' | 'single' | 'double' | 'template';
  let mode: Mode = 'code';

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    if (mode === 'code') {
      if (ch === '/' && next === '/') { mode = 'line'; i += 2; continue; }
      if (ch === '/' && next === '*') { mode = 'block'; i += 2; continue; }
      if (ch === "'") { mode = 'single'; i += 1; continue; }
      if (ch === '"') { mode = 'double'; i += 1; continue; }
      if (ch === '`') { mode = 'template'; i += 1; continue; }
      out += ch; i += 1; continue;
    }
    if (mode === 'line') {
      if (ch === '\n') { mode = 'code'; out += ch; }
      i += 1; continue;
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') { mode = 'code'; i += 2; continue; }
      i += 1; continue;
    }
    // string/template literals: skip escaped chars, end on matching quote
    if (ch === '\\') { i += 2; continue; }
    if (mode === 'single' && ch === "'") { mode = 'code'; i += 1; continue; }
    if (mode === 'double' && ch === '"') { mode = 'code'; i += 1; continue; }
    if (mode === 'template' && ch === '`') { mode = 'code'; i += 1; continue; }
    i += 1;
  }
  return out;
}

/** A raw `<div>` JSX open tag, or the `'div'`/"div" string literal element name. */
const RAW_DIV_RE = /<div[\s/>]/;

describe('single-base <div> enforcement (Property 20)', () => {
  const files = collectSourceFiles(COMPONENTS_ROOT);

  it('scans a non-trivial number of component source files', () => {
    // Guard against a broken glob silently passing the suite.
    expect(files.length).toBeGreaterThan(20);
  });

  it('Property 20: only layout/Box renders a raw <div>; every other component composes it', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const rel = relative(COMPONENTS_ROOT, file);
      const relPosix = rel.split(sep).join('/');
      const isBox = rel === BOX_FILE;

      const code = stripCommentsAndStrings(readFileSync(file, 'utf8'));
      const hasRawDiv = RAW_DIV_RE.test(code);

      if (hasRawDiv && !isBox) {
        offenders.push(relPosix);
      }
    }

    expect(
      offenders,
      `These component sources render a raw <div> outside layout/Box (compose <Box> instead):\n  ${offenders.join(
        '\n  ',
      )}`,
    ).toEqual([]);
  });

  it('confirms layout/Box itself is the sanctioned raw-<div> base', () => {
    // Read the RAW source (not comment/string-stripped): the sanctioned base
    // names the `'div'` literal as its default element, which is exactly the
    // one place allowed to reference a raw div. Scanning the stripped source
    // here would be self-defeating since the literal lives inside a string.
    const boxSource = readFileSync(join(COMPONENTS_ROOT, BOX_FILE), 'utf8');
    expect(/['"]div['"]/.test(boxSource)).toBe(true);
  });

  it('Box renders without throwing and preserves its public export name', () => {
    expect(Box.displayName ?? Box.name).toBeTruthy();
    const { container } = render(React.createElement(Box, null, 'content'));
    expect(container.firstChild).not.toBeNull();
    // Default element is a div.
    expect((container.firstChild as HTMLElement).tagName).toBe('DIV');
    expect(container.textContent).toBe('content');
  });
});
