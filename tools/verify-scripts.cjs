const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let checked = 0;
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.wrangler') continue;
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:js|cjs)$/.test(file)) {
      if (fs.readFileSync(file, 'utf8').startsWith('FWENC2\n')) continue;
      const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr);
      checked++;
    }
  }
}
walk(root);
const contracts = require('./library-contracts.json');
for (const [file, expected] of Object.entries(contracts)) {
  const context = vm.createContext({ console: { log() {}, warn() {}, error() {} }, URL, URLSearchParams, TextDecoder, TextEncoder, Buffer, atob, btoa,
    module: { exports: {} }, Widget: {}, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file, timeout: 2000 });
  const manifest = vm.runInContext('getManifest()', context, { timeout: 2000 });
  if (manifest.id !== expected.id) throw new Error(`${file}: imported library ID changed`);
  for (const name of expected.parameters) {
    if (!(manifest.parameters || []).some(parameter => parameter.name === name)) throw new Error(`${file}: existing parameter ${name} disappeared`);
  }
  if (!manifest.version) throw new Error(`${file}: missing version`);
  for (const name of expected.entryPoints) {
    if (typeof context[name] !== 'function') throw new Error(`${file}: missing ${name}`);
  }
}
console.log(`Syntax checked ${checked} ordinary scripts; ${Object.keys(contracts).length} library contracts passed.`);
