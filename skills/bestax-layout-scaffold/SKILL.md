---
name: bestax-layout-scaffold
description: Scaffold a complete, responsive page layout with @allxsmith/bestax-bulma — app shells/dashboards, marketing/landing pages, centered auth/settings pages, and card-grid catalogs. Use when building a full page or overall app layout (not a single component).
license: MIT
---

# Scaffolding a page layout with @allxsmith/bestax-bulma

Turn a high-level request ("admin dashboard", "landing page", "login screen", "product catalog")
into a complete responsive page built from bestax-bulma layout components.

## Behavioral rule

Select an archetype from the request and build it in one shot. Do **not** ask layout questions
("how many columns?", "where should the nav go?", "what width?") — infer the structure from the
request and proceed. The archetype determines the structure; fill it with the requested content.

Ask **at most one** clarifying question, and only for a high-level fork the request genuinely does
not imply: whether the page is **public-facing** (marketing) or an **internal tool** (authenticated
app). When the request already signals this ("dashboard", "admin", "landing", "login", "pricing"),
skip the question and default.

## Select an archetype

| Request signals                                                        | Archetype     |
| ---------------------------------------------------------------------- | ------------- |
| dashboard, admin, console, internal tool, authenticated app, "sidebar" | **App shell** |
| landing, marketing, homepage, product/pricing page, public site        | **Landing**   |
| login, sign up, auth, settings, checkout, a single focused form        | **Centered**  |
| catalog, gallery, products, listing, "grid of cards", search results   | **Card grid** |

Default when ambiguous: internal tool → App shell; public-facing → Landing; one focused task →
Centered; a collection of items → Card grid. For mixed requests, pick the dominant intent (e.g.
"admin dashboard with a product list" → App shell whose main column holds a Card grid).

## Approach

- Compose pages from the shipped layout components — `Container`, `Section`, `Hero`, `Footer`,
  `Level`, `Columns`/`Column`, `Grid`/`Cell`, `Navbar`, `Menu`, `Card`. There is **no `Tile`
  component**. For **uniform grids** (card grids, galleries — same-shaped items) prefer
  `Grid`/`Cell`: CSS Grid gives equal-height cells for free (per row — each row's cells match
  its tallest, same row-level behavior as the flex recipe). Use `Columns`/`Column` for
  proportional or per-breakpoint column layouts — and when cards there must be equal height,
  apply the flex recipe (`Column display="flex" flexDirection="column"` + `Card flexGrow="1"`;
  `height: 100%` on the card doesn't help — the column's height is auto).
- Rely on Bulma's responsive defaults: `Columns` sit side by side on tablet and up and stack on
  mobile. Add responsive `size*` props only to tune the breakpoints.
- Interactive extras don't share a state API — never transfer one by analogy:
  `Collapse trigger={node} open/defaultOpen onOpen/onClose`, `Tabs value={i}/onChange`
  (each `Tabs.Tab`/`Tabs.Content.Item` requires `index={i}`, and `Tabs.Content` must be a
  **child of `<Tabs>`** — the active-tab context lives on it; a sibling panel never
  switches), `Dropdown active/onActiveChange`,
  `Steps value={i}/onStepClick items={[{label, icon?}]}` (child form is `Steps.Step`, not
  `Steps.Item`). `Reveal cascade` staggers only its **direct children** — to stagger a grid,
  put `<Reveal delay={i * 80}>` inside each `Cell`, not around the container.
- Link lists (footer nav, sidebars): a bare `UnorderedList` of `ListItem`s is already
  marker-less and flush — Bulma's reset unstyles `ul` — so no prop or CSS is needed;
  bullets appear only inside `Content`.
- `Navbar.Burger`/`Navbar.Menu` are **controlled** — wire the same `active` state to both:
  `active` on `Navbar.Menu` shows/hides the mobile menu, while `active` + `onClick` on
  `Navbar.Burger` make the burger toggle it and animate. Left unwired, clicking the burger
  does nothing (no error, silent failure). For a `fixed="top"` `Navbar`, add the
  `has-navbar-fixed-top` class to `<html>` so content is not hidden behind it — the library
  does not do this automatically, and an inline padding offset is not a substitute.
- **Style with helper props — no inline `style`, no raw Bulma `className`s.** Before writing
  `style={{ … }}` anywhere, translate each declaration with the mapping table below — the helper
  props cover the common cases. Bare markup has wrapper elements that take all
  helper props: `<Span textSize="7" textColor="grey">`, `Paragraph`, `Strong` — never a raw
  `<span className="is-size-7 has-text-grey">`. Table cells: `Th`/`Td` take `textAlign="right"`,
  `textWeight`, `textSize` directly (their `color` prop colors the cell; for muted cell text
  wrap content in `Span textColor="grey"`). Set the app-wide icon library once with
  `<ConfigProvider iconLibrary="…">` at the root rather than `library` on every `<Icon>`.
- **Alternating section bands are a prop, not CSS: `bgColor="scheme-main-bis"` on every
  other `Section` (next band `scheme-main-ter`).** The scheme values render as a
  dark-mode-safe inline `background-color: var(--bulma-scheme-*)` — zero custom CSS — and
  still never `bgColor="light"`/`"white"`: those are fixed colors that stay light when dark
  mode flips the text.
- **Decorative CSS is budgeted: two compact rules, ≤10 lines per app — comments count:
  at most one short inline note, never a file-header comment block — every value derived
  from `--bulma-*`.** A marketing page gets at most one hero wash and one featured-card
  ring, applied via `className` — no resets (Bulma ships one;
  body/list margins are already zero) and no grid textures, masks, or multi-layer backdrops;
  the components carry the design:

  ```css
  .hero-wash {
    background-image: radial-gradient(
      60rem 30rem at 20% -10%,
      hsl(var(--bulma-primary-h) var(--bulma-primary-s) 50% / 0.2),
      transparent 60%
    );
  }
  .featured-ring {
    --bulma-shadow: 0 0 0 2px var(--bulma-primary);
  }
  ```

  The ring works by overriding the **upstream token**, not the component's own var: `.card`
  and `.box` re-declare `--bulma-card-shadow`/`--bulma-box-shadow` from `--bulma-shadow` on
  their own selector, so setting _those_ from an ancestor never wins (same for
  `--bulma-box-radius`; `--bulma-card-radius` is a literal with no ancestor route at all).
  A class-scoped CSS rule keeps the ring on just the one featured card without wrapping it in
  its own `Theme`; `<Theme bulmaVars={{ '--bulma-shadow': … }}>` also compiles and is the
  better fit when the override already applies to a whole scoped subtree. Either way the
  subtree stays theme- and dark-mode-aware.

- **CTAs on a colored hero must stay legible in both schemes.** On a fixed-color surface
  (`Hero color="primary"`, a dark banner), use **filled** buttons — `color="light"` or
  `color="primary" isInverted` — never a thin `isOutlined` secondary: a light outline + light
  label on a dark surface is low-contrast and gets worse under OS dark mode. And when the page's
  design is single-mode (a fixed light or dark look), pin it at the root —
  `<Theme isRoot colorMode="light">` — so a visitor's OS dark mode can't flip Bulma's text
  colors out from under the fixed palette (details: the `bestax-theming` skill's contrast rules).

## Three components core Bulma will talk you out of

Most of this library's additions get found on their own, because nothing in Bulma does the
job. These three do not: each has a Bulma near-miss close enough to stop the search. Across
44 cold-start builds, `Dialog` was used **zero** times and `LinkButton` in two thirds — and
every miss shipped the "not this" column instead.

| You need                                                    | Use                                                                                                                                                             | Not this                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A brief confirmation after an action, self-dismissing       | `Toast` — mount `<ToastContainer position="top-right" />` once at the app root, then `toast.success('Saved')` (also `.danger`/`.warning`/`.info`) from anywhere | `Notification`/`Message` — static page elements you have to place, position and dismiss yourself                     |
| A confirm or alert the user must answer before anything     | `Dialog` — mount `<DialogContainer />` at the root, then `if (await dialog.confirm({ title, message })) …`                                                      | `Modal` — an empty shell; the title, message, button row and confirm/cancel wiring are all yours to rebuild          |
| A control that reads as text or a link but _does_ something | `LinkButton` (`variant="text" \| "ghost" \| "underline"`, optional `color`)                                                                                     | `<a href="#">`/`<div onClick>` (no keyboard or screen-reader support) or `Button color="text"` (still button-shaped) |

Mounting a container without ever calling `toast.*`/`dialog.*` is not usage — the container is
the mount point, the imperative call is the thing that shows something. Both also work as
ordinary controlled components when you would rather hold the state yourself —
`<Toast message … duration onClose>`, `<Dialog isOpen title message type onConfirm onCancel>` —
but in an app with more than one call site the root container plus the imperative helper is
less wiring, not more.

## Inline style → helper prop mapping

Look up the declaration you were about to inline. The spacing, typography, and flex helpers
below are on every component; `textColor`/`bgColor` are on the content components you'll
target (`Box`, `Block`, `Title`, `Content`, `Hero`, `Card`, …) — the ones with a semantic
`color` variant (`Tag`, `Tabs`, `Panel`) take `color` instead; wrap content in a `Block` if
you need a text color there. `Notification` is the mixed case: it takes `textColor`, but its
background comes from the semantic `color` prop, not `bgColor`.

| Inline style you're about to write       | Helper props instead                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marginTop: '1rem'` (any margin/padding) | `mt="4"` — `m`/`mt`/`mx`/`p`/`py`/… scale: `1`=0.25rem, `2`=0.5rem, `3`=0.75rem, `4`=1rem, `5`=1.5rem, `6`=3rem (nearest step)                                 |
| `textAlign: 'center'`                    | `textAlign="centered"` (also `left`, `right`, `justified`)                                                                                                     |
| `color: '#…'`                            | `textColor` with the nearest Bulma color: `primary`, `link`, `info`, `success`, `warning`, `danger`, `white`, `black`, `grey` (+ `grey-light`, `grey-dark`, …) |
| `backgroundColor: '#…'`                  | `bgColor` (same palette)                                                                                                                                       |
| `fontSize: …`                            | `textSize="1"`…`"7"` (`1` largest) — for headings use `Title`/`SubTitle` `size`                                                                                |
| `fontWeight: …`                          | `textWeight`: `light`, `normal`, `medium`, `semibold`, `bold`                                                                                                  |
| `textTransform`, italics                 | `textTransform`: `uppercase`, `lowercase`, `capitalized`, `italic`                                                                                             |
| `display: 'flex'` + flex properties      | same-named props: `display="flex"`, `flexDirection`, `justifyContent`, `alignItems`, `flexWrap`                                                                |
| `height: '100%'` on a flex child         | `flexGrow="1"`                                                                                                                                                 |
| `display: 'none'`                        | `visibility="hidden"`, or responsive `display*` props (`displayMobile`, `displayTablet`, …)                                                                    |
| `gap: …` in a flex layout                | no `gap` helper exists — space children with `m*` margins; `Grid` and `Columns` take a `gap` prop, so prefer those there                                       |

No helper matches (e.g. `maxWidth`, a one-off gradient)? Add a named class to the project
stylesheet (`src/App.css` in a scaffolded app) and pass it via `className` — still never
inline `style`.

## References

- `references/layout-components.md` — the layout component inventory: real prop names, types, and
  accepted values, plus subcomponent nesting.
- `references/archetypes.md` — the four archetypes: selection criteria, JSX skeleton, and responsive
  behavior.

## Examples

- `examples/app-shell.tsx` — fixed `Navbar` + sidebar `Menu` + content (dashboard).
- `examples/landing.tsx` — fixed `Navbar` (controlled burger) + `Hero` + `Section`s + `Footer`.
- `examples/centered.tsx` — centered single column (auth/settings).
- `examples/card-grid.tsx` — multiline `Columns` of `Card`s (catalog).
- `examples/content-page.tsx` — hero + feature cards + CTA styled with helper props (no inline
  `style`), wrapped in `ConfigProvider`.

## Checklist

- [ ] Map the request to one archetype; do not ask layout questions.
- [ ] Wrap page content in `Container` (+ `Section` for vertical rhythm).
- [ ] Use `Grid`/`Cell` for uniform grids (equal heights per row, free); `Columns`/`Column`
      for proportional or per-breakpoint side-by-side layout — with the flex recipe when its
      cards must match height.
- [ ] Wire `active` state to **both** `Navbar.Burger` and `Navbar.Menu` (they are controlled).
- [ ] For a fixed navbar, add `has-navbar-fixed-top` to `<html>`.
- [ ] Do not use `Tile` — it is not shipped.
- [ ] Action feedback goes through `Toast`, a confirmation through `Dialog`, a text-styled
      action through `LinkButton` — not `Notification`, `Modal` or a bare `<a>`.
- [ ] Style with helper props, not inline `style` — translate via the mapping table; values
      with no helper get a named class in the stylesheet, never `style={{}}`. No raw Bulma
      `className`s either (`Span`/`Paragraph` wrap bare text; `Th`/`Td` take `textAlign`/`textWeight`).
- [ ] Alternating bands are `bgColor="scheme-main-bis"` (next band `scheme-main-ter`) on
      every other `Section` — never band CSS, never `bgColor="light"`/`"white"`.
- [ ] Decorative CSS ≤10 lines total incl. comments — no file-header comment (hero wash +
      featured-card ring), `--bulma-*`-derived; no resets — Bulma ships one.
      The ring sets `--bulma-shadow` (via a scoped CSS rule or `Theme bulmaVars`).
- [ ] Set the icon library once via `<ConfigProvider iconLibrary="…">` at the root.
- [ ] Site built? ~800 KB raw / ~82 KB gzip CSS is the expected default-flavor size — to shrink
      it, run the `bestax-optimize` skill (measure first).
