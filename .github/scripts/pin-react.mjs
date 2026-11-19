// Pin the React family to a single major across every workspace manifest, so
// `pnpm install` resolves a consistent tree for the React 18/19 compatibility
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
  for (const name of pkgs) {
    const targets = sections.filter(section => json[section]?.[name]);
    // A package that declares React only as a peer (bulma-ui) gets it as a
    // devDependency too. Without one, the install keeps the lockfile's
    // resolution of the peer, which the peer range still admits, and the
    // package goes on testing the other major (#1099). The job's tree is
    // never committed.
    if (targets.length === 0 && json.peerDependencies?.[name]) {
      targets.push('devDependencies');
    }
    for (const section of targets) {
      json[section] = { ...json[section], [name]: `^${major}` };
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    console.log(`pinned react@${major} family in ${file}`);
  }
}
