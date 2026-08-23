import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import worker from '../index.ts';
import type { AnalyticsEngineDataPoint, Env } from '../types.ts';

const ENDPOINT = 'https://bestax.io/api/t';

// Node's undici Request/Response are structurally compatible with the
// webworker-lib types the handler is written against.
type FetchArgs = Parameters<typeof worker.fetch>;
const call = (request: unknown, env: Env = {}) =>
  worker.fetch(request as FetchArgs[0], env as FetchArgs[1]);

function makeEnv() {
  const points: AnalyticsEngineDataPoint[] = [];
  const env: Env = {
    TELEMETRY: {
      writeDataPoint: point => {
        points.push(point);
      },
    },
  };
  return { env, points };
}

function post(body: unknown, contentType = 'application/json') {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const createPayload = () => ({
  v: 1,
  tool: 'create-bestax',
  event: 'scaffold',
  toolVersion: '1.4.2',
  nodeMajor: 22,
  platform: 'darwin',
  props: {
    template: 'vite-ts',
    bulmaFlavor: 'complete',
    iconLibrary: 'none',
    skills: true,
    packageManager: 'pnpm',
  },
});

const migratePayload = () => ({
  v: 1,
  tool: 'bestax-migrate',
  event: 'migrate',
  toolVersion: '0.3.0',
  nodeMajor: 20,
  platform: 'linux',
  props: {
    source: 'react-bulma-components',
    cssMode: 'bestax',
    dry: false,
    deps: true,
    changedCount: 23,
  },
  todosByRule: [
    { rule: 'unmapped-prop', count: 3 },
    { rule: 'icon.size', count: 1 },
  ],
});

describe('handler: request gate', () => {
  it('405 for non-POST', async () => {
    const { env, points } = makeEnv();
    const res = await call(new Request(ENDPOINT, { method: 'GET' }), env);
    assert.equal(res.status, 405);
    assert.equal(points.length, 0);
  });

  it('404 for a different pathname', async () => {
    const { env, points } = makeEnv();
    const res = await call(
      new Request('https://bestax.io/api/other', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      env
    );
    assert.equal(res.status, 404);
    assert.equal(points.length, 0);
  });

  it('415 for non-JSON content-type', async () => {
    const { env, points } = makeEnv();
    const res = await call(post(createPayload(), 'text/plain'), env);
    assert.equal(res.status, 415);
    assert.equal(points.length, 0);
  });

  it('accepts application/json with a charset parameter', async () => {
    const { env } = makeEnv();
    const res = await call(
      post(createPayload(), 'application/json; charset=utf-8'),
      env
    );
    assert.equal(res.status, 204);
  });

  it('413 for an oversized declared content-length, body unread', async () => {
    // undici strips content-length from real Requests, so stub the shape.
    let read = false;
    const request = {
      method: 'POST',
      url: ENDPOINT,
      headers: new Headers({
        'content-type': 'application/json',
        'content-length': '999999',
      }),
      get body() {
        read = true;
        return null;
      },
    };
    const { env, points } = makeEnv();
    const res = await call(request, env);
    assert.equal(res.status, 413);
    assert.equal(read, false);
    assert.equal(points.length, 0);
  });

  it('413 for a body over 8192 bytes', async () => {
    const { env, points } = makeEnv();
    const res = await call(post(`{"pad":"${'a'.repeat(9000)}"}`), env);
    assert.equal(res.status, 413);
    assert.equal(points.length, 0);
  });

  it('413 for an oversized chunked body, without buffering it all', async () => {
    // A streamed body declares no content-length, so only the running byte
    // count can refuse it. 1 KiB chunks: the cap must trip on chunk 9 and
    // stop pulling — chunk 20 must never be requested.
    let pulls = 0;
    const chunk = new TextEncoder().encode('a'.repeat(1024));
    const stream = new ReadableStream({
      pull(controller) {
        pulls += 1;
        if (pulls > 20) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    const { env, points } = makeEnv();
    const res = await call(request, env);
    assert.equal(res.status, 413);
    assert.ok(pulls < 20, `stopped pulling early (pulled ${pulls} chunks)`);
    assert.equal(points.length, 0);
  });

  it('accepts a valid payload sent as a chunked stream', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(createPayload()));
    const stream = new ReadableStream({
      start(controller) {
        // Split mid-payload so decoding must happen after reassembly.
        controller.enqueue(bytes.slice(0, 40));
        controller.enqueue(bytes.slice(40));
        controller.close();
      },
    });
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    const { env, points } = makeEnv();
    const res = await call(request, env);
    assert.equal(res.status, 204);
    assert.equal(points.length, 1);
  });

  it('400 for a POST with no body', async () => {
    const { env, points } = makeEnv();
    const res = await call(
      new Request(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
      env
    );
    assert.equal(res.status, 400);
    assert.equal(points.length, 0);
  });

  it('400 for malformed JSON', async () => {
    const { env, points } = makeEnv();
    const res = await call(post('{"v":1,'), env);
    assert.equal(res.status, 400);
    assert.equal(points.length, 0);
  });

  it('400 with empty body for a payload failing validation', async () => {
    const { env, points } = makeEnv();
    const res = await call(post({ v: 1, tool: 'create-bestax' }), env);
    assert.equal(res.status, 400);
    assert.equal(await res.text(), '');
    assert.equal(points.length, 0);
  });
});

describe('handler: accepted payloads', () => {
  it('create-bestax scaffold writes one exact point', async () => {
    const { env, points } = makeEnv();
    const res = await call(post(createPayload()), env);
    assert.equal(res.status, 204);
    assert.equal(await res.text(), '');
    assert.equal(points.length, 1);
    assert.deepEqual(points[0], {
      indexes: ['create-bestax'],
      blobs: [
        'scaffold',
        '1.4.2',
        'darwin',
        '22',
        'vite-ts',
        'complete',
        'none',
        '1',
        'pnpm',
      ],
      doubles: [],
    });
  });

  it('bestax-migrate writes the run point plus one point per todo rule', async () => {
    const { env, points } = makeEnv();
    const res = await call(post(migratePayload()), env);
    assert.equal(res.status, 204);
    assert.equal(points.length, 3);
    assert.deepEqual(points[0], {
      indexes: ['bestax-migrate'],
      blobs: [
        'migrate',
        '0.3.0',
        'linux',
        '20',
        'react-bulma-components',
        'bestax',
        '0',
        '1',
        '10-49',
      ],
      doubles: [23],
    });
    assert.deepEqual(points[1], {
      indexes: ['bestax-migrate'],
      blobs: [
        'migrate_todo',
        '0.3.0',
        'linux',
        '20',
        'react-bulma-components',
        'unmapped-prop',
      ],
      doubles: [3],
    });
    assert.deepEqual(points[2], {
      indexes: ['bestax-migrate'],
      blobs: [
        'migrate_todo',
        '0.3.0',
        'linux',
        '20',
        'react-bulma-components',
        'icon.size',
      ],
      doubles: [1],
    });
  });

  it('caps the changedCount double at 10000 and buckets the capped value', async () => {
    const { env, points } = makeEnv();
    const payload = migratePayload();
    payload.props.changedCount = 100000;
    const res = await call(post(payload), env);
    assert.equal(res.status, 204);
    assert.deepEqual(points[0]?.doubles, [10000]);
    assert.equal(points[0]?.blobs?.[8], '200+');
  });

  it('derives changedBucket (blob9) from changedCount server-side', async () => {
    const boundaries: [number, string][] = [
      [0, '0'],
      [1, '1-9'],
      [9, '1-9'],
      [10, '10-49'],
      [49, '10-49'],
      [50, '50-199'],
      [199, '50-199'],
      [200, '200+'],
      [10000, '200+'],
      [100000, '200+'], // capped to 10000 first, still 200+
    ];
    for (const [changedCount, bucket] of boundaries) {
      const { env, points } = makeEnv();
      const payload = migratePayload();
      payload.props.changedCount = changedCount;
      const res = await call(post(payload), env);
      assert.equal(res.status, 204);
      assert.equal(
        points[0]?.blobs?.[8],
        bucket,
        `changedCount ${changedCount} → bucket ${bucket}`
      );
    }
  });

  it('caps each todo count double at 10000', async () => {
    const { env, points } = makeEnv();
    const payload = migratePayload();
    payload.todosByRule = [{ rule: 'prop:className', count: 100000 }];
    const res = await call(post(payload), env);
    assert.equal(res.status, 204);
    assert.equal(points.length, 2);
    assert.deepEqual(points[1]?.doubles, [10000]);
  });

  it('20 todo rules → exactly 21 writes', async () => {
    const { env, points } = makeEnv();
    const payload = migratePayload();
    payload.todosByRule = Array.from({ length: 20 }, (_, i) => ({
      rule: `rule-${i}`,
      count: i + 1,
    }));
    const res = await call(post(payload), env);
    assert.equal(res.status, 204);
    assert.equal(points.length, 21);
  });

  it('25 todo rules → 400 and zero writes (validation caps at 20)', async () => {
    const { env, points } = makeEnv();
    const payload = migratePayload();
    payload.todosByRule = Array.from({ length: 25 }, (_, i) => ({
      rule: `rule-${i}`,
      count: 1,
    }));
    const res = await call(post(payload), env);
    assert.equal(res.status, 400);
    assert.equal(points.length, 0);
  });

  it('a bad todo entry is dropped; the run and good slugs still write', async () => {
    const { env, points } = makeEnv();
    const payload = migratePayload();
    payload.todosByRule = [
      { rule: 'prop:className', count: 4 },
      { rule: 'has space', count: 1 },
      { rule: 'x', count: 1, file: 'App.tsx' },
    ];
    const res = await call(post(payload), env);
    assert.equal(res.status, 204);
    assert.equal(points.length, 2);
    assert.equal(points[0]?.blobs?.[0], 'migrate');
    assert.deepEqual(points[1], {
      indexes: ['bestax-migrate'],
      blobs: [
        'migrate_todo',
        '0.3.0',
        'linux',
        '20',
        'react-bulma-components',
        'prop:className',
      ],
      doubles: [4],
    });
  });

  it('204 even without the TELEMETRY binding (fire-and-forget)', async () => {
    const res = await call(post(createPayload()), {});
    assert.equal(res.status, 204);
    assert.equal(await res.text(), '');
  });
});
