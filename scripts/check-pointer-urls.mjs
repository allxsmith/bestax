#!/usr/bin/env node
// Verify that every URL in the agent-discovery pointer files shipped in the
// bestax-bulma tarball (issue #344) still resolves, so a release can't ship
// dead links to the docs site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FILES = ['bulma-ui/llms.txt', 'bulma-ui/AGENTS.md'];

const urls = new Set();
for (const rel of FILES) {
  const text = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  for (const match of text.matchAll(/https:\/\/[^\s)`]+/g)) {
    urls.add(match[0].replace(/[.,]$/, ''));
  }
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return null;
      if (method === 'GET') return `${res.status} ${res.statusText}`;
    } catch (err) {
      if (method === 'GET') return err.cause?.message ?? err.message;
    }
  }
  return 'unreachable';
}

const failures = [];
for (const url of [...urls].sort()) {
  const problem = await check(url);
  if (problem) {
    failures.push(`  ${url} — ${problem}`);
    console.error(`[check-pointer-urls] FAIL ${url} (${problem})`);
  } else {
    console.log(`[check-pointer-urls] ok   ${url}`);
  }
}

if (failures.length > 0) {
  console.error(
    `[check-pointer-urls] ${failures.length} URL(s) in ${FILES.join(', ')} did not resolve:\n` +
      failures.join('\n')
  );
  process.exit(1);
}
console.log(`[check-pointer-urls] all ${urls.size} URLs resolve`);
