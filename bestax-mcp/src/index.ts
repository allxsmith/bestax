#!/usr/bin/env node
/**
 * stdio entry point.
 *
 * Nothing may be written to stdout except JSON-RPC frames — stdout IS the
 * transport, and a stray console.log corrupts the stream in a way that
 * surfaces to the user as an unexplained disconnect. Diagnostics go to stderr.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  process.stderr.write(
    `bestax-mcp: ${err instanceof Error ? err.message : String(err)}\n`
  );
  process.exit(1);
});
