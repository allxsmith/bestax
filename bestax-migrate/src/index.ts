#!/usr/bin/env node

/**
 * bin entry for bestax-migrate. Keep this thin — the program lives in cli.ts
 * so tests can drive it without spawning a process.
 */

// The version guard runs before anything is imported and uses no dependency of
// its own: import declarations are hoisted and evaluated before any statement
// here, and chalk >= 6 requires a Node this guard is meant to reject. A static
// import would fail to load first and replace the message below with an opaque
// loader error.
export {};

const [major] = process.versions.node.split('.').map(Number);
if (major < 22) {
  console.error(
    `bestax-migrate requires Node 22 or newer (found ${process.versions.node}).`
  );
  process.exit(1);
}

const { createCLI } = await import('./cli.js');

createCLI().parse();
