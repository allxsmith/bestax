// Pin the React family to a single major across every workspace manifest, so
// `npm install` resolves a consistent tree for the React 18/19 compatibility
// matrix (see .github/workflows/ci.yml). Usage: node .github/scripts/pin-react.mjs 18
import { readFileSync, writeFileSync } from 'node:fs';

const major = process.argv[2];
if (!/^\d+$/.test(major || '')) {
  console.error('Usage: node .github/scripts/pin-react.mjs <major>  (e.g. 18)');
  process.exit(1);
}

const manifests = [
  'package.json',
  'bulma-ui/package.json',
  'docs/package.json',
  'create-bestax/package.json',
];
// Only rewrite direct version pins, never bulma-ui's peerDependencies range
// (that range intentionally spans the supported React majors, 18–19). We pin only the runtime
// packages — the @types/* peer-couple to each other and the runtime matrix is
// about runtime behavior; types are already checked in the main build job.
const sections = ['dependencies', 'devDependencies'];
const pkgs = ['react', 'react-dom'];

for (const file of manifests) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  let changed = false;
  for (const section of sections) {
    for (const name of pkgs) {
      if (json[section]?.[name]) {
        json[section][name] = `^${major}`;
        changed = true;
      }
    }
  }
  if (changed) {
    writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    console.log(`pinned react@${major} family in ${file}`);
  }
}
