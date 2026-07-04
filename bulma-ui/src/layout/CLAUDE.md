# layout/ — page-level structure

Bulma's _layout_ primitives: Container, Section, Hero, Level, Media, Footer. These scaffold a
page; they don't render widgets.

**Belongs here?** Only structural wrappers a page is built from. If it's content chrome
(a card, a menu, a toast) it belongs in `../components/`; column/grid systems have their own
folders (`../columns/`, `../grid/`).

All are stock Bulma — no SCSS. Tests live in this folder's `__tests__/`.
Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).
