# Completeness addendum — `bulma-migrate`

What a finished migration of the app in [`bulma-migrate.md`](bulma-migrate.md) looks like:
the components each section should end up on, what must survive the move, and the guidance
category 7 expects. Supplied to the grader as `$COMPLETENESS`.

> **Grader-only. Never give this to the builder.** It names the components the brief
> deliberately does not. The runner only ever `cat`s the brief path it was passed, and the
> builder starts in the scaffolded app, outside this repo tree. That is a convention, **not
> enforced isolation**; see [`skynet-saas.completeness.md`](skynet-saas.completeness.md) for
> what guaranteeing it would take.

Frozen for the duration of a loop, like the rubric. Pairs with
[`../rubric-migrate.md`](../rubric-migrate.md) (rubric version 3) only: the build rubrics
score a site built from nothing, and this brief hands the builder one that already exists.

## The app the builder is handed

`bin/install-bulma-app.mjs` replaces the scaffold's `src/` with
[`../fixtures/bulma-app/src/`](../fixtures/bulma-app/src/) and adds `bulma`, before the
baseline commit, so `builder.diff` is the migration and nothing else. Read the fixture before
grading: it is the "before" every category compares against, and `metrics.baseline` holds
its numbers.

## Where each section should land — feeds rubric-migrate §2, §4 and §5

| Section (file)                | bestax components a full migration uses                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation (`SiteNavbar.tsx`) | `Navbar` with `Navbar.Brand`, `Navbar.Item`, `Navbar.Burger`, `Navbar.Menu`, `Navbar.Start`, `Navbar.End`; `Buttons`, `Button`                                                  |
| Hero (`Hero.tsx`)             | `Hero`, `Hero.Body`, `Container`, `Title`, `SubTitle`, `Buttons`, `Button` (an `as="a"` one for the link)                                                                       |
| Features (`Features.tsx`)     | `Section`, `Container`, `Title`, `SubTitle`, `Columns`, `Column`, `Card` with `Card.Header`, `Card.Header.Title`, `Card.Content`; `Content`, `Tags`, `Tag`                      |
| Pricing (`Pricing.tsx`)       | `Section`, `Container`, `Title`, `Tabs` with its items for the billing switch, `Table`, `Level`, `Level.Item`, `Tag`, `Progress`                                                |
| Team (`Team.tsx`)             | `Section`, `Container`, `Title`, `Notification`, `Delete`, `Media`, `Media.Left`, `Media.Content`, `Image`, `Content`                                                           |
| Contact (`Contact.tsx`)       | `Section`, `Columns`, `Column`, `Title`, `Field`, `Input`, `Select`, `TextArea`, `Checkbox`, `Buttons`/`Button`; `Modal` with its card parts, or `Dialog`, for the confirmation |
| Footer (`SiteFooter.tsx`)     | `Footer`, `Content`, `Paragraph`                                                                                                                                                |

Accept an equivalent where one renders the same thing (`Dialog` for the modal, a `Field`
laid out a different way that still labels each control). A class with no bestax prop may
stay in `className` (`heading` inside the level, a class the app defines); that is not a
leftover.

**Families**, for rubric-migrate §5: the navbar, the feature card, the pricing tabs, the
form controls, the confirmation modal, and the avatar image. The `bestax-migrate` codemod
leaves all or part of each as markup with a `TODO(bestax-migrate)`, so each is finished by
hand, from the component and its parts. The feature card is the partial one: the codemod
converts `Card` and `Card.Content`, but bestax renders `Card.Header.Title` on a `<div>`, so the
`<p>` title and the header around it stay.

## What must survive — feeds rubric-migrate §3

Check each against `builder.diff` and the final source. An item that renders differently,
does nothing, or is gone counts as lost.

1. **Every section and its copy**: navigation, hero, features, pricing, team, contact,
   footer, with their text unchanged.
2. **The in-page links and their targets**: the navigation and hero links to `#features`,
   `#pricing`, `#team` and `#contact`, the brand link to `#top`, and each section keeping
   the `id` its link scrolls to (the hero's "How it works" button looks `features` up by id).
3. **The mobile menu**: the burger opens and closes the menu.
4. **Monthly and yearly pricing**: the switch changes which option is active, the prices,
   and the price column's heading.
5. **The hiring notice**: it can be dismissed.
6. **The contact form**: each field is still labelled, the name and email fields are still
   required, the email one typed `email`, and Clear still resets the form.
7. **The confirmation**: sending the form opens it; the background, the close button and
   Done each close it again.
8. **The look**: same colours and layout. Moving the stylesheet from Bulma's to
   `@allxsmith/bestax-bulma/bestax.css` is allowed, but its primary colour differs from
   Bulma's, so a switch that is not re-themed to match changes how every primary element
   looks, which counts against this item.

## Guidance category 7 expects

- **Skills channel**: the `bestax-migrate` skill and its `bulma-classes` references
  (`component-map.md`, `prop-map.md`, `unmappables.md`); `bestax-form` for the contact form.
- **MCP channel**: `lookup_bulma_classes`, and `get_skill` for the two skills above.
- Running the codemod (`bestax-migrate bulma-classes`) counts as following the migrate
  skill's first step. It is not required: a hand migration that ends in the same place
  scores the same everywhere else.
