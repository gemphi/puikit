/** Every path on uaiagency.org, in one place. */
export const routes = {
  home: () => '/',
  about: () => '/about',
  mission: () => '/mission',
  governance: () => '/governance',
  leadership: () => '/leadership',
  framework: () => '/framework',
  evaluations: () => '/evaluations',
  certification: () => '/certification',
  standards: () => '/standards',
  partnerships: () => '/partnerships',
  newsroom: () => '/newsroom',
  research: () => '/research',
  policy: () => '/policy',
  careers: () => '/careers',
  contact: () => '/contact',
  legal: () => '/legal',
} as const;

export const href = (path: string): string => `#${path}`;

export const EMAILS = {
  info: 'info@uaiagency.org',
  hello: 'hello@uaiagency.org',
  press: 'press@uaiagency.org',
  standards: 'standards@uaiagency.org',
  certification: 'certification@uaiagency.org',
  careers: 'careers@uaiagency.org',
  legal: 'legal@uaiagency.org',
  incidents: 'incidents@uaiagency.org',
} as const;

export const FOUNDED = '11 September 2026';
