# blog — voice, post conventions, and the "The State of React" series

This file owns how posts get written here: the voice, the general post conventions, and (in the
back half) the runbook for the recurring component-comparison series. Site-wide build rules and
the LLM docs pipeline live in `docs/CLAUDE.md`.

## Voice & style (all posts)

Posts are written in Alex's voice. The register is conversational; the copy is clean. When in
doubt, reread the `:::info` admonition in the v2 release post (owning the accidental 2.0.0
version bump) and the intro of the first State of React edition: candid, plain, direct.

- **Get to the point.** On a release post or a how-to, the first sentence states the point.
  Background comes after, briefly, as a "why" before the "what". On a story post, that rule
  is what opens [Fighting AI Training Bias](https://bestax.io/blog/fighting-ai-training-bias)
  on a thesis. A story opens where the work started. See **Story posts** below.
- **Conversational register.** Contractions always. Short plain sentences. Write to one reader,
  not an audience. A rhetorical question is a good move ("So which one do you import?"), about
  one per post. Casual markers are welcome where they'd land in speech: "cool", "yeah",
  "kinda", "pretty" as an intensifier.
- **Candid, not salesy.** Own mistakes and rough edges plainly, the way the v2 post owns its
  accidental major bump. Never open with "We're excited to announce" (the pre-guide posts do;
  don't copy them). No superlatives, no hype adjectives. If a thing shipped late, say it
  shipped late.
- **Sell what the reader keeps, never the absence.** When the angle is something the library
  deliberately omits (no form library, no date library), state the stance once, factually,
  with the reasons, then let demos carry the argument: lead with what the reader keeps, name
  competing libraries neutrally, and include an explicit bring-your-own path. Titles too:
  "Form Library Agnostic" shipped over "Building Forms Without a Form Library" because
  absence-titles read as missing features (#471). The v3 post's "no date library in your
  bundle" paragraph is the model.
- **Every post stands alone for a stranger.** These posts syndicate; assume a reader who has
  never seen bestax or its repo. On a release post, introduce the project in a clause. On a
  story post, withhold the package name until the story needs it. Tell one story with an arc,
  and retell any prior post's needed context in a sentence or two instead of pointing at it.
  Repo artifacts — issue/PR numbers, internal file and check names, series numbering — are link
  receipts behind descriptive words, never narrative glue: "a form label [never wired to its
  input](…#368)", not "#368: form label wires no htmlFor". A mechanism catalog stitched with
  insider anchors reads disjointed to everyone but the maintainer (#478's draft was rewritten
  for exactly this).
- **Work every appeal.** A post should persuade on ethos, pathos, and logos together.
  _Ethos_: write from first-hand maintainer experience, link your sources, and own the
  mistakes (the candor above is the credibility play). _Pathos_: name the pain a change
  removes and the small joy it adds; let the humor and era nods carry feeling, and never
  manufacture drama. _Logos_: back every claim with a reason, a number, a table, or runnable
  code (a live demo is an argument the reader can poke). Before publishing, check the draft
  lands each of them: all logos reads like a changelog, and all pathos reads like marketing.
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

## Story posts

[Fighting AI Training Bias](https://bestax.io/blog/fighting-ai-training-bias) is what the voice
rules above produce when the assignment is personal and the writer composes a new essay.
It opens on a thesis ("A coding agent can't one-shot a library its training data barely saw"),
says the post is everything that ships today, then tours the tools: a skill list with blurbs,
Two Ways to Install, a demo whose job is to impress, Meeting Agents in `node_modules`, an MCP
"coming soon," and Point Your Agent at It. It closes on an install menu, "a star on the repo
is the whole marketing budget," and a slogan. "Post six of the catch-up series" is in the
prose. Do not write that again when the post is a story.

[Me Dealing with AI Training Bias](https://bestax.io/blog/dealing-with-ai-training-bias) is the
same material after Alex told it himself. The job is to clean that telling: spelling, true
dates, order, and a linked source where he guessed. Leave his sequence and his feelings. Do
not throw the telling out and write the essay the bullets above describe.

- **Clean his telling. Do not write a new one.** He already said the hole in 2024, the README
  and Reddit and the docs site, eleven stars, the models steering to Tailwind and shadcn/ui,
  the old Bulma package, the forms work, the messy source, `llms.txt` and skills and the
  types, and the hope that it moves slowly. The sentences should still sound like that
  telling.
- **Tell it in the order it happened, with the year.** 2024 was Bulma v1 and no React package
  ready for it. 2025 was trying to get found. Early 2026 was the forms redo. Summer 2026 was
  the AI work. Do not compress that into one season. A star count or a download week is "as I
  write this," dated, not the plot.
- **Say the feeling he would actually say.** "It was disappointing. I had talked myself into
  thinking it would take off" replaced "The odd part was how quiet it stayed." "Slow and
  steady, and I didn't give up" replaced "Slow, and I didn't stop." Do not upgrade a feeling
  into a slogan.
- **No coined verdicts.** A short sentence that announces the moral is the failure. Rejected:
  "Next to those numbers it is a thin slice," "Dead was the wrong guess," "Small is the
  accurate description," "The pages looked acceptable. The source did not," "Read that again
  before you take it as a win," "That was a useful embarrassment." If a sentence could be a
  pull quote, rewrite it as what happened.
- **Do not sell, and do not organize the post as a tour of the tools.** No feature inventory,
  and no "the guide has the list if you want to look." No install command in a story that is
  not a how-to. Links stay as receipts. The close is for another maintainer in the same spot,
  not an invitation to adopt the library. "I hope the steady work makes the library more
  appealing" was the pitch. "I hope the steady work wasn't wasted" was the post.
- **Headings name the stretch of time or the event**, not the moral. "A Summer of Trying
  Things," not "What I Built So a Model Could Read It."
- **Do not stack "So" at the start of sentences.** "I spent those months on the parts a real
  app needs" replaced "So I spent those months..."
- **Do not use a word stronger than the fact.** Bulma is not "dead" while the repo still ships
  fixes. People are not reaching for it. That is the claim.
- **Do not invent a second finding from a study about something else.** "I figure npm search
  is in the same place" came out. The Google point is a real article: [Pew, July
  2025](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/),
  on clicks when an AI summary is on the page (8% versus 15%; the session ended there 26%
  versus 16%). Link it. Say what it measured. Then say what you do not have a study for.
- **When a model's answer is the scene, show the prompt and the opening of the reply.** A
  fenced prompt, then the first few sentences, and whether effort had to be turned up. From
  this post: "What react library would you recommend for a new web app that uses Bulma"
  (effort up) and "What is the best react bulma library" (without). Do not paraphrase the
  reply into a smoother ad.
- **Keep his image if he used one.** The tortoise and Field of Dreams stayed because they were
  his. Do not swap in a cleverer one, and do not add extras. The era-reference rule above
  still caps new ones the writer thought of.
- **The fold stays 1–3 sentences** even when the story continues right under it. Five
  sentences above `<!-- truncate -->` fails. The rest of the opening moves below the marker.
- **Cover alt text describes the picture, including the words drawn in it.** A shared drawing
  that says "Fighting AI Training Bias" keeps that description, and the SVG `aria-label`
  stays in lockstep. Do not retitle the alt to match a different post.

Release posts and how-tos still follow the bullets above this subsection. Contractions, no em
dashes, MLA titles, no "We're excited to announce," cited numbers, and plain markdown when the
post syndicates all still hold.

## Post conventions (all posts)

- **A published post stays what it was.** A different piece, even on the same theme, is a new
  file and a new slug. _Fighting AI Training Bias_ stayed the tool tour. _Me Dealing with AI
  Training Bias_ is the separate story. Do not "improve" a live post into a different one.
- **File naming:** `docs/blog/YYYY-MM-DD-slug.md`. The date prefix is the publish date; there
  is no `date:` frontmatter field. If a PR merges after the date in its filename, rename
  before merging. A post that will syndicate stays a **flat `.md` even when it ships images**
  (assets go to `docs/static/img/<slug>*.{svg,png}`): `devto-preprocessor.js` writes
  `build/.devto-publish/<basename>`, so a folder post emits a colliding `index.md`, and only
  `/img/`-rooted markdown images rewrite cleanly. The folder form `YYYY-MM-DD-slug/index.md`
  is for posts that will never syndicate (State of React uses it, with
  `publish_to_devto: false`).
- **Frontmatter:** `slug`, `title` (quote it when it contains a colon), `authors: [asmith]`
  (the only entry in `authors.yml`), and inline `tags: [...]`. `onInlineTags: 'ignore'` means a
  new tag needs no `tags.yml` entry; add one only for a custom label/permalink/description.
  dev.to syndication and cover images are opt-in per post — see the two sections below.
  A post with `slug:` sets `canonical_url: https://bestax.io/blog/<slug>`; older date-path
  canonicals predate this — don't copy them.
- **The fold:** `<!-- truncate -->` goes after a 1–3 sentence hook (the config warns when it's
  missing). A leading `:::info` admonition sits above the fold when the post needs one.
- **Live examples:** ` ```tsx live ` fences. Every library export plus `React`, `useState`, and
  `useEffect` is already in scope (`docs/src/theme/CodeBlock/index.js` spreads the whole
  package into react-live; import lines are stripped anyway). No inline `style={{}}`; use
  `Block`/helper props, and space children with `m*`/`p*` (there is no `gap` helper).
- **Links:** internal links are absolute (`/docs/...`, `/blog/...`); `onBrokenLinks: 'throw'`
  build-validates every one. The LLM artifacts (`/llms.txt`, `/llms-full.txt`, and every
  page's `.md` twin) are generated files, not routes — link them fully qualified
  (`https://bestax.io/llms.txt`); a root-relative form fails the build's link check, and the
  dev.to rewrite only covers `/docs` and `/blog`.
- **Verify:** `pnpm format`, then `pnpm exec turbo run build --filter=@allxsmith/bestax-docs`,
  then `pnpm format:check`. Commits and PR titles use the non-releasing `docs` type.

## Syndication (dev.to and Medium)

Opt-in per post: `publish_to_devto: true` plus a `cover_image` in the frontmatter
(`plugins/devto-preprocessor.js` skips posts without the flag). Publishing to dev.to itself
stays a manual act — the build only generates the files.

- **A syndicated post must ship a hero/cover image.** Any post with `publish_to_devto: true`
  (or headed to Medium) follows the "Cover images" section below in full: SVG + PNG assets,
  `image:`/`cover_image:` frontmatter, and the visible markdown banner at the top of the
  body. A coverless post renders bare on both platforms.
- Each flagged post gets a copy in `build/.devto-publish/` with production URLs: markdown
  images and root-relative `/docs/` + `/blog/` links (reference-style definitions included)
  are rewritten to `https://bestax.io/...`. Fenced code blocks are never touched.
- Keep internal links root-relative in the source — the rewrite handles dev.to, and
  `onBrokenLinks: 'throw'` keeps build-validating them.
- The rewrites cover markdown syntax only, so a syndicated post is **plain markdown
  throughout**: no JSX components (they reach dev.to as raw text) and no `:::` admonitions.
  That includes the docs-tree `<PackageManagerTabs>` convention — install commands in a
  syndicated post use a plain fence (most aren't pnpm-derivable anyway) — and the visible
  cover, which must be a markdown image (`![…](/img/…)`), not a JSX `<img>`. (State of React
  editions may use JSX because they set `publish_to_devto: false`.)

Medium is manual end to end: there is no Medium plugin. Publish on bestax.io first, then use
Medium's import-a-story flow on the live `https://bestax.io/blog/<slug>` URL so Medium records
the canonical source; the cover PNG doubles as the story's feature image.

## Cover images (any post)

Any post can ship a cover, not just State of React editions; _The Floor Is React 18_
(2026-08-03) is the reference example.

- **Assets:** `docs/static/img/<slug>.svg` (hand-authored, 1200×630, with a full-bleed
  background rect and explicit `width`/`height` attributes; the script refuses to rasterize
  without them) plus a PNG raster at the same stem. Generate the PNG with
  `pnpm --filter @allxsmith/bestax-docs rasterize:cover static/img/<slug>.svg`
  (`scripts/rasterize-cover.mjs` screenshots the SVG in headless Chromium at exactly
  1200×630 and writes the sibling `.png`). Missing Chromium? Once:
  `pnpm --filter @allxsmith/bestax-docs exec playwright install chromium`.
- **Frontmatter:** `image:` and `cover_image:` both point at the **PNG** (rooted `/img/...`
  path); `og:image` and dev.to need a raster.
- **Body:** the visible banner at the very top renders the **SVG**, crisp at any width.
- **Section images** (optional, for flagship posts): each in-body image follows the same
  1200×630 contract and rasterizer, stems `docs/static/img/<slug>-<topic>.{svg,png}`. Only
  the top banner embeds the SVG; every other in-body image embeds the **PNG** (dev.to and
  Medium handle rasters reliably).
- **Alt text** is a long, literal description of the pixel-art scene (see the v5 banner),
  not a caption; mirror it into the SVG's `aria-label`.
- Covers can be hand-authored or scripted against `docs/scripts/pixel-cover-lib.mjs` (the
  5×7 pixel font, house palette, and bevel/starfield helpers behind the existing covers);
  either way `rasterize:cover` is the gate.

The rest of this file is the **runbook for the recurring component-comparison series** so each
edition is turnkey.

## What the series is

**"The State of React"** is a dated, honest snapshot comparing bestax against the other
mainstream React component libraries (Mantine, MUI, Chakra UI, shadcn/ui, React-Bootstrap, and
react-bulma-components). Each edition is a point-in-time capture; we publish a fresh one on a
roughly **monthly** cadence rather than editing an old post.

These files back every edition:

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
- Keep the admonitions: top `:::info` (snapshot date + latest-edition link), `:::tip`
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
  not work as an `og:image` / dev.to `cover_image`, so a raster is required. Run
  `pnpm --filter @allxsmith/bestax-docs rasterize:cover static/img/state-of-react/{YYYY-MM}.svg`.
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
