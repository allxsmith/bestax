# layout/ — page-level structure

Bulma's _layout_ primitives (Container, Section, Hero, Level, Media, Footer), plus the extras
that do the same job: Splitter, panes the reader resizes. These scaffold a page: they make its
regions and divide the room between them, and present no content of their own.

**Belongs here?** Only structural wrappers a page is built from. Interaction doesn't rule one out:
Splitter's handles resize regions, the way Columns' gutters space them. If it's content chrome
(a card, a menu, a toast) or a box around one region's content (ScrollArea), it belongs in
`../components/`; column/grid systems have their own folders (`../columns/`, `../grid/`).

The stock ones ship no SCSS. An extra pairs with a partial in `../scss/layout/`, registered in
its `_index.scss`, per `../scss/CLAUDE.md`. Tests live in this folder's `__tests__/`.
Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).
