# blog — posts, and the "A State of React Libs" series

General blog conventions live in `docs/CLAUDE.md` (frontmatter, `authors.yml`, the
`<!-- truncate -->` fold, and dev.to syndication via `plugins/devto-preprocessor.js`). This file
is the **runbook for the recurring component-comparison series** so each edition is turnkey.

## What the series is

**"A State of React Libs"** is a dated, honest snapshot comparing bestax against the other
mainstream React component libraries (Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and
react-bulma-components). Each edition is a point-in-time capture; we publish a fresh one on a
roughly **monthly** cadence rather than editing an old post.

Three files back every edition:

- `docs/src/data/componentComparison.js` — the matrix (capabilities × libraries), the per-cell
  link resolvers, and `lastReviewed`. **This is the source of truth** — the only file that
  changes between most editions.
- `docs/src/components/ComponentComparison/` — the React table that renders it (theme-aware,
  links every ✓/◐ to that library's docs). Rarely needs changes.
- `docs/blog/{YYYY-MM-DD}-state-of-react-libs/index.md` — the edition post; imports and renders
  `<ComponentComparison />`.

## Conventions (keep these stable)

- **Title:** `A State of React Libs — {Month YYYY}` — the month + year are required.
- **Folder / filename:** `docs/blog/{YYYY-MM-DD}-state-of-react-libs/index.md` (folder form).
- **Slug:** `state-of-react-libs-{YYYY-MM}`; set `canonical_url` to `https://bestax.io/blog/{slug}`.
- **Tag:** always include `state-of-react-libs`. Its archive page,
  [`/blog/tags/state-of-react-libs`](https://bestax.io/blog/tags/state-of-react-libs), always lists
  the newest edition first — it is the canonical "latest edition" pointer that every edition's top
  `:::info` admonition links to. Do **not** change this tag.
- `authors: [asmith]`, `publish_to_devto: false` (the interactive table does not port to plain
  markdown / dev.to), and `hide_table_of_contents: true` (the wide table needs the room — this
  removes the right-hand TOC; the left blog sidebar is collapsed automatically via a scoped
  `:has(.sorl-comparison)` rule in `src/css/custom.css`, so no per-post action is needed).
- Keep the four admonitions: top `:::info` (snapshot date + latest-edition link), `:::tip`
  (headline insight), `:::note` (shadcn is a copy-paste registry, not a dependency), `:::caution`
  (corrections → GitHub issues).

## Publishing a new monthly edition

1. **Update the data** in `docs/src/data/componentComparison.js`:
   - Adjust the matrix for anything that shipped or moved since last month (new components,
     renamed docs, packages promoted out of "lab"/experimental).
   - Cell encoding: `"Name"` = dedicated component · `"~Name"` = via prop/composition · `0` = none.
   - Fix or extend the per-library link resolvers/override maps as needed. **bestax** cells are
     internal `/docs/api/...` links (validated by the build); competitor links are best-effort deep
     links with a per-library fallback — improve a fallback → deep link when you confirm a stable URL.
   - **Bump `lastReviewed`** to the review date (`YYYY-MM-DD`).
2. **Create the edition post** by copying the previous month's `index.md`, updating the frontmatter
   (title, slug, canonical_url, date in the folder name) and the prose/insights. Keep
   `import ComponentComparison ...` and `<ComponentComparison />`.
3. **Verify** (see below), then commit with a `docs` type and push. Open a PR to `main` only when
   asked.

## Verify

- `pnpm exec turbo run build --filter=@allxsmith/bestax-docs` — **must pass**;
  `onBrokenLinks: 'throw'` validates every internal bestax link and the tag-archive link.
- `pnpm format:check` (covers `md`/`mdx`) — run `pnpm format` to autofix.
- Spot-check a representative external link per library (these are not build-validated).
- `pnpm docs` and open `/blog/state-of-react-libs-{YYYY-MM}`: confirm the table renders and scrolls
  on narrow widths, is legible in light **and** dark, and the admonitions + archive link work.

The blog is excluded from the LLM index (`includeBlog: false`) by design — this series is a dated
snapshot, not canonical reference documentation.
