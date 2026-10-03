/**
 * Holds the `plugin-root` rule in scripts/check-conformance.mjs to what it
 * claims.
 *
 * The repo root ships as the bestax plugin, so a conventional component path
 * added there for contributor tooling would reach every plugin user. None
 * exists today, so a real run executes no violation branch, and an inverted
 * rule would stay green. The fixtures below are what catch that.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ROOT_PLUGIN_COMPONENT_PATHS,
  rootPluginComponentViolations,
} from './check-conformance.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));

// --- conventional component paths at the root --------------------------------

test('the real repo root holds no plugin component path it should not', () => {
  assert.deepEqual(rootPluginComponentViolations(readdirSync(REPO)), []);
});

test('each conventional component path at the root is reported by name', () => {
  // What the plugin is made of, plus contributor tooling where it belongs.
  const fine = [
    '.claude',
    '.claude-plugin',
    'skills',
    'mcp.json',
    'plugin.json',
    'CLAUDE.md',
    'scripts',
  ];
  assert.deepEqual(rootPluginComponentViolations(fine), []);
  for (const path of ROOT_PLUGIN_COMPONENT_PATHS) {
    const found = rootPluginComponentViolations([
      ...fine,
      path.replace(/\/$/, ''),
    ]);
    assert.equal(found.length, 1, `${path}: ${found.join('\n')}`);
    assert.ok(found[0].startsWith(`${path} at the repo root `), found[0]);
    assert.match(found[0], /every user of the bestax plugin/);
    assert.match(found[0], /under \.claude\/ instead/);
  }
});

test('the list covers the paths Claude Code and Cursor load by convention', () => {
  // Claude Code's standard layout, minus skills/ and the manifest folder,
  // plus Cursor's rules/. A path dropped from the list would stop failing.
  for (const path of [
    'agents/',
    'bin/',
    'commands/',
    'hooks/',
    'monitors/',
    'output-styles/',
    'themes/',
    'workflows/',
    '.lsp.json',
    '.mcp.json',
    'settings.json',
    'rules/',
  ]) {
    assert.ok(ROOT_PLUGIN_COMPONENT_PATHS.includes(path), path);
  }
  // The plugin's own parts must never be on it, or the rule could not pass.
  for (const own of ['skills/', '.claude-plugin/', 'mcp.json', 'plugin.json']) {
    assert.ok(!ROOT_PLUGIN_COMPONENT_PATHS.includes(own), own);
  }
});

test('root CLAUDE.md names only paths the rule enforces', () => {
  const text = readFileSync(new URL('../CLAUDE.md', import.meta.url), 'utf8');
  const sentence = text.match(/So a top-level ([\s\S]*?)\s+would ship/);
  assert.ok(sentence, 'the "So a top-level … would ship" sentence moved');
  const named = [...sentence[1].matchAll(/`([^`]+)`/g)].map(m => m[1]);
  assert.ok(named.length > 0, sentence[1]);
  for (const path of named) {
    assert.ok(ROOT_PLUGIN_COMPONENT_PATHS.includes(path), path);
  }
});
