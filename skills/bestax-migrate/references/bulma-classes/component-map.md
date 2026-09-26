# Bulma classes → bestax-bulma component map

For apps that style plain JSX with Bulma's classes (`<div className="columns">`), not a React
wrapper library. The codemod converts an element only when the bestax component renders
**exactly the markup the element did**: same tag, same classes, same attributes. Anything else
stays as written, with a `TODO(bestax-migrate)` when there is something to decide (see
[unmappables.md](unmappables.md)).

A class the codemod doesn't know, such as the app's own `pricing-card`, rides along in
`className`, which every bestax component passes through. So does a Bulma class with no bestax
prop. Converting `<a className="button is-primary my-cta">` gives
`<Button as="a" color="primary" className="my-cta">`, and it renders the same `<a>`.

This table mirrors `ROOTS` in `bestax-migrate/src/sources/bulma-classes/class-map.ts`, and a
test holds it to that table. Render tests hold the table to the library itself.

## Components

The **Tags** column is what the component can render: an element on any other tag gets a
`tag:<Target>` TODO instead of a conversion.

| Bulma class          | bestax-bulma          | Tags                                                           |
| -------------------- | --------------------- | -------------------------------------------------------------- |
| `.block`             | `Block`               | `<div>` only                                                   |
| `.box`               | `Box`                 | `<div>` only                                                   |
| `.button`            | `Button`              | `<button>`, any tag via `as`                                   |
| `.buttons`           | `Buttons`             | `<div>` only                                                   |
| `.card`              | `Card`                | `<div>` only                                                   |
| `.card-header`       | `Card.Header`         | `<header>` only                                                |
| `.card-header-title` | `Card.Header.Title`   | `<div>` only                                                   |
| `.card-header-icon`  | `Card.Header.Icon`    | `<button>` only                                                |
| `.card-image`        | `Card.Image`          | `<div>` only                                                   |
| `.card-content`      | `Card.Content`        | `<div>` only                                                   |
| `.card-footer`       | `Card.Footer`         | `<footer>` only                                                |
| `.card-footer-item`  | `Card.FooterItem`     | `<span>` only                                                  |
| `.columns`           | `Columns`             | `<div>` only                                                   |
| `.column`            | `Column`              | `<div>` only                                                   |
| `.container`         | `Container`           | `<div>` only                                                   |
| `.content`           | `Content`             | `<div>` only                                                   |
| `.delete`            | `Delete`              | `<button>` only                                                |
| `.footer`            | `Footer`              | `<footer>`, `<div>` via `as`                                   |
| `.hero`              | `Hero`                | `<section>` only                                               |
| `.hero-head`         | `Hero.Head`           | `<div>` only                                                   |
| `.hero-body`         | `Hero.Body`           | `<div>` only                                                   |
| `.hero-foot`         | `Hero.Foot`           | `<div>` only                                                   |
| `.level`             | `Level`               | `<nav>` only                                                   |
| `.level-left`        | `Level.Left`          | `<div>` only                                                   |
| `.level-right`       | `Level.Right`         | `<div>` only                                                   |
| `.level-item`        | `Level.Item`          | `<div>`, `<p>`, `<a>` via `as`                                 |
| `.media`             | `Media`               | `<article>`, `<div>` via `as`                                  |
| `.media-left`        | `Media.Left`          | `<figure>`, `<div>` via `as`                                   |
| `.media-content`     | `Media.Content`       | `<div>` only                                                   |
| `.media-right`       | `Media.Right`         | `<div>` only                                                   |
| `.navbar`            | `Navbar`              | `<nav>` only                                                   |
| `.navbar-brand`      | `Navbar.Brand`        | `<div>` only                                                   |
| `.navbar-menu`       | `Navbar.Menu`         | `<div>` only                                                   |
| `.navbar-start`      | `Navbar.Start`        | `<div>` only                                                   |
| `.navbar-end`        | `Navbar.End`          | `<div>` only                                                   |
| `.navbar-item`       | `Navbar.Item`         | `<a>`, any tag via `as`                                        |
| `.navbar-dropdown`   | `Navbar.DropdownMenu` | `<div>` only                                                   |
| `.navbar-divider`    | `Navbar.Divider`      | `<hr>` only                                                    |
| `.notification`      | `Notification`        | `<div>` only                                                   |
| `.progress`          | `Progress`            | `<progress>` only                                              |
| `.section`           | `Section`             | `<section>` only                                               |
| `.subtitle`          | `SubTitle`            | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>` via `as` |
| `.table`             | `Table`               | `<table>` only                                                 |
| `.tag`               | `Tag`                 | `<span>` only                                                  |
| `.tags`              | `Tags`                | `<div>` only                                                   |
| `.title`             | `Title`               | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>` via `as` |

An element with two of these (`<div className="column box">`) becomes the layout one
(`Column`), and the other class stays in `className`.

`Card` renders its children inside a `.card-content` of its own unless one of them is one of
its parts, and `Card.Header` its children inside a `.card-header-title` unless one of them is a
`Card.Header.Title`. So a `.card` with children converts only when one of the elements written directly
inside it converts to a part (or already is one), and a `.card-header` only when its title
does. Otherwise it gets a `children:<Target>` TODO. Bulma's own example card uses a
`<p className="card-header-title">` and `<a className="card-footer-item">` links, which bestax
renders on a `<div>` and a `<span>`, so those stay markup with a `tag:<Target>` TODO, and so
does the header around that title.

`Navbar` writes `role="navigation"` and `aria-label="main navigation"`, the attributes Bulma's
own navbar carries, so a `.navbar` that sets both converts (whatever the label says), and one
that doesn't gets a `defaults:Navbar` TODO. A `.has-dropdown` item becomes a `Navbar.Item` that
keeps `has-dropdown` as a class, because a `Navbar.Dropdown` would give the `.navbar-link` inside
it dropdown semantics the markup didn't have. That link and the `.navbar-burger` stay markup with
a `family:<class>` TODO; converting either means building the dropdown or the toggle with bestax,
by hand. A `.navbar-divider` converts only when it carries no other class, since
`Navbar.Divider` drops its own class for a `className` it's given.

## Plain tags with helper classes

A tag bestax wraps becomes that wrapper when at least one of its classes converts to a helper
prop: `<p className="has-text-centered mt-4">` → `<Paragraph textAlign="centered" mt="4">`.

| Tag        | bestax-bulma    |
| ---------- | --------------- |
| `<p>`      | `Paragraph`     |
| `<span>`   | `Span`          |
| `<strong>` | `Strong`        |
| `<em>`     | `Emphasis`      |
| `<code>`   | `Code`          |
| `<pre>`    | `Pre`           |
| `<a>`      | `Link`          |
| `<li>`     | `ListItem`      |
| `<ol>`     | `OrderedList`   |
| `<ul>`     | `UnorderedList` |
| `<figure>` | `Figure`        |

bestax has no plain `<div>` wrapper, so `<div className="is-flex mt-4">` stays as it is, with
no TODO: it is valid Bulma, and nothing unsafe was skipped.

## Families this source leaves as markup

Their markup doesn't map element by element (the bestax component renders parts of its own, or
adds attributes), so the family's outermost class gets a `family:<class>` TODO and the markup
stays. [unmappables.md](unmappables.md) has the recipe for each. The families are Breadcrumb,
Checkbox, Checkboxes, Dropdown, Field (and Input, TextArea, Select, File), Grid and Cell,
Icon and IconText, Image, Menu, Message, Modal, the navbar's burger and dropdown link,
Pagination, Panel, Radio, Radios, Skeleton, `.table-container` and Tabs.

## Classes left alone

`.help`, `.label`, `.loader`, `.hero-buttons`, `.hero-video`, `.theme-dark`, `.theme-light`,
`.fa`, `.marginless`, `.paddingless`, `.navbar-content` and `.navbar-tabs` are valid Bulma with
nothing in bestax to convert to.
An element carrying one stays as written, and gets no TODO.
