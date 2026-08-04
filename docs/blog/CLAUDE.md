# blog — voice, post conventions, and the "The State of React" series

This file owns how posts get written here: the voice, the general post conventions, and (in the
back half) the runbook for the recurring component-comparison series. Site-wide build rules and
the LLM docs pipeline live in `docs/CLAUDE.md`.

## Voice & style (all posts)

Posts are written in Alex's voice. The register is conversational; the copy is clean. When in
doubt, reread the `:::info` admonition in the v2 release post (owning the accidental 2.0.0
version bump) and the intro of the first State of React edition: candid, plain, direct.

- **Get to the point.** The first sentence of the post, and of most sections, states the point.
  Background comes after, briefly, as a "why" before the "what".
- **Conversational register.** Contractions always. Short plain sentences. Write to one reader,
  not an audience. A rhetorical question is a good move ("So which one do you import?"), about
  one per post. Casual markers are welcome where they'd land in speech: "cool", "yeah",
  "kinda", "pretty" as an intensifier.
- **Candid, not salesy.** Own mistakes and rough edges plainly, the way the v2 post owns its
  accidental major bump. Never open with "We're excited to announce" (the pre-guide posts do;
  don't copy them). No superlatives, no hype adjectives. If a thing shipped late, say it
  shipped late.
- **Work all three appeals.** A post should persuade on ethos, pathos, and logos together.
  _Ethos_: write from first-hand maintainer experience, link your sources, and own the
  mistakes (the candor above is the credibility play). _Pathos_: name the pain a change
  removes and the small joy it adds; let the humor and era nods carry feeling, and never
  manufacture drama. _Logos_: back every claim with a reason, a number, a table, or runnable
  code (a live demo is an argument the reader can poke). Before publishing, check the draft
  lands all three: all logos reads like a changelog, and all pathos reads like marketing.
- **Structure the middle.** Hyphen bullets for detail dumps, numbered lists only for ordered
  procedures, bold on the load-bearing word, section headings even in medium-length posts.
- **MLA conventions.** MLA title case for the post title and headings (first word, last word,
  and all principal words capitalized; articles, prepositions, and coordinating conjunctions
  lowercase). Serial comma. Italicize standalone-work titles (_The State of React_). Cite by
  linking. Product tokens keep their branding (`bestax-bulma`, v3, pnpm) even in titles.
- **No em dashes. Ever.** Use a comma, parentheses, or a period instead. This covers prose,
  headings, and string literals inside demos (no `'—'` placeholder text). Older posts and the
  docs tree use them; leave those alone. The rule governs new blog writing.
- **Era references, sparingly.** Alex grew up in the 80s, 90s, and early 00s (NES, arcades,
  dial-up, mixtapes). One reference that genuinely fits beats three that don't; zero is fine.
- **Clean mechanics.** Casual voice, boring spelling. Proofread and prettier-format; the fast
  loose typos of email and chat don't ship.

## Post conventions (all posts)

- **File naming:** `docs/blog/YYYY-MM-DD-slug.md`, or the folder form `YYYY-MM-DD-slug/index.md`
  when the post ships images. The date prefix is the publish date; there is no `date:`
  frontmatter field. If a PR merges after the date in its filename, rename before merging.
- **Frontmatter:** `slug`, `title` (quote it when it contains a colon), `authors: [asmith]`
  (the only entry in `authors.yml`), and inline `tags: [...]`. `onInlineTags: 'ignore'` means a
  new tag needs no `tags.yml` entry; add one only for a custom label/permalink/description.
  dev.to syndication is opt-in: `publish_to_devto: true` plus a `cover_image`
  (`plugins/devto-preprocessor.js` skips posts without the flag). The preprocessor writes
  `build/.devto-publish/` copies with markdown images **and** root-relative `/docs/`+`/blog/`
  links rewritten to `https://bestax.io` URLs — so keep internal links root-relative even in
  syndicated posts. It rewrites `![]()` syntax only: a syndicated post's visible cover must be
  a markdown image, not a JSX `<img>` (which would reach dev.to unrewritten and broken).
- **Cover images** (any post, not just State of React): assets at
  `docs/static/img/<slug>.{svg,png}` — a hand-authored 1200×630 SVG rasterized to PNG (the
  State of React runbook's "Cover image" section has the Playwright recipe). Frontmatter
  `image:` and `cover_image:` point at the **PNG** (rooted `/img/...` path); the visible
  banner at the top of the body renders the **SVG**. The Floor Is React 18 (2026-08-03) is
  the reference example.
- **The fold:** `<!-- truncate -->` goes after a 1–3 sentence hook (the config warns when it's
  missing). A leading `:::info` admonition sits above the fold when the post needs one.
- **Live examples:** ` ```tsx live ` fences. Every library export plus `React`, `useState`, and
  `useEffect` is already in scope (`docs/src/theme/CodeBlock/index.js` spreads the whole
  package into react-live; import lines are stripped anyway). No inline `style={{}}`; use
  `Block`/helper props, and space children with `m*`/`p*` (there is no `gap` helper).
- **Links:** internal links are absolute (`/docs/...`, `/blog/...`); `onBrokenLinks: 'throw'`
  build-validates every one.
- **Verify:** `pnpm format`, then `pnpm exec turbo run build --filter=@allxsmith/bestax-docs`,
  then `pnpm format:check`. Commits and PR titles use the non-releasing `docs` type.

The rest of this file is the **runbook for the recurring component-comparison series** so each
edition is turnkey.

## What the series is

**"The State of React"** is a dated, honest snapshot comparing bestax against the other
mainstream React component libraries (Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and
react-bulma-components). Each edition is a point-in-time capture; we publish a fresh one on a
roughly **monthly** cadence rather than editing an old post.

Three files back every edition:

- `docs/src/data/componentComparison.js` — the matrix (capabilities × libraries), the per-cell
  link resolvers, and `lastReviewed`. **This is the source of truth** — the only file that
  changes between most editions.
- `docs/src/components/ComponentComparison/` — the React table that renders it (theme-aware,
  links every ✓/◐ to that library's docs). Rarely needs changes.
- `docs/blog/{YYYY-MM-DD}-state-of-react/index.md` — the edition post; imports and renders
  `<ComponentComparison />`.

## Conventions (keep these stable)

- **Title:** `The State of React — {Month YYYY}` — the month + year are required.
- **Folder / filename:** `docs/blog/{YYYY-MM-DD}-state-of-react/index.md` (folder form).
- **Slug:** `state-of-react-{YYYY-MM}`; set `canonical_url` to `https://bestax.io/blog/{slug}`.
- **Tag:** always include `state-of-react`. Its archive page,
  [`/blog/tags/state-of-react`](https://bestax.io/blog/tags/state-of-react), always lists
  the newest edition first — it is the canonical "latest edition" pointer that every edition's top
  `:::info` admonition links to. Do **not** change this tag.
- `authors: [asmith]`, `publish_to_devto: false` (the interactive table does not port to plain
  markdown / dev.to), and `hide_table_of_contents: true` (the wide table needs the room — this
  removes the right-hand TOC; the left blog sidebar is collapsed automatically via a scoped
  `:has(.sor-comparison)` rule in `src/css/custom.css`, so no per-post action is needed).
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

## Cover image

Each edition ships a synthwave/EDM cover (an homage to the "A State of Trance" radio show):

- **Source SVG:** `docs/static/img/state-of-react/{YYYY-MM}.svg` — for a new edition, copy the
  previous month's and update the month text and the `EP.` number.
- **Rasterize** it to `docs/static/img/state-of-react/{YYYY-MM}.png` at **1200×630** — SVG does
  not work as an `og:image` / dev.to `cover_image`, so a raster is required. Load the SVG in a
  headless browser at 1200×630 and screenshot it (this repo used Playwright + the pre-installed
  Chromium at `/opt/pw-browsers`).
- **Frontmatter:** point both `image:` and `cover_image:` at the `.png` (rooted `/img/...` path).
- **Visible banner:** at the very top of the post body, render the SVG full-width:
  `<img className="sor-cover" src="/img/state-of-react/{YYYY-MM}.svg" alt="…" />`.

## Verify

- `pnpm exec turbo run build --filter=@allxsmith/bestax-docs` — **must pass**;
  `onBrokenLinks: 'throw'` validates every internal bestax link and the tag-archive link.
- `pnpm format:check` (covers `md`/`mdx`) — run `pnpm format` to autofix.
- Spot-check a representative external link per library (these are not build-validated).
- `pnpm docs` and open `/blog/state-of-react-{YYYY-MM}`: confirm the table renders and scrolls
  on narrow widths, is legible in light **and** dark, and the admonitions + archive link work.

The blog is excluded from the LLM index (`includeBlog: false`) by design — this series is a dated
snapshot, not canonical reference documentation.
