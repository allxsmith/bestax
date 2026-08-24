#!/usr/bin/env node

// The version guard deliberately runs before anything else is imported, and
// deliberately does not use chalk. `import` declarations are hoisted and
// evaluated before any statement in this module, and chalk >= 6 itself
// requires Node >= 22 — so a static import would fail to load on exactly the
// runtimes this guard exists to catch, replacing the message below with an
// opaque loader error. ./cli.js is pulled in dynamically for the same reason.
const currentNodeVersion = process.versions.node;
const majorVersion = parseInt(currentNodeVersion.split('.')[0], 10);
const MINIMUM_NODE_VERSION = 22;

if (majorVersion < MINIMUM_NODE_VERSION) {
  console.error(
    `Error: create-bestax requires Node.js v${MINIMUM_NODE_VERSION}.0.0 or higher.\n` +
      `You are currently running Node.js v${currentNodeVersion}.\n` +
      `Please upgrade your Node.js version.`
  );
  process.exit(1);
}

// Marks this file as a module. With every import now dynamic there is no
// static import left to do it, and top-level await requires a module.
export {};

const { createCLI } = await import('./cli.js');

await createCLI().parseAsync(process.argv);
