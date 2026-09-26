// Generated-documentation loader.
//
// Reads the auto-generated documentation emitted by `scripts/generate-docs.mjs`
// (task 11.1) from `site/docs/`: an `index.json` manifest plus one
// `<Component>.json` entry per exported component. Vite statically inlines these
// JSON files at build time via `import.meta.glob`, so whenever the generator
// re-runs and the JSON changes, pui-book reflects the updated documentation on
// the next build/dev reload (Requirements 14.1, 14.2).

// --- Shape of the generated JSON (see scripts/generate-docs.mjs) ---

export interface DocsPropEntry {
  name: string;
  optional: boolean;
  type: string;
  description: string | null;
}

export interface DocsStories {
  file: string;
  title: string;
  examples: string[];
}

export interface ComponentDocEntry {
  name: string;
  source: string;
  description: string | null;
  propsInterface: string | null;
  /**
   * Base types the component's Props alias extends (e.g. `HTMLAttributes`,
   * `StyleProps`). Surfaced by the generator when the Props declaration is a
   * `type FooProps = Base & { own: X }` intersection, so consumers can see
   * that the component also accepts the base type's standard props.
   */
  extendsBases: string[];
  props: DocsPropEntry[];
  stories: DocsStories | null;
  generatedAt: string;
}

export interface ManifestComponent {
  name: string;
  source: string;
  entry: string;
}

export interface UndocumentedComponent {
  component: string;
  source: string;
  reason: string;
}

export interface DocsManifest {
  generatedAt: string;
  total: number;
  skipped: number;
  components: ManifestComponent[];
  undocumented: UndocumentedComponent[];
}

// --- Static loading of the generated site/docs JSON ---
//
// The `@site-docs` alias (vite.config.ts / tsconfig paths) points at
// `../../site/docs`. `import.meta.glob` requires a literal, relative pattern,
// so we glob the directory relative to this file: services -> src -> pui-book
// -> apps -> puijs, then into `site/docs`.

const docEntryModules = import.meta.glob<ComponentDocEntry>(
  '../../../../site/docs/*.json',
  { eager: true, import: 'default' },
);

const manifestModules = import.meta.glob<DocsManifest>(
  '../../../../site/docs/index.json',
  { eager: true, import: 'default' },
);

function fileNameOf(globPath: string): string {
  const parts = globPath.split('/');
  return parts[parts.length - 1];
}

/** The parsed docs manifest, or null when generation has not been run. */
export function getDocsManifest(): DocsManifest | null {
  const found = Object.values(manifestModules)[0];
  return found ?? null;
}

// Map of "<Component>.json" -> parsed entry (excludes the index manifest).
const entriesByFile: Record<string, ComponentDocEntry> = {};
for (const [globPath, mod] of Object.entries(docEntryModules)) {
  const file = fileNameOf(globPath);
  if (file === 'index.json') continue;
  entriesByFile[file] = mod;
}

/** Ordered list of documented components as declared by the manifest. */
export function getDocumentedComponents(): ManifestComponent[] {
  const manifest = getDocsManifest();
  if (!manifest) return [];
  // Only surface entries whose JSON is actually present.
  return manifest.components.filter((c) => entriesByFile[c.entry]);
}

/** Load a single component's generated documentation entry by name. */
export function getComponentDoc(name: string): ComponentDocEntry | null {
  const manifest = getDocsManifest();
  if (manifest) {
    const match = manifest.components.find((c) => c.name === name);
    if (match && entriesByFile[match.entry]) return entriesByFile[match.entry];
  }
  // Fallback: derive the entry filename from the component name.
  return entriesByFile[`${name}.json`] ?? null;
}

/** Components discovered by the generator but reported as undocumented. */
export function getUndocumentedComponents(): UndocumentedComponent[] {
  return getDocsManifest()?.undocumented ?? [];
}
