# components/ — composite & interactive widgets

Bulma's _components_ (Card, Modal, Navbar, Dropdown, …) **plus the bestax extras** — components
beyond stock Bulma (Carousel, Dialog, Toast, …). The generated
`skills/bestax-custom-component/references/component-catalog.md` is the authoritative inventory.

**Belongs here?** Multi-part or stateful UI chrome. Single-element primitives go in
`../elements/`; page scaffolding in `../layout/`; inputs in `../form/`.

Conventions:

- Multi-part components use the compound pattern — `Card.Header`, `Navbar.Item`, `Modal.Card` —
  subcomponents attached to the parent, exported from the same file.
- **Stock Bulma components ship no CSS.** Extras pair with a partial in `../scss/components/`
  following the pattern in `../scss/CLAUDE.md` — and a stock component can still have an
  extending partial (Tabs gains vertical mode from `_tabs.scss`), so check
  `../scss/components/_index.scss` before assuming.
- A new extra (not in the Bulma spec) needs an issue discussion first — see "Component Scope"
  in `CONTRIBUTING.md`.
- Some components are polymorphic (`Navbar.Item`/`Menu.Item` accept `as`); keep polymorphism
  consistent when adding interactive items (#188 tracks widening `Button`).

Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).
