#!/usr/bin/env node

import { createCLI } from './cli.js';
import chalk from 'chalk';

// Check Node.js version requirement (Breaking change for v2.0.0)
const currentNodeVersion = process.versions.node;
const majorVersion = parseInt(currentNodeVersion.split('.')[0], 10);
const MINIMUM_NODE_VERSION = 18;

if (majorVersion < MINIMUM_NODE_VERSION) {
  console.error(
    chalk.red(
      `Error: create-bestax requires Node.js v${MINIMUM_NODE_VERSION}.0.0 or higher.\n` +
      `You are currently running Node.js v${currentNodeVersion}.\n` +
      `Please upgrade your Node.js version.`
    )
  );
  process.exit(1);
}

const program = createCLI();
program.parse();
