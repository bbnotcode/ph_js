const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const aliases = require('./library-aliases.json');
const check = process.argv.includes('--check');
let failures = 0;
for (const [source, targets] of Object.entries(aliases)) {
  if (path.basename(source) !== source || !source.endsWith('.js')) throw new Error('Invalid maintained source path');
  const content = fs.readFileSync(path.join(root, source));
  for (const target of targets) {
    if (path.basename(target) !== target || !target.endsWith('.js')) throw new Error('Invalid compatibility path');
    const file = path.join(root, target);
    if (check) {
      if (!fs.existsSync(file) || !content.equals(fs.readFileSync(file))) {
        console.error(`Compatibility copy is stale: ${target} (source: ${source})`);
        failures++;
      }
    } else {
      fs.writeFileSync(file, content);
      console.log(`Synced: ${target} <- ${source}`);
    }
  }
}
if (failures) process.exitCode = 1;
else if (check) console.log('All compatibility copies match their maintained source.');
