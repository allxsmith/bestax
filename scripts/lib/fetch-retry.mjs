/**
 * Retrying fetch for the checks that probe public URLs (#525).
 *
 * The incident this exists for: on 2026-08-17 GitHub served `404` and `503`
 * interchangeably for anonymous blob requests for about three hours, and
 * check-pointer-urls failed every open PR with "SECURITY.md did not resolve"
 * while that file sat on `main` untouched.
 *
 * Read that carefully, because the obvious fix does not work. Retrying does
 * not help against a three-hour outage, and only one of the nine URLs was
 * failing, so no "everything is down" heuristic would have fired either. What
 * actually distinguished truth from noise that day was *asking a different
 * endpoint*: the REST API answered `200` for the same file the web UI was
 * 404ing. That is why the caller resolves github.com URLs through the API and
 * this module only handles the transport.
 *
 * So retrying here is the cheap half — it covers brief blips, nothing more.
 * The classification is the load-bearing half: statuses are sorted into "the
 * host answered no", "the host did not give a usable answer", and "resolved",
 * because reporting the second as the first is what sent everyone to look for
 * a deleted file that existed.
 */

/** Attempts per URL. Three, the number the shell provenance loop used to spend. */
export const DEFAULT_ATTEMPTS = 3;

/**
 * Backoff between attempts, in ms.
 *
 * These were tuned for the pull-request gate, which is the latency-sensitive
 * caller. The weekly provenance job now shares them, down from the 5s/10s its
 * shell loop used — deliberate, because that job also gained a real retry on
 * the registry's 404 propagation lag, which is the case the longer wait was
 * actually protecting against. Retune with both callers in mind.
 *
 * Cost, stated properly because an earlier version of this comment got it
 * backwards: a confirmed-dead URL costs one round trip and fails fast. The
 * expensive case is a host that never answers — attempts x methods x
 * `timeoutMs`, plus this backoff. That is why callers check concurrently.
 */
export const DEFAULT_BACKOFF_MS = [1000, 3000];

/** Per-request ceiling, matching check-security-txt-expiry.mjs. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Longest `Retry-After` we will actually wait. Honouring the header is right
 * (auto-close-duplicates.mjs does the same), but a gate on every PR cannot sit
 * out a 300-second throttle — past this we stop waiting and report the URL as
 * undetermined, which is a warning rather than a failure.
 */
export const MAX_RETRY_AFTER_MS = 15_000;

/**
 * Sort an HTTP status into what it tells us about the URL.
 *
 * - `ok`        — 2xx. Matches the `res.ok` test this replaced.
 * - `dead`      — the host answered no, and asking again cannot change that.
 * - `retryable` — no usable answer: throttling, or the host's own failure.
 *
 * 401 and 403 are **retryable**, not dead. They read like definite answers
 * about access, but neither says anything about whether the URL exists. 403 is
 * how GitHub reports abuse and rate limiting to anonymous requests from a
 * shared Actions runner IP — `auto-close-duplicates.mjs` already concluded
 * "403/429 is (usually) a primary/secondary rate limit", and disagreeing here
 * would mean this gate calls a throttled request a deleted page. 401 would
 * mean our own credential went bad, which is a problem with the checker, not
 * with the link; reding the build for it would blame the wrong thing.
 *
 * 3xx is `dead`, not ok and not retryable. Requests are made with
 * `redirect: 'follow'`, so a 3xx only reaches us when it could not be
 * followed — a redirect with no `Location` header. That is a broken link, and
 * retrying it would only turn a real defect into a warning that passes.
 * (A redirect *loop* never lands here: undici throws, which the caller records
 * as unreachable. And 304 cannot occur because no conditional request headers
 * are ever sent.)
 */
export function classifyStatus(status) {
  if (status >= 200 && status < 300) return 'ok';
  if (status >= 300 && status < 400) return 'dead';
  if (
    status === 401 ||
    status === 403 ||
    status === 408 ||
    status === 425 ||
    status === 429
  ) {
    return 'retryable';
  }
  if (status >= 500) return 'retryable';
  if (status >= 400 && status < 500) return 'dead';
  // Anything unrecognised. Erring toward retryable costs latency; erring the
  // other way costs a false red on someone's PR.
  return 'retryable';
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * `Retry-After` in ms if present, sane, and short enough to be worth waiting.
 *
 * RFC 9110 §10.2.3 defines two forms and hosts use both: `delay-seconds`, and
 * an absolute HTTP-date. Parsing only the first is not a crash — a date reads
 * as NaN and we fall back to the fixed backoff — but it silently ignores a
 * server that told us exactly when to come back.
 *
 * `now` is a parameter so the date branch is testable against a frozen clock
 * rather than a real one.
 */
export function retryAfterMs(headers, now = Date.now()) {
  const raw = headers?.get?.('retry-after');
  if (raw == null) return null;
  const trimmed = String(raw).trim();

  // delay-seconds. Matched strictly, so a negative or fractional value falls
  // through to the date branch and is rejected there rather than sneaking in.
  const ms = /^\d+$/.test(trimmed)
    ? Number(trimmed) * 1000
    : Date.parse(trimmed) - now;

  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms <= MAX_RETRY_AFTER_MS ? ms : null;
}

/**
 * Fetch `url`, retrying only what retrying can fix.
 *
 * Resolves to `{ outcome, status, detail, attempts }` rather than throwing:
 * callers are gates that need every URL's verdict, not an abort on the first.
 *
 * `keepBody: true` adds `body` to an `ok` result. It is opt-in rather than
 * always-on: the body is drained either way, but *retaining* it is not free —
 * the URL gate holds one result per URL for the whole run, and the GitHub
 * contents API embeds the entire file, so defaulting to on would park
 * SECURITY.md and AGENTS.md in memory for a caller that never reads them.
 *
 * `alsoRetryable` adds statuses to the retryable set for one call. It exists
 * for the registry attestation lookup, where a 404 seconds after a publish
 * means "not propagated yet" rather than "does not exist".
 *
 * - `outcome: 'ok'`          — resolved.
 * - `outcome: 'dead'`        — the host answered no, on the final method.
 * - `outcome: 'unreachable'` — no usable answer after every attempt. Network
 *   errors and timeouts land here too, with `status: null`.
 *
 * HEAD is tried before GET because it is cheaper, and a non-ok HEAD **always
 * falls through to GET** — never short-circuits. Some CDNs answer HEAD with
 * 405 or 403 for a URL they serve perfectly well over GET, so a HEAD-only
 * verdict would red the build for a link that works in a browser. The
 * implementation this replaced fell through unconditionally; keeping that is
 * deliberate, not incidental.
 *
 * `headers` exists for exactly one caller: the GitHub REST lookups, which need
 * `Authorization`. Two things keep that from leaking. Redirects are followed,
 * and the fetch spec strips `Authorization` on a cross-origin redirect; and the
 * caller only ever sets it for api.github.com. Do not widen this to arbitrary
 * request init — a general seam plus redirect-following is how a credential
 * reaches a host nobody named.
 */
export async function fetchWithRetry(url, options = {}) {
  const {
    attempts = DEFAULT_ATTEMPTS,
    backoffMs = DEFAULT_BACKOFF_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    methods = ['HEAD', 'GET'],
    headers = undefined,
    keepBody = false,
    alsoRetryable = [],
  } = options;

  let last = { outcome: 'unreachable', status: null, detail: 'not attempted' };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let waitMs = backoffMs[attempt - 1] ?? backoffMs.at(-1) ?? 0;

    for (const [index, method] of methods.entries()) {
      const isLastMethod = index === methods.length - 1;
      try {
        const res = await fetch(url, {
          method,
          headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
        });
        // Drain before anything else. An unconsumed undici body keeps its
        // socket out of the pool and ref'd, and the caller sets
        // process.exitCode rather than calling process.exit, so a retained
        // socket would stall the step after the verdict is already printed.
        const body = await res.text?.().catch(() => '');

        const verdict = alsoRetryable.includes(res.status)
          ? 'retryable'
          : classifyStatus(res.status);
        const detail = `${res.status} ${res.statusText ?? ''}`.trim();

        if (verdict === 'ok') {
          return {
            outcome: 'ok',
            status: res.status,
            detail: null,
            attempts: attempt,
            ...(keepBody ? { body: body ?? '' } : {}),
          };
        }
        if (verdict === 'dead' && isLastMethod) {
          return {
            outcome: 'dead',
            status: res.status,
            detail,
            attempts: attempt,
          };
        }
        last = { outcome: 'unreachable', status: res.status, detail };
        const after = retryAfterMs(res.headers);
        if (after !== null) waitMs = after;
      } catch (err) {
        // Network refusal, DNS failure, or the AbortSignal timeout. None of
        // these say anything about whether the URL exists.
        last = {
          outcome: 'unreachable',
          status: null,
          detail: err?.cause?.message ?? err?.message ?? String(err),
        };
      }
    }
    if (attempt < attempts) await sleep(waitMs);
  }

  return { ...last, attempts };
}
