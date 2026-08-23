# telemetry-worker

Cloudflare Worker that ingests anonymous telemetry from the `create-bestax`
and `bestax-migrate` CLIs at `POST bestax.io/api/t` and writes it to the
Cloudflare Analytics Engine dataset `bestax_telemetry`. Fire-and-forget: valid
payloads get an empty `204`, everything else gets a bare error status, and a
missing binding in local dev still answers `204`.

## Deploy

```sh
npx wrangler deploy
```

Run by Alex — the deploy is manual (nothing in `.github/workflows` touches
this worker). The package IS in the pnpm workspace, so the lockfile, audit
gate, and 3-day cooldown govern its devDependencies; they stay exact-pinned
anyway so a deploy is reproducible from the manifest alone. Wrangler's native
`workerd` postinstall is blocked repo-wide (`allowBuilds`), which `wrangler
deploy` never needs — for local `wrangler dev`, use `--remote` or flip the
`workerd` entry. Wrangler bundles `src/index.ts` directly (no build step).
Tests and typecheck still run from the repo root:
`pnpm test` includes `node --test telemetry-worker/src/__tests__/*.test.ts`,
and `pnpm typecheck` includes `tsc -p telemetry-worker`. The worker is bound
to the zone route `bestax.io/api/t`. If that route ever conflicts with
whatever serves the rest of `bestax.io`, the fallback is a custom domain:
attach `t.bestax.io` to the worker and point the CLIs at
`https://t.bestax.io/api/t` (the handler only checks the `/api/t` pathname,
so no code change needed).

## Analytics Engine mapping

`blobs[i]` surfaces in SQL as `blob{i+1}`; sampling means counts are
`SUM(_sample_interval)`, not `COUNT(*)`.

| Column    | run event (`scaffold` / `migrate`)  | `migrate_todo` point |
| --------- | ----------------------------------- | -------------------- |
| `index1`  | tool                                | `bestax-migrate`     |
| `blob1`   | event                               | `migrate_todo`       |
| `blob2`   | toolVersion                         | toolVersion          |
| `blob3`   | platform                            | platform             |
| `blob4`   | nodeMajor                           | nodeMajor            |
| `blob5`   | template / source                   | source               |
| `blob6`   | bulmaFlavor / cssMode               | rule                 |
| `blob7`   | iconLibrary / dry (`1`/`0`)         | —                    |
| `blob8`   | skills (`1`/`0`) / deps (`1`/`0`)   | —                    |
| `blob9`   | packageManager / changedBucket¹     | —                    |
| `double1` | — / changedCount (capped at 10 000) | count (same cap)     |

¹ `changedBucket` is not a wire field: the worker derives it from the capped
`changedCount` (`0`, `1-9`, `10-49`, `50-199`, `200+`), so the bucket and the
double can never disagree.

## Example queries

Scaffolds by template and flavor, last 30 days:

```sql
SELECT blob5 AS template, blob6 AS flavor, SUM(_sample_interval) AS runs
FROM bestax_telemetry WHERE index1='create-bestax' AND blob1='scaffold'
  AND timestamp > NOW() - INTERVAL '30' DAY GROUP BY template, flavor ORDER BY runs DESC;
```

Which migration rules leave the most TODOs, last 90 days:

```sql
SELECT blob6 AS rule, SUM(double1*_sample_interval) AS todos
FROM bestax_telemetry WHERE index1='bestax-migrate' AND blob1='migrate_todo'
  AND timestamp > NOW() - INTERVAL '90' DAY GROUP BY rule ORDER BY todos DESC;
```

Package manager × skills opt-in, last 30 days:

```sql
SELECT blob9 AS pm, blob8 AS skills, SUM(_sample_interval) AS runs
FROM bestax_telemetry WHERE index1='create-bestax' AND blob1='scaffold'
  AND timestamp > NOW() - INTERVAL '30' DAY GROUP BY pm, skills ORDER BY runs DESC;
```

## Privacy

- Allowlist validation is the backstop: every key and value in a payload must
  match a closed allowlist (`src/schema.ts`, `src/validate.ts`) or the whole
  payload is rejected with a bare `400`. Unknown values are dropped, never
  stored — fail closed. New templates, flavors, icon libraries, sources, or
  CSS modes must be added to `src/schema.ts` **first** or their runs are
  silently discarded.
- No IP address or User-Agent is ever read or stored; `request.cf` is never
  touched; request bodies are never logged.
- The ingest is unauthenticated by design — any client can POST synthetic
  events, because per-sender identification would contradict the no-identifier
  privacy contract — so aggregate queries should treat absolute counts as
  indicative, not audited.
- No CORS headers: the endpoint is for the CLIs, not browsers.
