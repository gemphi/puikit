import en from './en.json';

/**
 * Copy for the storefront.
 *
 * Every user-visible string lives in `en.json` and is read through `t`. No
 * component is allowed to hold a literal — that is what makes the app
 * translatable, and what stops copy decisions from hiding inside JSX.
 */
export const t = en;

/**
 * Interpolate `{name}` placeholders.
 *
 * `format(t.account.greeting, { name: 'Riya' })` -> `Hello, Riya`
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

/** Pick the singular or plural form and interpolate `{count}`. */
export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : format(many, { count });
}
