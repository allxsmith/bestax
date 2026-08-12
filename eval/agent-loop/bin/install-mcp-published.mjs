#!/usr/bin/env node
// install-mcp-published.mjs — post-scaffold hook for run-iteration.sh: point the scaffolded
// app at the PUBLISHED bestax-mcp from the npm registry.
//
//   bin/run-iteration.sh <id> <brief> <work> --post-scaffold bin/install-mcp-published.mjs
//
// The sibling hook (install-mcp.mjs) measures the working tree. This one measures what a
// user actually gets from `npx bestax-mcp`, which is a different question and only became
// answerable once the package existed on npm: the tarball is assembled by `files` +
// prepack, so it can differ from the tree in ways no test in this repo observes — most
// sharply `data/skills/`, which is gitignored and synced at pack time.
//
// Pinned by default rather than floating on @latest, because a run has to stay
// attributable to one artifact; override with BESTAX_MCP_VERSION.
//
// The install lands in a sibling directory, NOT the app: adding a dependency the real user
// would not have to the app's package.json would put it in the baseline snapshot and in
// every diff taken against it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const VERSION = process.env.BESTAX_MCP_VERSION ?? '1.0.0';

const app = process.argv[2];
if (!app) {
  console.error('usage: install-mcp-published.mjs <app-dir>');
  process.exit(1);
}
if (!existsSync(app)) {
  console.error(`install-mcp-published: app dir does not exist: ${app}`);
  process.exit(1);
}

const home = resolve(app, '..', 'mcp-server');
mkdirSync(home, { recursive: true });
writeFileSync(
  join(home, 'package.json'),
  JSON.stringify(
    { name: 'bestax-mcp-under-test', private: true, version: '0.0.0' },
    null,
    2
  ) + '\n'
);

// npm, not pnpm: the workspace's minimumReleaseAge cooldown would refuse a version
// published in the last three days, which is exactly the version a validation run wants.
console.log(
  `install-mcp-published: installing bestax-mcp@${VERSION} from the registry`
);
execFileSync(
  'npm',
  ['install', `bestax-mcp@${VERSION}`, '--no-audit', '--no-fund'],
  {
    cwd: home,
    stdio: 'inherit',
  }
);

const pkgRoot = join(home, 'node_modules', 'bestax-mcp');
const SERVER = join(pkgRoot, 'dist', 'index.js');

// Same fail-loud contract as the local hook: a server that never connects is
// indistinguishable in the transcript from one the builder chose not to call, and that is
// the single distinction the run exists to make. The skills check is the one that matters
// here — it is the part of the payload that only exists because prepack ran.
for (const [what, path] of [
  ['server build', SERVER],
  ['component index', join(pkgRoot, 'data', 'catalog.json')],
  ['skills manifest', join(pkgRoot, 'data', 'skills.json')],
  ['skill bodies', join(pkgRoot, 'data', 'skills')],
]) {
  if (!existsSync(path)) {
    console.error(
      `install-mcp-published: missing ${what} in the published tarball: ${path}`
    );
    process.exit(1);
  }
}

const installed = JSON.parse(
  readFileSync(join(pkgRoot, 'package.json'), 'utf8')
).version;
if (installed !== VERSION) {
  console.error(
    `install-mcp-published: wanted ${VERSION}, resolved ${installed}`
  );
  process.exit(1);
}

writeFileSync(
  join(app, '.mcp.json'),
  JSON.stringify(
    { mcpServers: { bestax: { command: process.execPath, args: [SERVER] } } },
    null,
    2
  ) + '\n'
);
console.log(
  `install-mcp-published: wrote ${join(app, '.mcp.json')} -> bestax-mcp@${installed}`
);
