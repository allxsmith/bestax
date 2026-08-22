/**
 * Minimal structural types for the Workers runtime bindings this worker uses.
 * Deliberately hand-rolled: this package sits outside the pnpm workspace (for
 * now), so @cloudflare/workers-types cannot be installed. Request/Response/URL
 * come from the `webworker` TS lib instead (see tsconfig.json).
 */

export interface AnalyticsEngineDataPoint {
  indexes?: string[];
  blobs?: string[];
  doubles?: number[];
}

export interface AnalyticsEngineDataset {
  writeDataPoint(point: AnalyticsEngineDataPoint): void;
}

export interface Env {
  // Optional: absent under `wrangler dev` without the AE binding — the handler
  // must still 204 (fire-and-forget contract).
  TELEMETRY?: AnalyticsEngineDataset;
}
