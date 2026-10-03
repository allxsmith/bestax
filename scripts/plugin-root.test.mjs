/**
 * Holds the `plugin-root` rule in scripts/check-conformance.mjs to what it
 * claims.
 *
 * The repo root ships as the bestax plugin, so a conventional component path
 * added there for contributor tooling would reach every plugin user. None
 * exists today, so a real run executes no violation branch, and an inverted
 * rule would stay green. The fixtures below are what catch that.
 *
 * The same goes for the plugin's bestax-mcp pin: it matches bestax-mcp's
 * major until a new major ships, so only fixtures reach the failing branches.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ROOT_PLUGIN_COMPONENT_PATHS,
  rootPluginComponentViolations,
  PLUGIN_MCP,
  pluginMcpPinViolations,
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

// --- the bestax-mcp major mcp.json pins ----------------------------------------

const repoFile = rel =>
  readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

/** An mcp.json whose bestax server runs `args`, as the plugin's does. */
const mcpWith = args =>
  JSON.stringify({
    mcpServers: {
      [PLUGIN_MCP.server]: { type: 'stdio', command: 'npx', args },
    },
  });
const pkgAt = version => JSON.stringify({ name: 'bestax-mcp', version });

const only = (mcpText, pkgText, re) => {
  const found = pluginMcpPinViolations(mcpText, pkgText);
  assert.equal(found.length, 1, found.join('\n'));
  assert.match(found[0], re);
  return found[0];
};

test('the real mcp.json pins bestax-mcp at its current major', () => {
  assert.deepEqual(
    pluginMcpPinViolations(repoFile(PLUGIN_MCP.file), repoFile(PLUGIN_MCP.pkg)),
    []
  );
  // And the real pin is a bare major, so the test above checked something.
  const { major } = /^(?<major>\d+)\./.exec(
    JSON.parse(repoFile(PLUGIN_MCP.pkg)).version
  ).groups;
  assert.ok(repoFile(PLUGIN_MCP.file).includes(`"bestax-mcp@${major}"`));
});

test('a pin on the current major passes, whatever the minor', () => {
  for (const [version, pin] of [
    ['1.14.0', 'bestax-mcp@1'],
    ['2.0.0', 'bestax-mcp@2'],
    ['0.3.1', 'bestax-mcp@0'],
    ['10.2.3', 'bestax-mcp@10'],
  ]) {
    assert.deepEqual(
      pluginMcpPinViolations(mcpWith(['-y', pin]), pkgAt(version)),
      [],
      `${pin} at ${version}`
    );
  }
});

test('a new bestax-mcp major fails until mcp.json and the docs move', () => {
  const message = only(
    mcpWith(['-y', 'bestax-mcp@1']),
    pkgAt('2.0.0'),
    /^mcp\.json: starts bestax-mcp@1, but bestax-mcp\/package\.json is at 2\.0\.0\./
  );
  assert.match(message, /Change it to bestax-mcp@2/);
  assert.match(message, /git grep -n "bestax-mcp@1"/);
  assert.match(message, /What goes stale/);
  // A pin AHEAD of the package fails too: npx would find no such release.
  only(
    mcpWith(['-y', 'bestax-mcp@3']),
    pkgAt('2.4.0'),
    /Change it to bestax-mcp@2/
  );
  // Digits compare as a whole, not as a prefix.
  only(mcpWith(['-y', 'bestax-mcp@1']), pkgAt('10.0.0'), /bestax-mcp@10/);
});

test('a pin that is not a bare major fails', () => {
  for (const pin of [
    'bestax-mcp@latest',
    'bestax-mcp@1.14.0',
    'bestax-mcp@^1',
    'bestax-mcp@1.x',
    'bestax-mcp@',
  ]) {
    only(
      mcpWith(['-y', pin]),
      pkgAt('1.14.0'),
      /which is not a major pin\. Use bestax-mcp@1/
    );
  }
});

test('an mcp.json that runs no bestax-mcp pin fails', () => {
  for (const mcpText of [
    mcpWith(['-y', 'bestax-mcp']),
    mcpWith(['-y', 'some-other-server@1']),
    mcpWith('bestax-mcp@1'),
    JSON.stringify({ mcpServers: { other: { args: ['-y', 'bestax-mcp@1'] } } }),
    JSON.stringify({ mcpServers: null }),
    JSON.stringify({}),
  ]) {
    only(
      mcpText,
      pkgAt('1.14.0'),
      /runs no bestax-mcp@<major>\. .*"bestax-mcp@1"/
    );
  }
});

test('an unreadable or broken mcp.json or bestax-mcp manifest is reported', () => {
  const pin = mcpWith(['-y', 'bestax-mcp@1']);
  for (const [text, problem] of [
    [undefined, 'could not be read'],
    ['{', 'is not valid JSON'],
    ['null', 'is not a JSON object'],
    ['[]', 'is not a JSON object'],
  ]) {
    only(
      text,
      pkgAt('1.14.0'),
      new RegExp(`^mcp\\.json: ${problem}, so the plugin starts no MCP server`)
    );
    only(
      pin,
      text,
      new RegExp(
        `^bestax-mcp/package\\.json: ${problem}, so the bestax-mcp pin`
      )
    );
  }
  for (const version of [undefined, 1, '1.0', 'v1.0.0', '01.0.0']) {
    only(pin, pkgAt(version), /"version" is .*, not a semantic version/);
  }
});
