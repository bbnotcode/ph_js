// Run only after validation in the main-branch compatibility sync job.
const { execFileSync, spawnSync } = require('node:child_process');
const targets = Object.values(require('./library-aliases.json')).flat();
function git(...args) { return execFileSync('git', args, { stdio: 'inherit' }); }
if (process.env.GITHUB_EVENT_NAME !== 'push' || process.env.GITHUB_REF !== 'refs/heads/main') {
  throw new Error('Compatibility commits are limited to main-branch push workflows');
}
const diff = spawnSync('git', ['diff', '--quiet', '--', ...targets]);
if (diff.status === 0) {
  console.log('Compatibility paths already synchronized.');
} else {
  if (diff.status !== 1) throw new Error('Could not inspect compatibility copies');
  git('diff', '--check');
  git('config', 'user.name', 'github-actions[bot]');
  git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
  git('add', '--', ...targets);
  git('commit', '-m', 'Sync compatibility library download paths');
  git('push', 'origin', 'HEAD:refs/heads/main');
}
