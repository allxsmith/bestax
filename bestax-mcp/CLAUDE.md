# bestax-mcp

The first-party MCP server for `@allxsmith/bestax-bulma`. Published unscoped as
`bestax-mcp`, alongside `create-bestax` and `bestax-migrate`.

It answers questions about the library — components, props, examples, CSS
variables — and ships the library's _opinions_ as MCP prompts, one per Agent
Skill. Run it with `npx bestax-mcp`.

## Everything in `data/` is generated

`pnpm gen:mcp` (root) runs `scripts/gen-mcp-index.mjs`, which reuses the same
extraction the API docs use — `scripts/lib/props-extract.mjs` in
`markdown: false` mode, `scss-vars.mjs`, `api-sources.mjs` — plus the
hand-written `## Usage` / `## Accessibility` sections of the 87 API pages.

- **Never hand-edit `data/`.** CI fails on staleness (`pnpm gen:mcp:check`).
- `data/catalog.json` and `data/components/*.json` are **committed**.
- `data/skills/` is **gitignored** and synced from `/skills` by
  `scripts/sync-skills.mjs`, which runs on `build`, `test`, `test:coverage`,
  `test:watch` and `prepack`. Only the manifest (`data/skills.json`) is
  committed — enough for the staleness gate to catch a new or renamed skill,
  without putting a second copy of ~390 KB of markdown in every skill diff.
  Turbo runs the first three of those concurrently, so that script takes a lock
  and no-ops when the tree already matches the source; keep both properties if
  you touch it, and see its trailing "Concurrency" note for why the freshness
  check is required rather than merely an optimisation.
- `gen:mcp:check` runs `git add --intent-to-add` before diffing. The output is a
  directory, and `git diff --exit-code` cannot see an untracked file — a newly
  added component would otherwise pass the gate.

A library change that moves props means `pnpm gen` in the same PR, exactly like
the API pages and the skill catalog.

## Conventions

- **Responses are markdown, not JSON.** The consumer is a language model: a prop
  table costs fewer tokens than the same data as nested objects, and it does not
  tempt the model into echoing JSON structure into the code it writes.
- **Progressive disclosure.** `search_bestax` and `list_components` are cheap and
  every result names the tool to call next. Full prop tables, usage examples and
  skill references are separate calls. A tool that returns everything up front
  spends the context the client needs for the actual task.
- **No hardcoded roster.** Prompts, resources and skill lookups are all derived
  from `data/skills.json`, which the generator builds by reading the `skills/`
  directory. `skills/CLAUDE.md` already counts five places the roster is
  duplicated; do not add a sixth.
- **Nothing on stdout but JSON-RPC.** stdout _is_ the transport. Diagnostics go
  to stderr — a stray `console.log` surfaces to the user as an unexplained
  disconnect.
- **Version mismatch is reported, not hidden.** The index is pinned to the
  `bestax-bulma` release it was generated from; the server resolves the version
  actually installed in the user's project and appends a warning on minor or
  major drift. Patch drift stays silent on purpose — a note on every response is
  a note a model learns to skip. `BESTAX_MCP_NO_VERSION_CHECK=1` disables it.
- **Unhelpful answers are bugs.** A missing component suggests near misses by
  edit distance; a bad dot-path lists the real ones; a component with no CSS
  variables says so rather than returning blank. An empty response reads as a
  failed lookup and costs a retry.

## Dependencies

Two: `@modelcontextprotocol/sdk` and `zod` (the SDK's schema types are zod, and
pnpm's isolated linker means anything imported must be declared). The SDK pulls
~90 transitive packages, most of them for HTTP transports this server does not
use — that was measured against `pnpm audit --audit-level=high` before adopting
it, and it comes back clean. Re-check if that ever changes.

## Tests

`pnpm --filter bestax-mcp test`. Thresholds 95% / 78% branches, matching
`create-bestax`.

Tests drive the real protocol through the SDK's `InMemoryTransport` rather than
calling handlers directly: the contract that matters is what a client sees, and
that includes schema validation and the tool/resource/prompt listings. A handler
test would pass while the server advertised nothing.

They run against the committed index, not fixtures. The index is the product; a
test that stubs it proves nothing about what ships.
