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

The **Tags** column is what the codemod converts the class on: an element on any other tag gets
a `tag:<Target>` TODO instead of a conversion. A component's own `as` can take more. One exception:
a `<label>` or `<div>` `.panel-block` stays markup with no TODO, since bestax renders those as
`Panel.CheckboxBlock`, `Panel.InputBlock` and `Panel.ButtonBlock`, which build their own contents.

| Bulma class            | bestax-bulma          | Tags                                                           |
| ---------------------- | --------------------- | -------------------------------------------------------------- |
| `.block`               | `Block`               | `<div>` only                                                   |
| `.box`                 | `Box`                 | `<div>` only                                                   |
| `.button`              | `Button`              | `<button>`, any tag via `as`                                   |
| `.buttons`             | `Buttons`             | `<div>` only                                                   |
| `.card`                | `Card`                | `<div>` only                                                   |
| `.card-header`         | `Card.Header`         | `<header>` only                                                |
| `.card-header-title`   | `Card.Header.Title`   | `<div>`, `<p>`, `<h2>`, `<h3>`, `<h4>` via `as`                |
| `.card-header-icon`    | `Card.Header.Icon`    | `<button>` only                                                |
| `.card-image`          | `Card.Image`          | `<div>` only                                                   |
| `.card-content`        | `Card.Content`        | `<div>` only                                                   |
| `.card-footer`         | `Card.Footer`         | `<footer>` only                                                |
| `.card-footer-item`    | `Card.FooterItem`     | `<span>`, `<a>`, `<button>` via `as`                           |
| `.columns`             | `Columns`             | `<div>` only                                                   |
| `.column`              | `Column`              | `<div>` only                                                   |
| `.grid`                | `Grid`                | `<div>` only                                                   |
| `.cell`                | `Cell`                | `<div>` only                                                   |
| `.container`           | `Container`           | `<div>` only                                                   |
| `.content`             | `Content`             | `<div>` only                                                   |
| `.delete`              | `Delete`              | `<button>` only                                                |
| `.field`               | `Field`               | `<div>` only                                                   |
| `.field-label`         | `Field.Label`         | `<div>` only                                                   |
| `.field-body`          | `Field.Body`          | `<div>` only                                                   |
| `.control`             | `Control`             | `<div>`, `<p>` via `as`                                        |
| `.input`               | `InputBase`           | `<input>` only                                                 |
| `.textarea`            | `TextAreaBase`        | `<textarea>` only                                              |
| `.select`              | `SelectBase`          | `<div>` only                                                   |
| `.footer`              | `Footer`              | `<footer>`, `<div>` via `as`                                   |
| `.hero`                | `Hero`                | `<section>` only                                               |
| `.hero-head`           | `Hero.Head`           | `<div>` only                                                   |
| `.hero-body`           | `Hero.Body`           | `<div>` only                                                   |
| `.hero-foot`           | `Hero.Foot`           | `<div>` only                                                   |
| `.level`               | `Level`               | `<nav>` only                                                   |
| `.level-left`          | `Level.Left`          | `<div>` only                                                   |
| `.level-right`         | `Level.Right`         | `<div>` only                                                   |
| `.level-item`          | `Level.Item`          | `<div>`, `<p>`, `<a>` via `as`                                 |
| `.media`               | `Media`               | `<article>`, `<div>` via `as`                                  |
| `.media-left`          | `Media.Left`          | `<figure>`, `<div>` via `as`                                   |
| `.media-content`       | `Media.Content`       | `<div>` only                                                   |
| `.media-right`         | `Media.Right`         | `<div>` only                                                   |
| `.navbar`              | `Navbar`              | `<nav>` only                                                   |
| `.navbar-brand`        | `Navbar.Brand`        | `<div>` only                                                   |
| `.navbar-menu`         | `Navbar.Menu`         | `<div>` only                                                   |
| `.navbar-start`        | `Navbar.Start`        | `<div>` only                                                   |
| `.navbar-end`          | `Navbar.End`          | `<div>` only                                                   |
| `.navbar-item`         | `Navbar.Item`         | `<a>`, any tag via `as`                                        |
| `.navbar-dropdown`     | `Navbar.DropdownMenu` | `<div>` only                                                   |
| `.navbar-divider`      | `Navbar.Divider`      | `<hr>` only                                                    |
| `.notification`        | `Notification`        | `<div>` only                                                   |
| `.progress`            | `Progress`            | `<progress>` only                                              |
| `.section`             | `Section`             | `<section>` only                                               |
| `.subtitle`            | `SubTitle`            | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>` via `as` |
| `.table`               | `Table`               | `<table>` only                                                 |
| `.tag`                 | `Tag`                 | `<span>` only                                                  |
| `.tags`                | `Tags`                | `<div>` only                                                   |
| `.title`               | `Title`               | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<p>` via `as` |
| `.breadcrumb`          | `Breadcrumb`          | `<nav>` only                                                   |
| `.skeleton-block`      | `Skeleton`            | `<div>` only                                                   |
| `.skeleton-lines`      | `Skeleton`            | `<div>` only                                                   |
| `.file`                | `File`                | `<div>` only                                                   |
| `.icon`                | `Icon`                | `<span>` only                                                  |
| `.icon-text`           | `IconText`            | `<span>` only                                                  |
| `.image`               | `Image`               | `<div>`, `<figure>`, `<p>` via `as`                            |
| `.menu`                | `Menu`                | `<aside>` only                                                 |
| `.menu-label`          | `Menu.Label`          | `<p>` only                                                     |
| `.menu-list`           | `Menu.List`           | `<ul>` only                                                    |
| `.modal-background`    | `Modal.Background`    | `<div>` only                                                   |
| `.modal-content`       | `Modal.Content`       | `<div>` only                                                   |
| `.modal-card`          | `Modal.Card`          | `<div>` only                                                   |
| `.modal-card-head`     | `Modal.Card.Head`     | `<header>` only                                                |
| `.modal-card-title`    | `Modal.Card.Title`    | `<p>` only                                                     |
| `.modal-card-body`     | `Modal.Card.Body`     | `<section>` only                                               |
| `.modal-card-foot`     | `Modal.Card.Foot`     | `<footer>` only                                                |
| `.pagination`          | `Pagination`          | `<nav>` only                                                   |
| `.pagination-list`     | `Pagination.List`     | `<ul>` only                                                    |
| `.pagination-previous` | `Pagination.Previous` | `<a>` only                                                     |
| `.pagination-next`     | `Pagination.Next`     | `<a>` only                                                     |
| `.pagination-link`     | `Pagination.Link`     | `<a>` only                                                     |
| `.pagination-ellipsis` | `Pagination.Ellipsis` | `<span>` only                                                  |
| `.panel`               | `Panel`               | `<nav>` only                                                   |
| `.panel-heading`       | `Panel.Heading`       | `<p>` only                                                     |
| `.panel-tabs`          | `Panel.Tabs`          | `<p>` only                                                     |
| `.panel-block`         | `Panel.Block`         | `<a>` only                                                     |
| `.tabs`                | `Tabs`                | `<div>` only                                                   |

An element with two of these (`<div className="column box">`) becomes the layout one
(`Column`), and the other class stays in `className`.

`Card` renders its children inside a `.card-content` of its own unless one of them is one of
its parts, and `Card.Header` its children inside a `.card-header-title` unless one of them is a
`Card.Header.Title`. So a `.card` with children converts only when one of the elements written directly
inside it converts to a part (or already is one), and a `.card-header` only when its title
does. Otherwise it gets a `children:<Target>` TODO. Bulma's own example card, with its
`<p className="card-header-title">` and `<a className="card-footer-item">` links, converts through
`as`. A `.card-footer-item` `<button>` converts only with its `type` written out as `button`,
`submit` or `reset`, since `Card.FooterItem` writes `type="button"` on a button in place of
anything else.

`Navbar` writes `role="navigation"` and `aria-label="main navigation"`, the attributes Bulma's
own navbar carries, so a `.navbar` that sets both converts (whatever the label says), and one
that doesn't gets a `defaults:Navbar` TODO. A `.has-dropdown` item becomes a `Navbar.Item` that
keeps `has-dropdown` as a class, because a `Navbar.Dropdown` would give the `.navbar-link` inside
it dropdown semantics the markup didn't have. That link and the `.navbar-burger` stay markup with
a `family:<class>` TODO; converting either means building the dropdown or the toggle with bestax,
by hand.

Form markup converts piece by piece: `.field` to `Field`, `.control` to `Control`, the input
and textarea to `InputBase` and `TextAreaBase`, the controls without wrappers of their own, and a
`.select` with its `<select>` to `SelectBase` (below). A `.label` and a `.help` stay as they
are. An input's or a select's color (`is-danger`) stays a class, because `color` renders
`has-text-<color>` on it too. A `.field.is-horizontal` converts once its
`.field-label` and `.field-body` do, since `Field` wraps anything else in a `.field-body` of its
own. `Field` and `Control` tell bestax's form controls inside them to skip their own wrappers, so a
`.field` or `.control` that already holds a bestax component stays markup with a
`context:<Target>` TODO, and so does an input with no `id` inside a bestax `Field` or any other
component, which could hand it a labelled Field's generated one.

A `.tabs` converts around its `<ul>`, and the `<li>`s and `<a>`s inside stay as written: `Tabs.Tab`
renders its own `<a>` with tab roles and puts its label in a `<span>`, so converting the tabs
themselves is by hand (something that sat beside the text in the `<a>`, a `Tag` say, then wants a
`Span display="flex" alignItems="center"` around it and the label). A `.icon` converts around the
`<i>` inside it when it carries an `aria-label`, which `Icon` writes otherwise.

A `.menu` converts with its `.menu-label`s and `.menu-list`s, and so do the items in a list. An
item has no class to go by, so the codemod finds it by where it sits: a `<li>` whose nearest
element is a `.menu-list`, a bestax `Menu.List`, or the bare `<ul>` nested in one of those items,
so the `<li>`s a `.map()` renders count too. One handed to any other function doesn't, since that
function could render it anywhere. `Menu.Item` renders the `<li>` and its `<a>`
together, so an item converts when its `<li>` holds one `<a>` and at most one bare `<ul>` after
it, which becomes a `Menu.List`. `is-active` on the `<a>` becomes `active`, and the `<li>`'s own
classes stay in `className`, which `Menu.Item` puts on the `<li>`. It puts `id`, `title`, `role`,
`tabIndex`, `style` and `data-testid` there too, and everything else on the `<a>`, so an item
converts only when its attributes already sit that way. A `.menu-item` gets a
`family:menu-item` TODO. `Menu.List` drops `.menu-list` on a list inside another, so a
`.menu-list` inside another, or around a bestax `Menu.List`, stays markup with a
`context:Menu.List` TODO, and an item's nested list converts only inside a list that is a
`Menu.List` or becomes one.

```tsx
<ul className="menu-list">
  <li>
    <a className="is-active" href="/team">Team</a>
    <ul>
      <li><a href="/team/members">Members</a></li>
    </ul>
  </li>
</ul>
// becomes
<Menu.List>
  <Menu.Item active href="/team">
    Team
    <Menu.List>
      <Menu.Item href="/team/members">Members</Menu.Item>
    </Menu.List>
  </Menu.Item>
</Menu.List>
```

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

## Wrappers a component renders

Some wrappers are rendered by the component inside them, from a prop. The codemod folds the
wrapper into that component: the wrapper goes, and its class and modifiers become the
component's props (`<div className="fixed-grid has-3-cols">` around a `.grid` becomes
`<Grid isFixed fixedCols={3}>`).

| Bulma class        | bestax-bulma         |
| ------------------ | -------------------- |
| `.table-container` | `Table isResponsive` |
| `.fixed-grid`      | `Grid isFixed`       |

The component renders the wrapper bare, so it folds only when it holds that one element and
nothing else, and carries no attribute and no class but its own modifiers. Otherwise it stays
with a `children:<Target>` or `attr` TODO.

## An element a component renders inside itself

`SelectBase` renders the `<select>` inside `.select` itself, `Breadcrumb` the `<ul>` inside
`.breadcrumb`, and `Image` the `<img>` inside `.image`. So each converts together with that one
element, and the component takes its place: `<div className="select is-small"><select name="plan">`
becomes `<SelectBase size="small" name="plan">` around the same `<option>`s, a breadcrumb's `<li>`s
go straight inside `Breadcrumb`, and `<figure className="image is-64x64"><img src="a.png">` becomes
`<Image as="figure" size="64x64" src="a.png" />`.

- `SelectBase` puts the attributes it's given on the `<select>`, so the `<select>`'s own move up
  and the `.select` can carry none but a `key`. `is-hovered` and `is-focused` on the `<select>`
  become `isHovered` and `isFocused`, a `multiple` `<select>` converts inside `.select.is-multiple`
  as `multiple`, and its `size` becomes `multipleSize`.
- `Breadcrumb` renders its `<ul>` bare, and writes `aria-label="breadcrumbs"` unless it's given
  one, so the `<ul>` carries nothing and the `.breadcrumb` needs an `aria-label` of its own.
- `Image` renders its `<img>` from `src` and `alt`, so the `<img>` carries nothing else, and
  `is-rounded` on it becomes `isRounded`. The `.image` keeps its own attributes. A ratio
  (`is-4by3`) stays a class, since `size` would add `has-ratio` as well. Around anything else (an
  `<img>` with more attributes, an `<iframe>`), `Image` renders its children as given, so the
  `.image` converts around them and they stay as written, as long as they're HTML elements written
  out. An empty `.image` stays markup, since `Image` would render an `<img>` of its own, and so does
  one around an expression (`{src && <img />}`), which can come out empty.

For `SelectBase` and `Breadcrumb`, anything else keeps both as markup, with a `children:<Target>`, `attr` or `defaults:<Target>`
TODO.

## Children a component renders from a count

`Skeleton variant="lines"` renders `.skeleton-lines`' empty `<div>`s itself, `lines` of them. So
a `.skeleton-lines` whose children are just bare, empty `<div>`s becomes
`<Skeleton variant="lines" lines={N} />`, and the `<div>`s go. A class, an attribute or anything
inside one of them, or anything else beside them, keeps the element as markup with a
`children:Skeleton` TODO. A `.skeleton-block` converts like any other element, content and all.
`Skeleton` takes no helper props, so a helper class on either stays in `className`.

## Icons a component builds from props

`IconText` builds its icons from props, so an `.icon-text` converts together with what's inside
it: each `.icon` becomes one icon's props, and a bare `<span>` of text right after one becomes that
icon's text. One icon is written as `iconProps`, with its text as the children, and more than one
as `items`.

```jsx
<span className="icon-text">
  <span className="icon" aria-label="Home">
    <i className="fas fa-home"></i>
  </span>
  <span>Home</span>
</span>
// becomes
<IconText iconProps={{ library: "fa", name: "home", ariaLabel: "Home" }}>Home</IconText>
```

The glyph is read from the `<i>`: its Font Awesome style class (`fas`, `far`, `fa-solid`, ...) or
`mdi`, the one class that names the glyph (`fa-home` as `name: "home"`), and the rest as
`features`. `library` is always written, so a `ConfigProvider` with another `iconLibrary` doesn't
change what renders. The `.icon`'s own classes and attributes join the glyph's props as they
would on `Icon`, with `aria-label` as `ariaLabel`.

It converts only when every `.icon` inside converts to `Icon` on its own and holds a bare, empty
`<i>` naming a Font Awesome or Material Design Icons glyph, and the only other children are those
texts, bare and static. Anything else keeps it as markup with a `children:IconText` TODO, and the
`.icon`s inside convert on their own.

## A tree a component renders from props

`File` renders the whole `.file` tree from props, so a `.file` converts together with everything
inside it. The `<input>`'s attributes become `File`'s own (it puts the ones it doesn't read on the
`<input>`), its other classes become `inputClassName`, the `.file-label` `<span>`'s content becomes
`buttonLabel` (left out when it's `File`'s own default, `Choose a file…`), each `.file-icon`'s
content becomes `iconLeft` or `iconRight`, and the `.file-name`'s text becomes `fileName` beside
`hasName`.

```jsx
<div className="field">
  <div className="file has-name">
    <label className="file-label">
      <input className="file-input" type="file" name="cv" />
      <span className="file-cta">
        <span className="file-icon"><i className="fas fa-upload"></i></span>
        <span className="file-label">Upload</span>
      </span>
      <span className="file-name">cv.pdf</span>
    </label>
  </div>
</div>
// becomes
<Field>
  <File hasName name="cv" buttonLabel="Upload" iconLeft={<i className="fas fa-upload"></i>} fileName="cv.pdf" />
</Field>
```

It converts only inside a `Field`, a bestax one already in the file or a `.field` that converts
in the same run, since outside one `File` renders a `.field` of its own. The tree has to be exactly
the one `File` renders, and the `.file` itself can carry no attribute but a `key`, since `File`
puts the attributes it's given on its `<input>`. A color class stays a class, since `color`
renders `has-text-<color>` too, and so does `is-centered`, which `isCentered` renders nothing of
beside `isRight`. Anything else keeps it as markup with a `children:File`, `context:File` or
`attr` TODO.

## Families this source leaves as markup

Their markup doesn't map element by element (the bestax component renders parts of its own, or
adds attributes), so the family's outermost class gets a `family:<class>` TODO and the markup
stays. [unmappables.md](unmappables.md) has the recipe for each. The families are Checkbox,
Checkboxes, Dropdown, the menu's `.menu-item`, Message, Modal's root and close
button, the navbar's burger and dropdown link, the panel's icon, Radio and Radios.

## Classes left alone

`.help`, `.label`, `.hero-buttons`, `.hero-video`, `.theme-dark`, `.theme-light`, `.fa`,
`.marginless`, `.paddingless`, `.navbar-content`, `.navbar-tabs` and `.panel-list` are valid
Bulma with nothing in bestax to convert to. `.loader` is left alone as well, although bestax's
`Loader` renders the same element: swap it in by hand for its progressbar role and accessible name.
An element carrying one stays as written, and gets no TODO.
