/**
 * Anonymous telemetry ingest for the create-bestax and bestax-migrate CLIs.
 *
 * POST bestax.io/api/t → validate (reject-by-default) → write to Analytics
 * Engine → 204. Privacy constraints, deliberately load-bearing: never read
 * request.cf, CF-Connecting-IP, or User-Agent; never log the body; no CORS
 * headers (the CLIs are not browsers).
 */

import { runEventPoint, todoPoints } from './schema.ts';
import type { Env } from './types.ts';
import { validate } from './validate.ts';

const MAX_BODY_BYTES = 8192;

const status = (code: number): Response => new Response(null, { status: code });

/**
 * Read the body as a stream, refusing the moment the running byte total
 * exceeds MAX_BODY_BYTES — a chunked POST carries no content-length, and
 * buffering it whole before checking would let one request hold the plan cap
 * in memory. Returns the raw bytes, or the error status to answer with.
 */
async function readBody(
  body: ReadableStream<Uint8Array>
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; status: number }> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(result.value);
    }
  } catch {
    // A stream error mid-read (client abort, malformed chunking): treat like
    // any other unusable body.
    return { ok: false, status: 400 };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return status(405);
    if (new URL(request.url).pathname !== '/api/t') return status(404);

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return status(415);

    // Declared length first, so an honestly-labeled oversized body is refused
    // without reading a byte; the streamed count in readBody is the real
    // guard (a chunked POST declares no length).
    const declaredLength = request.headers.get('content-length');
    if (declaredLength !== null && Number(declaredLength) > MAX_BODY_BYTES) {
      return status(413);
    }
    if (request.body === null) return status(400); // no body: never valid JSON
    const read = await readBody(request.body);
    if (!read.ok) return status(read.status);

    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(read.bytes));
    } catch {
      return status(400);
    }

    const result = validate(body);
    if (!result.ok) return status(400);

    // Missing binding (wrangler dev without AE) still answers 204 — the CLIs
    // fire-and-forget and must never surface an error. Total writes per
    // request: 1 run event + ≤20 todo points = ≤21.
    if (env.TELEMETRY) {
      env.TELEMETRY.writeDataPoint(runEventPoint(result.payload));
      for (const point of todoPoints(result.payload)) {
        env.TELEMETRY.writeDataPoint(point);
      }
    }
    return status(204);
  },
};
