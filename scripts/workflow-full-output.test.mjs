/**
 * Keeps `show_full_output` off in the Claude jobs listed in `UNTRUSTED_TEXT`.
 * Each reads text anyone can write and runs no repository code, so a full
 * transcript in its job log was only ever a debugging aid.
 *
 * `Read` is always available to a session and is not confined to the
 * workspace, so an injected session can put the OAuth token, encoded or split
 * across calls, into a tool result. `show_full_output: true` writes every tool
 * result to the job log, which is public on this repository, and no later
 * credential check can take it back: those checks guard the comment or draft,
 * a different sink. ai-triage.yml turned it off after #317 for this reason.
 * This test holds each job below to that, so a debugging change can't quietly
 * turn it back on. It reads the workflows with the conformance check's YAML
 * reader, as the other workflow tests do.
 *
 * It does not cover every session that reads text other people write.
 * bestaxbot-reply.yml's `respond`, claude-implement.yml's `implement` and
 * claude-pr-loop.yml's `fix` and `verify` still turn full output on, and each
 * says why above the setting: the job log is where a blocked tool call or
 * commit gets diagnosed. Whether to give that up there is a separate decision,
 * so this test leaves them alone.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  yamlGet,
  yamlItems,
  yamlMap,
  yamlScalar,
} from './check-conformance.mjs';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORKFLOWS = path.join(repoRoot, '.github', 'workflows');

const ACTION = 'anthropics/claude-code-action@';

/** Jobs that read text anyone can write and run no repository code. */
const UNTRUSTED_TEXT = [
  ['ai-scan.yml', 'scan'],
  ['ai-triage.yml', 'triage'],
  ['claude-repro.yml', 'author'],
];

const scalar = (map, key) => yamlScalar(map.get(key) ?? null);

/** Each claude-code-action step in a job, as its `with:` inputs. */
function actionInputs(file, jobId) {
  const lines = fs
    .readFileSync(path.join(WORKFLOWS, file), 'utf8')
    .split(/\r?\n/);
  const job = yamlMap(yamlGet(lines, 'jobs')?.lines ?? []).get(jobId);
  assert.ok(job, `${file} has no job "${jobId}"`);
  return yamlItems(yamlGet(job.lines, 'steps')?.lines ?? [])
    .map(yamlMap)
    .filter(step => (scalar(step, 'uses') ?? '').startsWith(ACTION))
    .map(step => yamlMap(step.get('with')?.lines ?? []));
}

test('each job that reads text anyone can write runs claude-code-action', () => {
  for (const [file, job] of UNTRUSTED_TEXT) {
    assert.ok(
      actionInputs(file, job).length > 0,
      `${file}:${job} no longer runs ${ACTION}, so drop it from this list`
    );
  }
});

test('none of them turns show_full_output on', () => {
  for (const [file, job] of UNTRUSTED_TEXT) {
    for (const inputs of actionInputs(file, job)) {
      const value = scalar(inputs, 'show_full_output');
      assert.ok(
        value === null || value === 'false',
        `${file}:${job} sets show_full_output to ${value}`
      );
    }
  }
});
