#!/usr/bin/env node
// A guard for coding agents (Claude Code PreToolUse hook on Bash, .claude/settings.json). It reads the tool call on
// stdin and:
//   - refuses staging everything at once (git add -A / --all / . / *, git commit -a / --all): stage files by name
//   - refuses force pushes and history rewrites unless the person asked (they run it themselves)
//   - asks the person before any git push
// Anything else passes untouched.
let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = String(JSON.parse(raw).tool_input?.command ?? ''); } catch { return; }
  // Each part of a chained command on its own (a && b ; c | d).
  const parts = cmd.split(/&&|\|\||;|\|/).map((p) => p.trim());
  const git = (p, verb) => new RegExp(`(^|\\s)git(\\s+-[cC]\\s+\\S+)*\\s+${verb}(\\s|$)`).test(p);
  const say = (decision, reason) => {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } }));
    process.exit(0);
  };
  for (const p of parts) {
    if (git(p, 'add') && /\s(-A|--all|\.|\*|:\/)(\s|$)/.test(p)) say('deny', 'Staging everything is not allowed here: stage the files by name (git add <file> ...), then check `git diff --cached --name-only` before committing.');
    if (git(p, 'commit') && /\s(-a|--all|-[a-zA-Z]*a[a-zA-Z]*)(\s|$)/.test(p) && !/\s--amend/.test(p)) say('deny', 'git commit -a stages every changed file: stage the files by name instead.');
    if (git(p, 'push') && /\s(-f|--force|--force-with-lease\S*|\+\S+)(\s|$)/.test(p)) say('deny', 'Force pushes rewrite shared history: only the person runs them, on their own say.');
    if (git(p, '(filter-branch|filter-repo)') || (git(p, 'reset') && /--hard/.test(p))) say('deny', 'Rewriting history or discarding work is for the person to run, not the agent.');
    if (git(p, 'push')) say('ask', 'A push publishes this branch: confirm it was asked for in this round.');
  }
});
