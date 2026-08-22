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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return status(405);
    if (new URL(request.url).pathname !== '/api/t') return status(404);

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return status(415);

    // Declared length first, so an honestly-labeled oversized body is refused
    // without buffering it; the byte check after read is the real guard.
    const declaredLength = request.headers.get('content-length');
    if (declaredLength !== null && Number(declaredLength) > MAX_BODY_BYTES) {
      return status(413);
    }
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return status(413);
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
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
