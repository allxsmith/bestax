#!/usr/bin/env node
/**
 * Verify that every URL in the agent-discovery pointer files shipped in the
 * bestax-bulma tarball (issue #344) still resolves, so a release can't ship
 * dead links to the docs site.
 *
 * Runs in ci.yml's `Build and Test` job (`pnpm run check:urls`), a required
 * check — so this decides whether every open PR is red. #525 is the record of
 * getting that wrong: during the 2026-08-17 GitHub incident this failed #524
 * on `blob/main/SECURITY.md` with a 404 while the file was present on `main`
 * the whole time.
 *
 * Two design choices come straight out of that incident, and neither is the
 * obvious one:
 *
 * 1. **github.com URLs are verified through the REST API, not the web UI.**
 *    Retrying would not have helped — the outage lasted hours. What was
 *    measurably true at the time is that `/repos/{owner}/{repo}/contents/...`
 *    answered 200 for the very file whose blob page was 404ing. The API is
 *    also the authenticated path, so it does not collect the anonymous 403
 *    rate limits a shared runner IP attracts.
 *
 * 2. **"Could not determine" is a warning, not a failure.** This gate exists
 *    to catch a dead link a PR introduces. If a host will not answer, the gate
 *    has not found a dead link — it has failed to look, and reding every open
 *    PR for that is the cry-wolf problem #391 and #525 are both about. A
 *    confirmed 404 still fails the build.
 *
 * Design mirrors check-security-txt-expiry.mjs: plain node, zero npm deps,
 * pure helpers exported, main only runs when executed directly.
 *
 * Exit codes: 0 every URL resolved or could not be determined,
 *             1 at least one URL was confirmed dead.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchWithRetry } from './lib/fetch-retry.mjs';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const FILES = ['bulma-ui/llms.txt', 'bulma-ui/AGENTS.md'];

/**
 * Fail if the pointer files yield fewer URLs than this. Without a floor, a
 * restructured pointer file or an edit to the extraction regex turns the gate
 * into a no-op that reports "all 0 URLs resolve" and goes green having checked
 * nothing. The number is a floor, not the current count, so adding or removing
 * a link does not require touching it.
 */
export const MIN_EXPECTED_URLS = 5;

/**
 * Pull https:// URLs out of a pointer file. The trailing `[.,]` trim keeps a
 * URL that ends a sentence from carrying the punctuation into the request.
 */
export function extractUrls(text) {
  const found = [];
  for (const match of text.matchAll(/https:\/\/[^\s)`]+/g)) {
    found.push(match[0].replace(/[.,]$/, ''));
  }
  return found;
}

export function collectUrls(root = repoRoot, files = FILES) {
  const urls = new Set();
  for (const rel of files) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const url of extractUrls(text)) urls.add(url);
  }
  return [...urls].sort();
}

/**
 * Map a github.com web URL to the REST endpoint that answers the same
 * question. Returns null for shapes we have no mapping for, which fall back to
 * fetching the page directly.
 *
 *   /{owner}/{repo}                     -> /repos/{owner}/{repo}
 *   /{owner}/{repo}/blob/{ref}/{path}   -> /repos/{owner}/{repo}/contents/{path}?ref={ref}
 *   /{owner}/{repo}/tree/{ref}/{path}   -> same contents endpoint
 */
export function githubApiUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'github.com') return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  const [owner, repo, kind, ref, ...rest] = segments;
  if (!owner || !repo) return null;

  if (segments.length === 2) {
    return `https://api.github.com/repos/${owner}/${repo}`;
  }
  if ((kind === 'blob' || kind === 'tree') && ref && rest.length > 0) {
    const filePath = rest.map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(ref)}`;
  }
  return null;
}

/**
 * Corroborate a `dead` verdict against a second source before believing it.
 *
 * Only a `dead` verdict reds the build, so it is the one that has to be right,
 * and a single source is not enough to establish it. Two ways that bites:
 *
 * - The #525 incident, one host over. The API fallback only covers github.com;
 *   the other seven URLs are on bestax.io, where a CDN incident serving
 *   spurious 404s would reproduce exactly the failure this PR removes.
 * - `githubApiUrl` has to guess where the ref ends and the path begins, so a
 *   branch with a slash in it (`blob/feature/x/README.md`) mis-maps and the
 *   API 404s a file that exists.
 *
 * The second source differs by what is available. For a github.com URL the
 * original web page is the corroborator, so the two only agree on "gone" when
 * both the API and the page say so. For everything else there is no second
 * view of the same resource, so we ask a weaker but still useful question —
 * is the host healthy at all? A 404 from a host whose root serves fine is
 * credible; a 404 from a host that cannot serve its own root is not.
 *
 * Disagreement resolves to `unreachable`, which warns and passes. That is the
 * deliberate direction: a false "gone" reds every open PR, a false
 * "undetermined" costs one warning and is caught on the next run.
 */
async function corroborateDead(url, primary, retryOptions) {
  const isGithub = githubApiUrl(url) !== null;
  const second = isGithub ? url : new URL(url).origin;

  const check = await fetchWithRetry(second, retryOptions);
  if (isGithub ? check.outcome === 'dead' : check.outcome === 'ok') {
    return primary;
  }
  return {
    ...primary,
    outcome: 'unreachable',
    detail:
      `${primary.detail} (not corroborated: ${second} answered ` +
      `${check.detail ?? check.status ?? check.outcome})`,
  };
}

/**
 * Check one URL, preferring the authoritative endpoint where one exists.
 *
 * The token is optional on purpose: a contributor running `pnpm check:urls`
 * locally has none, and the check must still work for them. Unauthenticated
 * API requests are rate-limited but not forbidden, and a throttle classifies
 * as retryable rather than dead.
 */
export async function checkUrl(url, { token, retryOptions = {} } = {}) {
  const apiUrl = githubApiUrl(url);

  const primary = apiUrl
    ? {
        ...(await fetchWithRetry(apiUrl, {
          ...retryOptions,
          // GET only. The API answers HEAD fine (measured: 200 on the contents
          // route), but HEAD and GET each cost one request against the rate
          // limit, so trying HEAD first can only ever spend two where one does.
          methods: ['GET'],
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'bestax-check-pointer-urls',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })),
        via: apiUrl,
      }
    : await fetchWithRetry(url, retryOptions);

  if (primary.outcome !== 'dead') return primary;
  return corroborateDead(url, primary, retryOptions);
}

/** The distinct hosts present in a set of results, for the operator's benefit. */
export function hostsOf(entries) {
  const hosts = new Set();
  for (const { url } of entries) {
    try {
      hosts.add(new URL(url).hostname);
    } catch {
      /* a URL we could not parse cannot name a host */
    }
  }
  return [...hosts].sort();
}

/**
 * Render the undetermined URLs as a warning.
 *
 * Naming the hosts actually in the failing set matters: seven of the nine URLs
 * live on bestax.io, so a message that only ever points at githubstatus.com
 * sends the reader somewhere all-green during a Cloudflare incident — the same
 * misdirection, one host over.
 */
export function formatUndetermined(entries, total) {
  const hosts = hostsOf(entries);
  const scope =
    entries.length === total
      ? `none of the ${total} URLs could be checked`
      : `${entries.length} of ${total} URLs could not be checked`;
  return [
    `[check-pointer-urls] ${scope}. This is not a dead-link report — the hosts`,
    `did not give a usable answer, so the check could not look. Affected`,
    `host(s): ${hosts.join(', ') || 'unknown'}.`,
    ...entries.map(e => `  ${e.url} — ${e.detail}`),
  ].join('\n');
}

/** Render the confirmed dead links — the failures that red the build. */
export function formatDead(entries, files = FILES) {
  return [
    `[check-pointer-urls] ${entries.length} URL(s) in ${files.join(', ')} are gone:`,
    ...entries.map(e => `  ${e.url} — ${e.detail}`),
  ].join('\n');
}

export async function main({
  root = repoRoot,
  files = FILES,
  token = process.env.GITHUB_TOKEN,
  // Forwarded to fetchWithRetry so the tests can zero the backoff; without it
  // the suite would really sleep through every retry it exercises.
  retryOptions = {},
  minUrls = MIN_EXPECTED_URLS,
} = {}) {
  const urls = collectUrls(root, files);

  if (urls.length < minUrls) {
    console.error(
      `[check-pointer-urls] found only ${urls.length} URL(s) in ${files.join(', ')}, ` +
        `expected at least ${minUrls}. Refusing to report success on a check that ` +
        `verified almost nothing — the pointer files or the extraction changed.`
    );
    return 1;
  }

  // Concurrent, because the expensive case is a host that never answers: a
  // sequential sweep multiplies every timeout by the number of URLs.
  const results = await Promise.all(
    urls.map(async url => ({
      url,
      ...(await checkUrl(url, { token, retryOptions })),
    }))
  );

  const dead = [];
  const undetermined = [];
  for (const r of results) {
    if (r.outcome === 'ok') {
      console.log(
        `[check-pointer-urls] ok   ${r.url}${r.via ? ` (via API)` : ''}`
      );
    } else if (r.outcome === 'dead') {
      dead.push(r);
      console.error(`[check-pointer-urls] DEAD ${r.url} (${r.detail})`);
    } else {
      undetermined.push(r);
      console.error(`[check-pointer-urls] ????  ${r.url} (${r.detail})`);
    }
  }

  if (undetermined.length > 0) {
    const body = formatUndetermined(undetermined, urls.length);
    // A GitHub Actions workflow command when running in CI, an ordinary line
    // otherwise. Either way it does not fail the job.
    console.error(`::warning::${body.split('\n')[0]}`);
    console.error(body);
  }

  if (dead.length > 0) {
    console.error(formatDead(dead, files));
    return 1;
  }

  const checked = urls.length - undetermined.length;
  console.log(
    `[check-pointer-urls] ${checked}/${urls.length} URLs resolve` +
      (undetermined.length ? ` (${undetermined.length} undetermined)` : '')
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main();
}
