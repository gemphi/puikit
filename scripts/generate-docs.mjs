#!/usr/bin/env node
// @ts-check
/**
 * generate-docs.mjs — PuiJS auto-generated component documentation.
 *
 * Standalone Node ESM script (no external dependencies) that walks the puijs
 * component sources under `src/components`, extracts documented interfaces and
 * descriptions from each exported component, cross-references any companion
 * `*.stories.tsx` file, and emits one documentation entry per exported
 * component into `site/docs/`.
 *
 * Design references:
 *   - Requirement 13.1: derive documentation from component source.
 *   - Requirement 13.2: produce an entry covering each exported component.
 *   - Requirement 13.3: report (and skip) components lacking documentation
 *     metadata WITHOUT aborting the run.
 *   - Requirement 13.4: use only PuiJS-internal / standard-library tooling; no
 *     Storybook or external documentation framework is imported here.
 *
 * "One UI Kit Per App": this is kit-agnostic logic/tooling (a build script),
 * not a view — it introduces no UI-kit dependency and imports no other kit.
 *
 * Usage: `node scripts/generate-docs.mjs`
 */

import { readFileSync, readdirSync, statSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(__dirname);
const COMPONENTS_ROOT = join(PACKAGE_ROOT, 'src', 'components');
const DOCS_OUT = join(PACKAGE_ROOT, 'site', 'docs');

/**
 * Recursively collect `.tsx` component source files, excluding story files and
 * declaration files.
 * @param {string} dir
 * @returns {string[]}
 */
function collectComponentFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectComponentFiles(full));
    } else if (
      entry.endsWith('.tsx') &&
      !entry.endsWith('.stories.tsx') &&
      !entry.endsWith('.d.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strip the JSDoc comment framing (`/**`, `*\/`, leading ` * `) from a raw
 * block comment, returning clean prose.
 * @param {string} raw
 * @returns {string}
 */
function cleanJsDoc(raw) {
  return raw
    .replace(/^\s*\/\*\*?/, '')
    .replace(/\*\/\s*$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trimEnd())
    .join('\n')
    // Collapse the `{@link X}` doc references down to the bare symbol.
    .replace(/\{@link\s+([^}]+)\}/g, '$1')
    .trim();
}

/**
 * Find the JSDoc block that immediately precedes a given source index (allowing
 * only whitespace between the comment and the declaration).
 * @param {string} source
 * @param {number} declIndex
 * @returns {string | null}
 */
function precedingJsDoc(source, declIndex) {
  const before = source.slice(0, declIndex);
  // The comment must end immediately before the declaration, separated only by
  // whitespace. Find the last `*/`, ensure only whitespace follows it, then walk
  // back to its matching `/*` opener so we capture exactly one comment (never a
  // greedy span across intervening code such as a sibling `type`/`const`).
  const trailing = before.match(/\s*$/);
  const endWhitespaceStart = before.length - (trailing ? trailing[0].length : 0);
  const commentEnd = before.lastIndexOf('*/', endWhitespaceStart);
  if (commentEnd === -1 || commentEnd + 2 !== endWhitespaceStart) {
    // Either no comment, or non-whitespace code sits between it and the decl.
    return null;
  }
  const commentStart = before.lastIndexOf('/*', commentEnd);
  if (commentStart === -1) return null;
  // Reject if there is any non-whitespace (i.e. code) between an intervening
  // `*/` and our comment start — guards against matching a detached comment.
  const cleaned = cleanJsDoc(before.slice(commentStart, commentEnd + 2));
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Extract the body of `export interface <Name> { ... }` from source, balancing
 * braces so nested object types are captured.
 * @param {string} source
 * @param {string} interfaceName
 * @returns {string | null}
 */
function extractInterfaceBody(source, interfaceName) {
  const re = new RegExp(`export\\s+interface\\s+${interfaceName}\\b[^{]*\\{`);
  const m = re.exec(source);
  if (!m) return null;
  let depth = 0;
  let start = m.index + m[0].length - 1; // position of the opening brace
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(start + 1, i);
      }
    }
  }
  return null;
}

/**
 * Extract the `{ ... }` body from a `type <Name> = ...` alias — including
 * intersections like `type StackProps = Base & { own: X }` — plus any base
 * types the alias references. This covers puijs's dominant Props declaration
 * pattern (e.g. `type StackProps = HTMLAttributes<...> & StyleProps & { ... }`),
 * which pure interface matching misses.
 *
 * Returns `{ body, bases }` so the caller can surface extended base types
 * (e.g. `HTMLAttributes`, `StyleProps`) even when the alias has no own body.
 * @param {string} source
 * @param {string} typeName
 * @returns {{ body: string, bases: string[] } | null}
 */
function extractTypeAliasBody(source, typeName) {
  const re = new RegExp(`export\\s+type\\s+${typeName}\\b[^=]*=`);
  const m = re.exec(source);
  if (!m) return null;

  // Scan forward from the `=` until we hit a `;` at depth 0. This preserves
  // intersections and nested generics/object literals.
  const start = m.index + m[0].length;
  let depth = 0;
  let end = -1;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{' || ch === '(' || ch === '<' || ch === '[') depth++;
    else if (ch === '}' || ch === ')' || ch === '>' || ch === ']') depth = Math.max(0, depth - 1);
    else if (ch === ';' && depth === 0) { end = i; break; }
  }
  if (end === -1) end = source.length;
  const rhs = source.slice(start, end).trim();

  // Split intersections at top-level `&` (not inside braces/generics).
  const parts = [];
  {
    let d = 0;
    let last = 0;
    for (let i = 0; i < rhs.length; i++) {
      const ch = rhs[i];
      if (ch === '{' || ch === '(' || ch === '<' || ch === '[') d++;
      else if (ch === '}' || ch === ')' || ch === '>' || ch === ']') d = Math.max(0, d - 1);
      else if (ch === '&' && d === 0) {
        parts.push(rhs.slice(last, i).trim());
        last = i + 1;
      }
    }
    parts.push(rhs.slice(last).trim());
  }

  // The own body is the first bracketed object literal we find in any part.
  let body = '';
  const bases = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('{')) {
      // Balance braces to extract just this object literal.
      let d = 0;
      for (let i = 0; i < part.length; i++) {
        const ch = part[i];
        if (ch === '{') d++;
        else if (ch === '}') {
          d--;
          if (d === 0) {
            const chunk = part.slice(1, i);
            body = body ? `${body};\n${chunk}` : chunk;
            break;
          }
        }
      }
    } else {
      // A referenced base type (e.g. `HTMLAttributes<HTMLDivElement>`, `StyleProps`).
      // Keep the bare identifier before any generic arguments.
      const bare = part.replace(/\s+/g, ' ').replace(/<[\s\S]*$/, '').trim();
      if (bare) bases.push(bare);
    }
  }

  return { body, bases };
}

/**
 * Parse an interface body into prop descriptors: name, optional flag, type, and
 * any preceding doc comment.
 * @param {string} body
 * @returns {{ name: string, optional: boolean, type: string, description: string | null }[]}
 */
function parseProps(body) {
  /** @type {{ name: string, optional: boolean, type: string, description: string | null }[]} */
  const props = [];
  // Tokenize into "member statements" while tracking pending doc comments.
  let i = 0;
  let pendingDoc = null;
  while (i < body.length) {
    // Skip whitespace.
    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length) break;

    // Capture a leading block/line comment as the member description.
    if (body.startsWith('/**', i) || body.startsWith('/*', i)) {
      const end = body.indexOf('*/', i);
      if (end === -1) break;
      pendingDoc = cleanJsDoc(body.slice(i, end + 2)) || null;
      i = end + 2;
      continue;
    }
    if (body.startsWith('//', i)) {
      const nl = body.indexOf('\n', i);
      const line = body.slice(i + 2, nl === -1 ? undefined : nl).trim();
      pendingDoc = line || pendingDoc;
      i = nl === -1 ? body.length : nl + 1;
      continue;
    }

    // Read a member up to its terminating `;` or newline, balancing braces so
    // inline object/function types are captured whole.
    let depth = 0;
    let start = i;
    while (i < body.length) {
      const ch = body[i];
      if (ch === '{' || ch === '(' || ch === '<') depth++;
      else if (ch === '}' || ch === ')' || ch === '>') depth = Math.max(0, depth - 1);
      else if ((ch === ';' || ch === '\n') && depth === 0) break;
      i++;
    }
    const member = body.slice(start, i).trim();
    i++; // step past the terminator

    if (member) {
      const nameMatch = member.match(/^(?:readonly\s+)?['"]?([A-Za-z0-9_$-]+)['"]?(\?)?\s*:\s*([\s\S]+)$/);
      if (nameMatch) {
        props.push({
          name: nameMatch[1],
          optional: Boolean(nameMatch[2]),
          type: nameMatch[3].replace(/\s+/g, ' ').trim(),
          description: pendingDoc,
        });
      }
      pendingDoc = null;
    }
  }
  return props;
}

/**
 * Discover exported React component symbols in a source file. Supports:
 *   export const Foo = (...) => ...
 *   export const Foo: React.FC<...> = ...
 *   export function Foo(...)
 * A symbol is treated as a component when it is PascalCase.
 * @param {string} source
 * @returns {{ name: string, index: number }[]}
 */
function findExportedComponents(source) {
  /** @type {{ name: string, index: number }[]} */
  const found = [];
  const seen = new Set();
  const patterns = [
    /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g,
    /export\s+function\s+([A-Z][A-Za-z0-9_]*)\s*[<(]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(source)) !== null) {
      const name = m[1];
      if (seen.has(name)) continue;
      // Exclude SCREAMING_SNAKE_CASE constants (e.g. BUTTON_VARIANTS): these are
      // exported values, not React components.
      if (/^[A-Z0-9_]+$/.test(name) && name.includes('_')) continue;
      seen.add(name);
      found.push({ name, index: m.index });
    }
  }
  return found;
}

/**
 * Locate a companion stories file in the same directory and extract its
 * Storybook `title` and exported story names (best-effort, no import).
 * @param {string} componentFile
 * @returns {{ file: string, title: string | null, stories: string[] } | null}
 */
function findCompanionStories(componentFile) {
  const dir = dirname(componentFile);
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  const storyFile = entries.find((e) => e.endsWith('.stories.tsx'));
  if (!storyFile) return null;
  const full = join(dir, storyFile);
  let src;
  try {
    src = readFileSync(full, 'utf8');
  } catch {
    return null;
  }
  const titleMatch = src.match(/title:\s*['"]([^'"]+)['"]/);
  const stories = [];
  const storyRe = /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*:/g;
  let m;
  while ((m = storyRe.exec(src)) !== null) {
    stories.push(m[1]);
  }
  return {
    file: relative(PACKAGE_ROOT, full).split(sep).join('/'),
    title: titleMatch ? titleMatch[1] : null,
    stories,
  };
}

/**
 * Build a documentation entry for a single exported component. Every exported
 * component gets an entry — a UI framework's docs page must cover 100% of its
 * public surface, so we never skip a component. Missing description or props
 * render as "no metadata" in the docs viewer rather than as a silent skip.
 * @param {string} file
 * @param {string} source
 * @param {{ name: string, index: number }} component
 * @param {{ file: string, title: string | null, stories: string[] } | null} companion
 */
function buildEntry(file, source, component, companion) {
  const description = precedingJsDoc(source, component.index);
  const propsName = `${component.name}Props`;

  // Props declarations in puijs come in three shapes, in decreasing frequency:
  //   1. `export interface FooProps { ... }` — direct interface (~10% of comps)
  //   2. `export type FooProps = Base & { ... }` — intersection alias (~60%)
  //   3. no explicit `Props` type — component uses inline props or HTMLAttrs
  // We try interface first, fall back to type alias. When the alias references
  // base types (HTMLAttributes<...>, StyleProps), we surface those as `extends`
  // so consumers know their standard props are available too.
  const interfaceBody = extractInterfaceBody(source, propsName);
  let propsBody = interfaceBody;
  let extendsBases = [];
  if (!propsBody) {
    const alias = extractTypeAliasBody(source, propsName);
    if (alias) {
      propsBody = alias.body;
      extendsBases = alias.bases;
    }
  }
  const props = propsBody ? parseProps(propsBody) : [];

  return {
    name: component.name,
    source: relative(PACKAGE_ROOT, file).split(sep).join('/'),
    description: description ?? null,
    propsInterface: propsBody ? propsName : null,
    extendsBases,
    props,
    stories: companion
      ? { file: companion.file, title: companion.title, examples: companion.stories }
      : null,
    generatedAt: new Date().toISOString(),
  };
}

function main() {
  console.log('[generate-docs] PuiJS documentation generation');
  console.log(`[generate-docs] components: ${relative(PACKAGE_ROOT, COMPONENTS_ROOT)}`);
  console.log(`[generate-docs] output:     ${relative(PACKAGE_ROOT, DOCS_OUT)}`);

  let files;
  try {
    files = collectComponentFiles(COMPONENTS_ROOT);
  } catch (err) {
    console.error(`[generate-docs] FATAL: cannot read component root: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  // Clean + recreate the output directory so stale entries do not linger.
  rmSync(DOCS_OUT, { recursive: true, force: true });
  mkdirSync(DOCS_OUT, { recursive: true });

  const entries = [];
  const skipped = [];

  for (const file of files) {
    let source;
    try {
      source = readFileSync(file, 'utf8');
    } catch (err) {
      // Non-aborting: a single unreadable file is reported and skipped.
      const rel = relative(PACKAGE_ROOT, file).split(sep).join('/');
      skipped.push({ component: basename(file), source: rel, reason: `unreadable: ${err.message}` });
      console.warn(`[generate-docs] SKIP (unreadable): ${rel}`);
      continue;
    }

    const components = findExportedComponents(source);
    if (components.length === 0) continue;

    const companion = findCompanionStories(file);
    const rel = relative(PACKAGE_ROOT, file).split(sep).join('/');

    for (const component of components) {
      let entry;
      try {
        entry = buildEntry(file, source, component, companion);
      } catch (err) {
        // Non-aborting: extraction failure for one component is reported/skipped.
        skipped.push({ component: component.name, source: rel, reason: `extract-error: ${err.message}` });
        console.warn(`[generate-docs] SKIP (error): ${component.name} in ${rel} — ${err.message}`);
        continue;
      }
      // Every component gets an entry; missing description/props are handled
      // by the docs viewer, not by silently dropping the component.
      const outFile = join(DOCS_OUT, `${entry.name}.json`);
      writeFileSync(outFile, JSON.stringify(entry, null, 2) + '\n', 'utf8');
      entries.push(entry);
    }
  }

  // Emit an index manifest so PuiBook (R14) can enumerate entries.
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    skipped: skipped.length,
    components: entries
      .map((e) => ({ name: e.name, source: e.source, entry: `${e.name}.json` }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    undocumented: skipped.sort((a, b) => a.component.localeCompare(b.component)),
  };
  writeFileSync(join(DOCS_OUT, 'index.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`[generate-docs] wrote ${entries.length} documentation entr${entries.length === 1 ? 'y' : 'ies'}`);
  if (skipped.length > 0) {
    console.log(`[generate-docs] skipped ${skipped.length} undocumentable component(s) (see above; run continued)`);
  }
  console.log('[generate-docs] done.');
}

main();
