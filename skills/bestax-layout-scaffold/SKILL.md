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
- `Navbar.Burger`/`Navbar.Menu` are **controlled** — wire the same `active` state to both:
  `active` on `Navbar.Menu` shows/hides the mobile menu, while `active` + `onClick` on
  `Navbar.Burger` make the burger toggle it and animate. Left unwired, clicking the burger
  does nothing (no error, silent failure). For a `fixed="top"` `Navbar`, add the
  `has-navbar-fixed-top` class to `<html>` so content is not hidden behind it — the library
  does not do this automatically, and an inline padding offset is not a substitute.
- **Style with helper props, not inline `style`.** Use `m`/`p` spacing (`mt="4"` = 1rem),
  `textAlign="centered"`, and `textColor`/`bgColor` instead of `style={{ marginTop, textAlign,
color }}`. Set the app-wide icon library once with `<ConfigProvider iconLibrary="…">` at the root
  rather than `library` on every `<Icon>`.
- **CTAs on a colored hero must stay legible in both schemes.** On a fixed-color surface
  (`Hero color="primary"`, a dark banner), use **filled** buttons — `color="light"` or
  `color="primary" isInverted` — never a thin `isOutlined` secondary: a light outline + light
  label on a dark surface is low-contrast and gets worse under OS dark mode. And when the page's
  design is single-mode (a fixed light or dark look), pin it at the root —
  `<Theme isRoot colorMode="light">` — so a visitor's OS dark mode can't flip Bulma's text
  colors out from under the fixed palette (details: the `bestax-theming` skill's contrast rules).

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
- [ ] Style with helper props (`mt`/`p`, `textAlign`, `textColor`), not inline `style`.
- [ ] Set the icon library once via `<ConfigProvider iconLibrary="…">` at the root.
