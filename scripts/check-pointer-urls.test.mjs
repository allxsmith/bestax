/**
 * Tests for the pointer-URL gate and its retry helper (#525).
 *
 * Everything here is about what happens when the network misbehaves, so every
 * test stubs `globalThis.fetch` (the pattern from
 * check-security-txt-expiry.test.mjs). Nothing touches the live hosts — that
 * would reintroduce the flakiness this is meant to remove.
 *
 * The stub deliberately THROWS when its queue underflows. An earlier version
 * returned a free 200, which meant a regression that fetched twice, or retried
 * something it should not have, still passed every assertion.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  classifyStatus,
  fetchWithRetry,
  retryAfterMs,
  DEFAULT_ATTEMPTS,
  MAX_RETRY_AFTER_MS,
} from './lib/fetch-retry.mjs';
import {
  extractUrls,
  githubApiUrl,
  checkUrl,
  hostsOf,
  formatUndetermined,
  formatDead,
  main,
  FILES,
} from './check-pointer-urls.mjs';

const NO_WAIT = { backoffMs: [0, 0] };

function stubFetch(queue) {
  const calls = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: init.headers,
    });
    if (queue.length === 0) {
      throw new Error(
        `unexpected request #${calls.length}: ${init.method} ${url}`
      );
    }
    const next = queue.shift();
    if (next.throw) throw new Error(next.throw);
    return {
      status: next.status,
      statusText: next.statusText ?? '',
      headers: { get: h => next.headers?.[h.toLowerCase()] ?? null },
      text: async () => next.body ?? '',
    };
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = real;
    },
  };
}

/** Enough queue entries for a full HEAD+GET x attempts sweep. */
const all = entry => Array.from({ length: DEFAULT_ATTEMPTS * 2 }, () => entry);

/**
 * A stub keyed by URL rather than by call order.
 *
 * `main` checks URLs concurrently, so a positional queue would silently encode
 * the scheduling order of Promise.all — the tests would still pass, but they
 * would be asserting against an implementation detail rather than behaviour,
 * and would break confusingly the first time concurrency changed. Routes are
 * matched by substring, **first match wins in insertion order**, so a specific
 * override must be listed before the general route it narrows. An unmatched or
 * exhausted route throws rather than handing back a free 200.
 */
function stubFetchByUrl(routes) {
  const calls = [];
  const real = globalThis.fetch;
  const pending = new Map(Object.entries(routes).map(([k, v]) => [k, [...v]]));
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({ url: target, method: init.method });
    const key = [...pending.keys()].find(k => target.includes(k));
    if (key === undefined) throw new Error(`unrouted request: ${target}`);
    const queue = pending.get(key);
    if (queue.length === 0)
      throw new Error(`route ${key} exhausted by ${target}`);
    const next = queue.shift();
    if (next.throw) throw new Error(next.throw);
    return {
      status: next.status,
      statusText: next.statusText ?? '',
      headers: { get: h => next.headers?.[h.toLowerCase()] ?? null },
      text: async () => next.body ?? '',
    };
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = real;
    },
  };
}

// --- classifyStatus ---------------------------------------------------------

test('2xx resolves; 3xx does not, because redirects are followed', () => {
  for (const s of [200, 204, 299])
    assert.equal(classifyStatus(s), 'ok', `${s}`);
  // A 3xx only reaches us when it could not be followed — a broken redirect.
  for (const s of [301, 302, 304]) {
    assert.equal(classifyStatus(s), 'retryable', `${s}`);
  }
});

test('404 and 410 are dead', () => {
  assert.equal(classifyStatus(404), 'dead');
  assert.equal(classifyStatus(410), 'dead');
});

test('403 is retryable, matching auto-close-duplicates on rate limits', () => {
  // The whole point: anonymous GitHub requests from a shared runner IP get
  // 403-throttled, and calling that a deleted page is the #525 failure mode.
  assert.equal(classifyStatus(403), 'retryable');
  assert.equal(classifyStatus(429), 'retryable');
});

test('5xx is retryable and other 4xx is dead', () => {
  for (const s of [500, 502, 503]) assert.equal(classifyStatus(s), 'retryable');
  assert.equal(classifyStatus(400), 'dead');
  assert.equal(classifyStatus(451), 'dead');
});

// --- retryAfterMs -----------------------------------------------------------

test('Retry-After is honoured when short enough to be worth waiting', () => {
  assert.equal(retryAfterMs({ get: () => '5' }), 5000);
  assert.equal(retryAfterMs({ get: () => null }), null);
  assert.equal(retryAfterMs({ get: () => 'soon' }), null);
  assert.equal(retryAfterMs({ get: () => '-1' }), null);
});

test('an unreasonably long Retry-After is ignored rather than stalling the gate', () => {
  assert.equal(
    retryAfterMs({ get: () => String(MAX_RETRY_AFTER_MS / 1000 + 1) }),
    null
  );
});

// --- fetchWithRetry ---------------------------------------------------------

test('a 503 that clears resolves', async () => {
  const s = stubFetch([{ status: 503 }, { status: 503 }, { status: 200 }]);
  try {
    const r = await fetchWithRetry('https://example.test/a', NO_WAIT);
    assert.equal(r.outcome, 'ok');
  } finally {
    s.restore();
  }
});

test('a non-ok HEAD always falls through to GET, never short-circuits', async () => {
  // A CDN answering HEAD with 405 for a URL it serves over GET must not red
  // the build. The implementation this replaced fell through unconditionally.
  const s = stubFetch([{ status: 405 }, { status: 200 }]);
  try {
    const r = await fetchWithRetry('https://example.test/cdn', NO_WAIT);
    assert.equal(r.outcome, 'ok');
    assert.deepEqual(
      s.calls.map(c => c.method),
      ['HEAD', 'GET']
    );
  } finally {
    s.restore();
  }
});

test('a 404 on HEAD still tries GET before declaring the link gone', async () => {
  const s = stubFetch([
    { status: 404 },
    { status: 404, statusText: 'Not Found' },
  ]);
  try {
    const r = await fetchWithRetry('https://example.test/gone', NO_WAIT);
    assert.equal(r.outcome, 'dead');
    assert.equal(s.calls.length, 2);
  } finally {
    s.restore();
  }
});

test('persistent 403 reports unreachable, not gone', async () => {
  const s = stubFetch(all({ status: 403, statusText: 'rate limited' }));
  try {
    const r = await fetchWithRetry('https://example.test/throttled', NO_WAIT);
    assert.equal(r.outcome, 'unreachable');
    assert.equal(r.attempts, DEFAULT_ATTEMPTS);
  } finally {
    s.restore();
  }
});

test('a network error is unreachable with no status', async () => {
  const s = stubFetch(all({ throw: 'getaddrinfo ENOTFOUND' }));
  try {
    const r = await fetchWithRetry('https://example.test/dns', NO_WAIT);
    assert.equal(r.outcome, 'unreachable');
    assert.equal(r.status, null);
  } finally {
    s.restore();
  }
});

test('response bodies are drained so a socket cannot outlive the verdict', async () => {
  let drained = 0;
  const real = globalThis.fetch;
  globalThis.fetch = async () => ({
    status: 503,
    statusText: '',
    headers: { get: () => null },
    text: async () => {
      drained += 1;
      return '';
    },
  });
  try {
    await fetchWithRetry('https://example.test/body', NO_WAIT);
    assert.equal(drained, DEFAULT_ATTEMPTS * 2);
  } finally {
    globalThis.fetch = real;
  }
});

// --- githubApiUrl -----------------------------------------------------------

test('a blob URL maps to the contents endpoint with its ref', () => {
  assert.equal(
    githubApiUrl('https://github.com/allxsmith/bestax/blob/main/SECURITY.md'),
    'https://api.github.com/repos/allxsmith/bestax/contents/SECURITY.md?ref=main'
  );
});

test('a nested path keeps its separators', () => {
  assert.equal(
    githubApiUrl('https://github.com/o/r/blob/main/a/b/c.md'),
    'https://api.github.com/repos/o/r/contents/a/b/c.md?ref=main'
  );
});

test('a bare repo URL maps to the repo endpoint', () => {
  assert.equal(
    githubApiUrl('https://github.com/allxsmith/bestax'),
    'https://api.github.com/repos/allxsmith/bestax'
  );
});

test('non-github and unmapped shapes fall back to a direct fetch', () => {
  assert.equal(githubApiUrl('https://bestax.io/llms.txt'), null);
  assert.equal(githubApiUrl('https://github.com/o/r/releases/tag/v1'), null);
  assert.equal(githubApiUrl('not a url'), null);
  // Look-alike hosts must not be treated as GitHub.
  assert.equal(githubApiUrl('https://github.com.evil.test/o/r'), null);
});

// --- checkUrl ---------------------------------------------------------------

test('a github.com URL is verified through the API, with the token', async () => {
  const s = stubFetch([{ status: 200 }]);
  try {
    const r = await checkUrl(
      'https://github.com/allxsmith/bestax/blob/main/SECURITY.md',
      {
        token: 'ghs_example',
        retryOptions: NO_WAIT,
      }
    );
    assert.equal(r.outcome, 'ok');
    assert.equal(s.calls.length, 1);
    assert.match(s.calls[0].url, /^https:\/\/api\.github\.com\/repos\//);
    assert.equal(s.calls[0].headers.Authorization, 'Bearer ghs_example');
  } finally {
    s.restore();
  }
});

test('no token still checks, just unauthenticated', async () => {
  const s = stubFetch([{ status: 200 }]);
  try {
    const r = await checkUrl('https://github.com/allxsmith/bestax', {
      retryOptions: NO_WAIT,
    });
    assert.equal(r.outcome, 'ok');
    assert.equal(s.calls[0].headers.Authorization, undefined);
  } finally {
    s.restore();
  }
});

test('a non-github URL is fetched directly and sends no headers', async () => {
  const s = stubFetch([{ status: 200 }]);
  try {
    await checkUrl('https://bestax.io/llms.txt', {
      token: 'x',
      retryOptions: NO_WAIT,
    });
    assert.equal(s.calls[0].url, 'https://bestax.io/llms.txt');
    assert.equal(s.calls[0].headers, undefined);
  } finally {
    s.restore();
  }
});

// --- extractUrls ------------------------------------------------------------

test('extractUrls trims sentence punctuation but keeps the path', () => {
  assert.deepEqual(extractUrls('see https://bestax.io/docs/guides/llms.'), [
    'https://bestax.io/docs/guides/llms',
  ]);
  assert.deepEqual(extractUrls('a https://x.test/a, and https://y.test/b'), [
    'https://x.test/a',
    'https://y.test/b',
  ]);
});

test('extractUrls keeps a fragment and ignores markdown delimiters', () => {
  assert.deepEqual(
    extractUrls('[llms](https://bestax.io/docs/guides/llms#mcp-server)'),
    ['https://bestax.io/docs/guides/llms#mcp-server']
  );
});

// --- reporting --------------------------------------------------------------

test('hostsOf names the hosts actually in the failing set', () => {
  assert.deepEqual(
    hostsOf([{ url: 'https://bestax.io/a' }, { url: 'https://bestax.io/b' }]),
    ['bestax.io']
  );
});

test('the undetermined message does not claim the links are dead', () => {
  const msg = formatUndetermined(
    [{ url: 'https://bestax.io/a', detail: '503' }],
    9
  );
  assert.match(msg, /could not be checked/);
  assert.match(msg, /not a dead-link report/);
  assert.match(msg, /bestax\.io/);
  assert.doesNotMatch(msg, /githubstatus/);
});

test('the dead message names the pointer files it was given, not the constant', () => {
  const msg = formatDead(
    [{ url: 'https://x.test', detail: '404 Not Found' }],
    ['bulma-ui/llms.txt']
  );
  assert.match(msg, /bulma-ui\/llms\.txt/);
  assert.doesNotMatch(msg, /AGENTS\.md/);
});

// --- main -------------------------------------------------------------------

async function fixtureRepo(urls) {
  const root = await mkdtemp(join(tmpdir(), 'pointer-urls-'));
  await mkdir(join(root, 'bulma-ui'), { recursive: true });
  await writeFile(join(root, 'bulma-ui/llms.txt'), urls.join('\n') + '\n');
  await writeFile(join(root, 'bulma-ui/AGENTS.md'), '');
  return root;
}

const SIX = Array.from({ length: 6 }, (_, i) => `https://bestax.io/p${i}`);

/** Route every URL in SIX to the same scripted response set. */
const routeAll = entries => Object.fromEntries(SIX.map(u => [u, entries]));

test('main exits 0 when everything resolves', async () => {
  const root = await fixtureRepo(SIX);
  const s = stubFetchByUrl(routeAll([{ status: 200 }]));
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 0);
  } finally {
    s.restore();
  }
});

test('main exits 1 on a confirmed dead link', async () => {
  const root = await fixtureRepo(SIX);
  const s = stubFetchByUrl({
    // Specific route first — first match wins.
    p5: [
      { status: 404, statusText: 'Not Found' }, // HEAD
      { status: 404, statusText: 'Not Found' }, // GET
    ],
    ...routeAll([{ status: 200 }]),
  });
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 1);
  } finally {
    s.restore();
  }
});

test('a total outage warns and PASSES — the gate could not look', async () => {
  // The #525 case. Every host unreachable must not red every open PR.
  const root = await fixtureRepo(SIX);
  const s = stubFetchByUrl(routeAll(all({ status: 503 })));
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 0);
  } finally {
    s.restore();
  }
});

test('one undetermined URL among healthy ones still passes', async () => {
  const root = await fixtureRepo(SIX);
  const s = stubFetchByUrl({
    p3: all({ status: 503 }),
    ...routeAll([{ status: 200 }]),
  });
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 0);
  } finally {
    s.restore();
  }
});

test('a dead link still fails even when another URL is undetermined', async () => {
  const root = await fixtureRepo(SIX);
  const s = stubFetchByUrl({
    p2: all({ status: 503 }),
    p4: [
      { status: 404, statusText: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    ],
    ...routeAll([{ status: 200 }]),
  });
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 1);
  } finally {
    s.restore();
  }
});

test('too few URLs fails rather than reporting a vacuous success', async () => {
  const root = await fixtureRepo(['https://bestax.io/only-one']);
  const s = stubFetchByUrl({});
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 1);
    assert.equal(s.calls.length, 0, 'should not even try to fetch');
  } finally {
    s.restore();
  }
});

test('a URL repeated across both files is requested once', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pointer-urls-'));
  await mkdir(join(root, 'bulma-ui'), { recursive: true });
  await writeFile(join(root, 'bulma-ui/llms.txt'), SIX.join('\n'));
  await writeFile(join(root, 'bulma-ui/AGENTS.md'), SIX.join('\n'));
  const s = stubFetchByUrl(routeAll([{ status: 200 }]));
  try {
    assert.equal(await main({ root, files: FILES, retryOptions: NO_WAIT }), 0);
    assert.equal(s.calls.length, SIX.length);
  } finally {
    s.restore();
  }
});
