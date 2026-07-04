# components/ — composite & interactive widgets

Bulma's _components_ (Breadcrumb, Card, Dropdown, Menu, Message, Modal, Navbar, Pagination,
Panel, Tabs) **plus the bestax extras** — components beyond stock Bulma: Carousel, Collapse,
Dialog, Loading, Sidebar, Steps, Toast, Tooltip.

**Belongs here?** Multi-part or stateful UI chrome. Single-element primitives go in
`../elements/`; page scaffolding in `../layout/`; inputs in `../form/`.

Conventions:

- Multi-part components use the compound pattern — `Card.Header`, `Navbar.Item`, `Modal.Card` —
  subcomponents attached to the parent, exported from the same file.
- **Stock Bulma components ship no CSS.** Extras pair with a partial in `../scss/components/`
  following the pattern in `../scss/CLAUDE.md`.
- A new extra (not in the Bulma spec) needs an issue discussion first — see "Component Scope"
  in `CONTRIBUTING.md`.
- Some components are polymorphic (`Navbar.Item`/`Menu.Item` accept `as`); keep polymorphism
  consistent when adding interactive items (#188 tracks widening `Button`).

Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).
