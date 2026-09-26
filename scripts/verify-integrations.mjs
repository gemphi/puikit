/**
 * Integration verification harness (Requirement 15).
 *
 * Builds/type-checks each Consuming_App against the *updated* puijs and reports a
 * per-app pass/fail summary. The run NEVER aborts when one app fails or is
 * missing: every configured app is attempted, its stdout/stderr and exit status
 * are captured, and a summary table is printed at the end.
 *
 * This is kit-agnostic tooling (no UI-kit imports), consistent with the
 * "One UI Kit Per App" steering rule.
 *
 * Usage:
 *   node scripts/verify-integrations.mjs           # verify all configured apps
 *   node scripts/verify-integrations.mjs phient    # verify only matching app(s)
 *
 * Exit status:
 *   0  when every *found* app passed (missing/skipped apps do not fail the run)
 *   1  when at least one found app failed its verification
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// puijs package root (parent of scripts/).
const PUIJS_ROOT = path.resolve(__dirname, '..');
// Workspace root that holds the sibling app directories.
const WORKSPACE_ROOT = path.resolve(PUIJS_ROOT, '..');

// -----------------------------------------------------------------------------
// Declarative Consuming_App list. Edit here to add/remove apps.
//
// Each entry:
//   name    - human-readable identifier used in the summary.
//   dir     - path to the app, relative to the workspace root.
//   command - npm/npx executable to run (defaults to "npm").
//   args    - args passed to the command. Defaults to running the "typecheck"
//             script, which every consuming app declares as `tsc --noEmit`.
//
// The list degrades gracefully: if an app's directory is absent it is reported
// as "skipped", not crashed. In-scope for verification per Requirement 15:
// phixum/web and phient/web (primary), phiano/web and @phiace/phidoc (additional).
// -----------------------------------------------------------------------------
const CONSUMING_APPS = [
  { name: 'phixum/web', dir: 'phixum/web', args: ['run', 'typecheck'] },
  { name: 'phient/web', dir: 'phient/web', args: ['run', 'typecheck'] },
  { name: 'phiano/web', dir: 'phiano/web', args: ['run', 'typecheck'] },
  { name: '@phiace/phidoc', dir: 'phidoc', args: ['run', 'typecheck'] },
];

const DEFAULT_COMMAND = 'npm';

// Statuses
const PASS = 'pass';
const FAIL = 'fail';
const SKIP = 'skip';

function log(...parts) {
  process.stdout.write(parts.join(' ') + '\n');
}

/** Optional CLI filter: only verify apps whose name/dir contains a given token. */
function filterApps(apps, argv) {
  const filters = argv.slice(2).filter((a) => !a.startsWith('-'));
  if (filters.length === 0) return apps;
  return apps.filter((app) =>
    filters.some(
      (f) => app.name.includes(f) || app.dir.includes(f),
    ),
  );
}

/** True when `dir` exists and is a directory holding a package.json. */
function appIsPresent(absDir) {
  try {
    if (!existsSync(absDir) || !statSync(absDir).isDirectory()) return false;
    return existsSync(path.join(absDir, 'package.json'));
  } catch {
    return false;
  }
}

/** Run a single app's verification, capturing output and never throwing. */
function verifyApp(app) {
  const absDir = path.resolve(WORKSPACE_ROOT, app.dir);
  const command = app.command ?? DEFAULT_COMMAND;
  const args = app.args ?? ['run', 'typecheck'];
  const label = `${command} ${args.join(' ')}`;
  // npm resolves to npm.cmd on Windows, which requires a shell to execute. The
  // command/args are static and trusted (declared in CONSUMING_APPS above, never
  // user-derived), so running the joined string through a shell is safe here.
  const useShell = process.platform === 'win32';
  const spawnCommand = useShell ? label : command;
  const spawnArgs = useShell ? [] : args;

  if (!appIsPresent(absDir)) {
    log(`\n[skip] ${app.name} — not found at ${absDir}`);
    return {
      name: app.name,
      dir: app.dir,
      status: SKIP,
      code: null,
      detail: `App directory or package.json not found (${absDir}).`,
    };
  }

  log(`\n[run ] ${app.name} — ${label} (cwd: ${absDir})`);

  let result;
  try {
    result = spawnSync(spawnCommand, spawnArgs, {
      cwd: absDir,
      encoding: 'utf8',
      shell: useShell, // required to resolve npm.cmd on Windows
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    // Never let one app abort the whole run.
    return {
      name: app.name,
      dir: app.dir,
      status: FAIL,
      code: null,
      detail: `Failed to spawn "${label}": ${err?.message ?? String(err)}`,
    };
  }

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';

  if (result.error) {
    return {
      name: app.name,
      dir: app.dir,
      status: FAIL,
      code: result.status,
      detail: `Process error: ${result.error.message}`,
      stdout,
      stderr,
    };
  }

  const passed = result.status === 0;
  if (passed) {
    log(`[ ok ] ${app.name} — verification passed`);
  } else {
    log(`[fail] ${app.name} — exited with code ${result.status}`);
  }

  return {
    name: app.name,
    dir: app.dir,
    status: passed ? PASS : FAIL,
    code: result.status,
    detail: passed
      ? 'Type-check/build completed without errors.'
      : firstMeaningfulLines(stderr || stdout),
    stdout,
    stderr,
  };
}

/** Extract the first few informative lines of output for the summary detail. */
function firstMeaningfulLines(text, max = 8) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return 'Verification failed (no output captured).';
  const head = lines.slice(0, max);
  if (lines.length > max) head.push(`… (+${lines.length - max} more lines)`);
  return head.join('\n');
}

function printSummary(results) {
  const bar = '─'.repeat(64);
  log('\n' + bar);
  log('Integration Verification Summary');
  log(bar);

  const icon = { [PASS]: 'PASS', [FAIL]: 'FAIL', [SKIP]: 'SKIP' };
  for (const r of results) {
    const codePart = r.code === null || r.code === undefined ? '' : ` (exit ${r.code})`;
    log(`  [${icon[r.status]}] ${r.name}${codePart}`);
  }

  // Detail for anything that is not a clean pass.
  const notPassed = results.filter((r) => r.status !== PASS);
  if (notPassed.length > 0) {
    log('\nDetails:');
    for (const r of notPassed) {
      log(`\n  • ${r.name} [${icon[r.status]}]`);
      for (const line of String(r.detail).split('\n')) {
        log(`      ${line}`);
      }
    }
  }

  const passed = results.filter((r) => r.status === PASS).length;
  const failed = results.filter((r) => r.status === FAIL).length;
  const skipped = results.filter((r) => r.status === SKIP).length;
  log('\n' + bar);
  log(`  ${passed} passed · ${failed} failed · ${skipped} skipped · ${results.length} total`);
  log(bar + '\n');

  return { passed, failed, skipped };
}

function main() {
  const apps = filterApps(CONSUMING_APPS, process.argv);

  log('Verifying puijs integration against consuming apps…');
  log(`  puijs root:     ${PUIJS_ROOT}`);
  log(`  workspace root: ${WORKSPACE_ROOT}`);
  log(`  apps in scope:  ${apps.map((a) => a.name).join(', ') || '(none)'}`);

  const results = [];
  for (const app of apps) {
    // Each app is isolated; a throw/failure in one does not stop the loop.
    results.push(verifyApp(app));
  }

  const { failed } = printSummary(results);

  // Missing apps (skipped) do NOT fail the run; only found-and-failed apps do.
  process.exitCode = failed > 0 ? 1 : 0;
}

main();
