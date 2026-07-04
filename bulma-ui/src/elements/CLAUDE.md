# elements/ — simple building blocks

Bulma's _elements_: single-purpose components that render (mostly) one HTML element with Bulma
classes — Button, Box, Block, Content, Delete, Icon, Image, Notification, Progress, Table, Tag,
Title, …

**Belongs here?** One element, one Bulma concept, no internal state or subcomponents.
Interactive multi-part widgets (dropdowns, modals, …) go in `../components/`; page structure in
`../layout/`; anything with a `Field`/`Control` role in `../form/`.

Layout is flat: `Foo.tsx` + `Foo.stories.tsx`, with tests in `__tests__/Foo.test.tsx`.
Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).

Notes:

- Also home to plain semantic-HTML wrappers (Paragraph, Span, Strong, the Table family) that
  exist so helper props work on ordinary markup.
- Everything here is styled by stock Bulma — no SCSS, except extras like `LinkButton`
  (partial in `../scss/elements/`).
- `Icon` supports multiple icon libraries via the `library` prop (default `fa`); prefix handling
  has known sharp edges (#189) — don't change `name`/`icon` semantics casually.
