#!/usr/bin/env node

/**
 * bin entry for bestax-migrate. Keep this thin — the program lives in cli.ts
 * so tests can drive it without spawning a process.
 */

import { createCLI } from './cli.js';

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(
    `bestax-migrate requires Node 18 or newer (found ${process.versions.node}).`
  );
  process.exit(1);
}

createCLI().parse();
