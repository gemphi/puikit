// Removes the v1 (agents cockpit) files left in app/phiegg after unzipping.
// The full v1 app is preserved in app/phiegg-v1. Safe to run more than once.
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
for (const p of ["src/components","src/state","src/types","src/pages/AgentsPage.tsx","src/pages/DocsPage.tsx","src/pages/GovernancePage.tsx","src/pages/OntologyPage.tsx","src/pages/OrchestrationPage.tsx","src/pages/SpatialPage.tsx","src/pages/StreamsPage.tsx"]) rmSync(join(here, p), { recursive: true, force: true });
console.log('phiegg: v1 leftovers removed (kept in app/phiegg-v1).');
