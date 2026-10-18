# Bulma classes → bestax-bulma: what the codemod leaves for you

Every `TODO(bestax-migrate)` this source writes, by rule, with what to do about it. The markup
under a TODO is exactly as it was, so the app still renders the same while you work through
them. The rule after the colon names a Bulma class, a bestax component or prop, or an
attribute, never one of your own classes.

## An element it would not convert

### `spread:<Target>`

The element spreads props (`<div className="box" {...rest}>`). A spread can carry anything,
and bestax reads some names as its own props: a spread `className` merges with the component's
classes, where on the plain element it replaced them. Convert by hand once you know what the
spread carries, or leave it. A spread on the `<select>` inside a `.select` counts too, since what it
carries becomes `SelectBase`'s.

### `ref:<Target>`

The element has a `ref`, and the bestax component doesn't forward one, so the ref would stop
reaching the DOM node. Keep the element as markup.

### `tag:<Target>`

The codemod converts that class on a fixed tag, or a short list of them through `as` (see the
**Tags** column in [component-map.md](component-map.md)), and this element is on another one:
`<div className="section">`, `<p className="notification">`. Changing the tag changes the
markup, so decide whether you want it; if you do, change it and re-run. If the component's
own `as` takes the tag, writing it by hand keeps the markup instead.

### `attr:<prop>`

An attribute on the element is also a prop of the bestax component, which would read it
differently: `<div className="box" color="red">` would lose its `color` attribute to Box's text
color. Rename or drop the attribute, then re-run.

It also covers an attribute the component's props type rejects. `Delete` takes no `type`
(`type="button"` is the one value that converts, because `Delete` renders it anyway), and
`Progress` types `value` and `max` as numbers, so `value="half"` stays. `InputBase` and
`TextAreaBase` type `maxLength` and `minLength` as numbers, and `TextAreaBase` `rows` and `cols`
too. Every component types `tabIndex` as a number, so `tabIndex="0"` converts as `tabIndex={0}`.
A number converts only when it is spelled the way it renders (`value="40"`, not `value="040"`).

`attr:dangerouslySetInnerHTML` is the same kind of refusal: the element sets its own content,
and some bestax components render content of their own beside `children`, which React
rejects. Keep the element as markup. `attr:children` is too: the codemod reads an element's
children from the JSX inside it, so children passed as an attribute are content it can't see.
Move them inside the element, then re-run.

On a `.select` or a `.breadcrumb` it's about the element inside, which the component renders
itself. `SelectBase` gives its `<select>` every attribute it's given and no class but
`is-hovered` or `is-focused`, so an attribute on the `.select` (an `attr` TODO) would move onto
the `<select>`, and another class on the `<select>` (`attr:className`) would be lost, as would
the `class=""` an empty `className` renders. Move the
attribute onto the `<select>` if that's where you want it, then re-run. A `multiple` `<select>`
converts only inside a `.select.is-multiple`, with `multiple` written bare, and its `size` only
beside it, as a number written out (`size={4}`): `SelectBase` writes it back only when it holds a
number, which the codemod can't tell of an expression. `Breadcrumb` renders its `<ul>` bare, so an attribute or class on the `<ul>` keeps
both as markup.

On a menu item it's where each attribute lands. `Menu.Item` puts `className`, `id`, `title`,
`role`, `tabIndex`, `style` and `data-testid` on the `<li>`, and everything else on the `<a>`, so
an item converts only when its attributes already sit that way: an `onClick` on the `<li>`, or a
`title` or a `key` on the `<a>`, keeps it as markup. A `ref` on the `<a>` converts, since
`Menu.Item` forwards it there, and one on the `<li>` doesn't. The `<a>` takes no class but
`is-active`, since the item's `className` goes on the `<li>`, so any other class on it, or an
empty one, keeps the item as markup too, and so does an empty `className` on the `<li>`, since
nothing is left to render its `class=""`. Move the attribute to where `Menu.Item` puts it if
that's what you want, then re-run.

`attr:role` on a `.menu-list` is a `role` other than `list`. `Menu.List` writes `role="list"` on
its `<ul>` whatever it's given, for Safari, which stops treating a list as one once its markers are
hidden, so that role would be lost. Keep the list as markup. One with no `role`, or `role="list"`,
converts, since that's the role a `<ul>` already has.

`attr:aria-current` is the `<a>`'s `is-active` with no `aria-current` beside it. `Menu.Item`'s
`active` writes `aria-current="page"` on the `<a>` unless it has one of its own, so the item would
gain it. If the item marks the page you're on, which is what `is-active` usually means in a menu,
add `aria-current="page"` to the `<a>` and re-run, and the item converts with it. If it marks
something else, keep the markup, or convert it by hand and pass the `aria-current` you want.

### `defaults:<Target>`

The component renders attributes of its own when the element doesn't set them. `Delete`
renders `type="button"` and `aria-label="Close"`. On a bare `<button className="delete">`,
converting would add both, changing a submit button inside a form into a plain button. Add the
attributes you want (usually both, with a real label), then re-run. `Navbar` renders
`role="navigation"` and `aria-label="main navigation"`, which Bulma's own navbar markup carries;
give the `<nav>` both, with your own label if you like. `Breadcrumb` renders
`aria-label="breadcrumbs"`, so give its `<nav>` an `aria-label`, whatever it says.
`Icon` hides an icon with no name, no `role` and no `tabIndex`, with `aria-hidden="true"`, and
makes one named by `aria-label` or `aria-labelledby` an image, with `role="img"`. Give a decorative
`.icon` `aria-hidden="true"`, and a meaningful one an `aria-label` that says what it means and
`role="img"`. One whose name is an expression may render with no name, so it needs a `role` of its
own.
`Pagination` renders Bulma's own `role="navigation"` and `aria-label="pagination"`, and
`Pagination.Previous`, `Pagination.Next` and `Pagination.Link` render `tabIndex={0}`, so give each
element the attribute it's missing.
`Card.FooterItem`, `Card.Header.Icon` and `Navbar.Item` render `type="button"` on a `<button>` that
sets none, and `Card.Header.Icon` renders `aria-label="more options"` too. One whose `type` isn't
`button`, `submit` or `reset` gets an `attr:type` TODO instead, since bestax writes `button` in its
place. Write the type you mean, then re-run.
`File` renders a class rather than an attribute: Bulma's `is-empty`, on a `has-name` `.file` with
no `.file-name`, whatever a condition says. Write `is-empty` on the `.file` as a static class, then
re-run: a condition on `is-empty` can't stand in, so one already there still gets this TODO. The
`File` it becomes gets `fileName=""`, so a file the user picks leaves it as the markup was: no name
area, and `is-empty` still on.

### `drops:<Target>`

The component drops an attribute on this tag. Most of these do nothing there anyway: `Button`
drops `href`, `target` and `rel` on a `<button>`, and `Level.Item` keeps link attributes only
on an `<a>`. Remove the attribute, then re-run.

`disabled` is the exception. `Button` drops it on a tag with no disabled state
(`<a className="button" disabled>`), but Bulma greys out a disabled `.button` on any tag, so
dropping it would change how the element looks. Keep that element as markup.

So is `name` on an `<a>`, which `Card.FooterItem` drops: browsers still scroll a `#fragment` link
to it. Keep that element as markup, or move the target to an `id` (which it keeps), then re-run.

### `children:<Target>`

The component's props type requires children, and the element has none (`Buttons`). An empty
`.buttons` does nothing; delete it or give it buttons.

On `Card` and `Card.Header` it means the children decide. `Card` renders its children inside a
`.card-content` of its own unless one of them is one of its parts (`Card.Header`,
`Card.Header.Icon`, `Card.Image`, `Card.Content`, `Card.Footer`, `Card.FooterItem`), and
`Card.Header` renders a `.card-header-title` of its own unless one of its children is a
`Card.Header.Title`. None of this element's direct children converted to one, so converting it
would add that wrapper. Look at the TODOs on the children first: a title that stays markup keeps
its header as markup too. A card whose content sits straight inside it, with no
`.card-content`, has no part to find; wrap that content in `Card.Content` if the extra padding
is what you want, or keep the markup. A part inside an expression (`{open && <div className="card-content">}`)
doesn't count, because it may not render.

On a `.table-container` or `.fixed-grid` it's the wrapper case. `Table isResponsive` and
`Grid isFixed` render that wrapper themselves, around nothing but the table or grid, so the
wrapper folds into them only when it holds that one element and nothing else. A caption, a
comment or a second element beside it keeps the wrapper as markup; move it outside the wrapper,
then re-run. An attribute or an extra class on the wrapper keeps it too, because the component
renders the wrapper bare.

On a `.select`, a `.breadcrumb` or an `.image` it's the same shape from the other side. `SelectBase`
renders the `<select>` inside `.select` itself, `Breadcrumb` the `<ul>` inside `.breadcrumb` and
`Image` the `<img>` inside `.image`. So `SelectBase` and `Breadcrumb` convert only around that one
element, with nothing else beside it. `Image` renders anything else it's given as it is, so an
`.image` converts around HTML elements written out either way. It gets this TODO when it's empty,
or when what's inside is an expression or text, since `Image` renders an `<img>` of its own when
its children come out empty. Keep it as markup, or write the `Image` by hand if the expression
never is.

A `<label>` beside the `<select>` in a `.select` (a visually hidden one, say) is that case too,
since `SelectBase` renders no label. bestax's convenience `Select` takes it: the label's text as
`label` and its classes in `labelProps`, and it points the label at the `<select>`'s `id` itself.
It renders the `.select` inside a `Field` and a `Control`, so convert the two by hand and check
the layout:

```tsx
<Select
  id="language"
  size="small"
  label="Select language"
  labelProps={{ className: 'is-sr-only' }}
>
  <option>English</option>
  <option>French</option>
</Select>
```

A menu item is the same from the `<li>`'s side: `Menu.Item` renders the `<a>` inside it, and a
`Menu.List` after that, so an item converts only when its `<li>` holds one `<a>` and at most one
`<ul>` after it, with nothing else beside them. Text or a comment beside the `<a>` keeps it as
markup, and so does a router link or a `<button>` in its place: write a router link by hand as
`<Menu.Item as={Link}>`. The nested `<ul>` converts only bare (no class, no attributes) and
holding its items, as Bulma nests one, and the `<a>` has to hold something, since `Menu.Item`
requires children.

On a `.pagination-ellipsis`, `Pagination.Ellipsis` renders its own `…` whatever it's given, so the
element converts only holding exactly that (`&hellip;` or the character), and closes itself.

On an `.icon-text`, `IconText` builds its icons from props and wraps each text in a `<span>` of
its own, so it converts only when its children are `.icon`s, each followed by at most one bare
`<span>` of static text. Each `.icon` has to convert to `Icon` on its own, so one with no
`aria-label` gets a `defaults:Icon` TODO of its own first: give it one that says what the icon
means, then re-run. Its `<i>` has to be bare and empty and name one Font Awesome or Material Design
Icons glyph, so an `aria-hidden` on the `<i>`, another icon font, or anything between the children
keeps it as markup, and the `.icon`s inside convert on their own. The markup renders the same as
it is; to use `IconText` anyway, write it by hand with `iconProps={{ name: ... }}` (the
`bestax-icons` skill covers `Icon`'s library and name props).

On a `.file`, `File` renders the whole tree from props, so it converts only when its tree is the one
`File` renders: one bare `.file-label` `<label>` holding a `.file-input` `<input type="file">`, a
bare `.file-cta` `<span>` with a bare `.file-label` `<span>` and at most one bare `.file-icon`
`<span>` on each side of it, and, with `has-name`, at most one bare `.file-name` `<span>` of
static text. A class or attribute on any part of the tree, text between the parts, or content
that isn't text and elements written out keeps it as markup. Rebuild it as one `File` by hand
(its API page lists the props for the button text, the file name and the icons), or keep the
markup, which renders the same.

On a `.skeleton-lines`, `Skeleton` renders the children itself: `lines` bare, empty `<div>`s. So
the element converts only when its children are just that, and a class, an attribute, text or a
comment in one of them, or anything else beside them, keeps it as markup. Keep it if the
children matter; otherwise make them bare `<div>`s, then re-run.

### `context:<Target>`

`Field` and `Control` tell bestax's form controls inside them to skip their own `.field` and
`.control` wrappers. A `.field` or `.control` that already holds a bestax component (an `Input`
from an earlier, partial migration) would change how that component renders once converted, so
it stays markup. Convert it by hand and check that the component inside still renders what you
want, or leave it.

On a `.file` it's the other way round: `File` renders a `.field` of its own unless it sits inside
a `Field`, so a `.file` converts only inside a bestax `Field` or a `.field` that converts in the
same run. Convert the `.field` around it (its own TODO says what keeps it), then re-run.

On an input or textarea it's the other direction: inside a bestax `Field` with a `label`,
`InputBase` and `TextAreaBase` take the Field's generated `id` when they have none, which the
element didn't have. Context follows what renders, not what the file says, so an input with no
`id` inside any other component of the app stays markup too, since that component could render
a labelled `Field` around it. Give the element its own `id`, then re-run.

The codemod reads one file at a time, so it can't see a component in another file that renders
a bestax `Field` or form control around this markup. If the app already uses them that way, give
its inputs ids before running the codemod, and check its forms afterwards.

On a `.tabs` it's the same shape as a `.field`: `Tabs` passes its active tab to the `Tabs.Tab`s
and `Tabs.Content.Item`s inside it, and renders differently around a `Tabs.Content`, so a `.tabs`
that already holds one of those stays markup. Only the ones written in the file count: a
component of the app inside the `.tabs` that renders one itself would start following the
active tab once the `.tabs` converts, so check tabs built from your own components after the run.

On a `.modal-background`, `.modal-content` or `.modal-card` it's about the `Modal` around it. A
bestax `Modal` already in the file picks what it renders from its children: with one of those
parts among them it renders them as given, and without one it adds its own background, wrapper
and close button. So converting the part would change the `Modal`, and the part stays markup.
Convert the `Modal` and its children together by hand.

On a `.menu-list` it's about nesting: `Menu.List` renders `.menu-list` only on the outermost list,
and drops it on one inside another. So a `.menu-list` inside another `.menu-list` (or a bestax
`Menu.List`) stays markup, keeping its class, and so does one around a bestax `Menu.List`, which would
lose the class once the outer one converts. Only the elements in the same file count:
a `.menu-list` another component renders inside a `Menu.List` would lose the class, so check a
menu split across components after the run.

On a `.pagination-link` or a `.pagination-ellipsis` it's the `<li>` around it: `Pagination.Link`
and `Pagination.Ellipsis` render a bare `<li>` of their own, so each converts only as the only
thing inside a bare `<li>`, which it takes the place of, `key` and all. A class or an attribute
on the `<li>`, or anything beside the element in it, keeps it as markup. A `.pagination-link`'s
`is-current` becomes `active` only beside an `aria-current` of its own, since `active` renders
`aria-current="page"` otherwise; without one it stays a class. And `Pagination.Ellipsis` writes
a `className` it's given in place of `.pagination-ellipsis`, so another class on it keeps it as
markup with `attr:className`.

A menu item with a nested list is the same rule from inside: its nested `<ul>` becomes a
`Menu.List`, which renders `.menu-list` unless another `Menu.List` is around it. So the item
converts only inside a list that is a `Menu.List` already or becomes one in the same run, and an
item inside a `.menu-list` that stays markup (one that spreads props, say) keeps its nested list,
and itself, as markup with a `context:Menu.Item` TODO. An item with no nested list renders the
same anywhere, so it converts either way.

### `only-child:<Target>`

The element is the only child of another component (`<Link href="/x"><a className="button">`),
which may reach into it with `cloneElement`: next/link's legacy behavior, a tooltip, a Radix
`asChild` trigger. A bestax component would not take those props or that ref the same way.
Convert it by hand if the parent only renders its children.

### `dynamic-class:<Target>`

The `className` is computed in a way the codemod can't read exactly, and with its classes
written out the element would become bestax `<Target>`.

What it can read is a `clsx` or `classnames` call made of class strings and classes added
under a condition: `busy && 'is-loading'`, `{ 'is-loading': busy }`, `busy ? 'is-loading' : ''`
(or `: null`). Those convert without a TODO. A condition on one of the component's flags
becomes that prop (`isLoading={busy}`, or `isLight={!quiet}` for `quiet ? '' : 'is-light'`),
anything else stays in the call, and the call goes once nothing is left in it. `Field`'s
`is-grouped` stays in the call too, since `grouped` renders it for `true` alone. A prop is
evaluated before the call, so a condition moves ahead of one left in the call only when neither
can have side effects (a call, an assignment); otherwise it stays. A condition that isn't a
boolean (`items.length && 'is-active'`) renders the same, but won't typecheck against the
boolean prop; wrap it in `Boolean(…)`.

So this TODO is a className built any other way: a ternary between two classes, a template
with expressions, a variable, another function (`classnames/bind`, an app's own `cn`), or the
component's class itself under a condition. Convert by hand with the [prop map](prop-map.md),
turning each condition into the prop:

```tsx
// before
<button className={primary ? 'button is-primary' : 'button is-light'}>Save</button>
// after
<Button color={primary ? 'primary' : undefined} isLight={!primary}>Save</Button>
```

The classes in a computed `className` still count for every other rule: a `clsx('box')` on a
`<span>` gets `tag:Box`, and a `clsx('dropdown', …)` gets `family:dropdown`. A computed
`className` on the `<select>` inside a `.select`, the `<ul>` inside a `.breadcrumb` or the `<a>`
in a menu item gets this TODO too. For the `<a>`, a condition on `is-active` is `Menu.Item`'s
`active`: `<a className={on ? 'is-active' : undefined}>` becomes `<Menu.Item active={on}>`, which
also writes `aria-current="page"` while `on` holds. Pass an `aria-current` of your own if the item
marks something other than the current page.

## A family it leaves as markup: `family:<class>`

The bestax component renders parts of its own, or adds attributes, so a one-element-at-a-time
conversion would change the markup. Convert the whole family by hand, and look at the result
in the browser:

- **`family:navbar-burger`**: `Navbar.Burger` is a `<button>` that renders the burger's spans
  itself and sets `aria-expanded` from `active`. Replace the whole toggle with it, drive
  `active` from the state the old click handler flipped, and pass the same state to
  `Navbar.Menu`'s `active`. Don't give it spans of your own: Bulma positions every span in the
  burger. Releases before 5.16.10 render three spans where Bulma v1 positions four, so upgrade
  rather than adding one.
- **`family:navbar-link`**: inside a `Navbar.Dropdown`, `Navbar.Link` adds `aria-haspopup`,
  `aria-expanded` and keyboard handling. The codemod turned the `.has-dropdown` item around it
  into a `Navbar.Item` that keeps the class; to get the dropdown behavior, replace that item
  with `Navbar.Dropdown` (`hoverable` for `is-hoverable`) and the link with `Navbar.Link`.
- **`family:checkbox`**, **`family:radio`**, **`family:checkboxes`**, **`family:radios`**:
  bestax renders its own styled checkbox and radio markup, not Bulma's.
- **`family:modal`**: `Modal` writes a `data-testid` of its own and adds dialog attributes and
  focus handling, so the `.modal` root stays markup while its background, content and card parts
  convert on their own. Rebuild the root with `Modal` around them, and drive it with its open prop.
  A `.modal-close` stays too, since `Modal.Close` renders `.delete` unless it's floating: write
  `<Modal.Close variant="floating" />` in its place. When the
  page has to look the same, keep `Modal` rather than `Dialog` or `Toast`: those render
  bestax's own `.dialog` and `.toast` markup, which Bulma's stylesheet doesn't style.
- **`family:dropdown`**: `Dropdown` renders its own trigger and menu from props.
- **`family:menu-item`**: Bulma styles an item as `.menu-list a`, `.menu-list button` or
  `.menu-list .menu-item`, the last for an item on any other tag. `Menu.Item` renders the element
  inside its `<li>` with no class but `is-active`, and puts its `className` on the `<li>`, so the
  class has nowhere to go. On an `<a>` inside a `.menu-list` it adds nothing, so drop it and
  re-run, and the item can convert. On any other tag, keep the markup.
- **`family:message`**: `Message` always wraps its children in `.message-body`.
- **`family:panel-icon`**: `Panel.Icon` renders through `Icon`, which always writes an
  `aria-label`, so write `<Panel.Icon>` by hand with the `<i>` inside. The rest of a panel converts,
  but for a `<label>` or `<div>` `.panel-block`, which stays markup with no TODO: bestax renders
  those as `Panel.CheckboxBlock`, `Panel.InputBlock` and `Panel.ButtonBlock`, which build their own
  contents from props.

## A class Bulma v1 removed: `legacy:<class>`

`legacy:tile`: Bulma v1 has no tiles. Rebuild the layout with `Grid` and `Cell`; the Bulma
0.9 to 1 guide shows the translation. Until then the element has no styles at all under
Bulma v1.

## A whole file it left alone

These come only when the file has an element the codemod would convert (a computed className
counts), so a re-run after the fix has something to do. A non-React file gets `jsx-runtime`
alone: every other TODO names a React component to use.

- **`rsc`**: the file is in a Next.js App Router project (a package with `next` and an
  `app/` directory) and has no `'use client'`, so it may render as a server component, and
  bestax's components are client components. That covers files outside `app/` too: a
  component under `components/` is a server component when a server page renders it. Files
  under `pages/` are always client code and convert. Add `'use client'` if the file can be a
  client module (no `async` component, no server-only calls), then re-run.
- **`styled-jsx`**: the component scopes its styles with `<style jsx>`, which adds its scoping
  class to plain elements and not to an imported component, so a converted element would lose
  its styles. Move those
  styles out of `<style jsx>`, or scope them with `:global()`, then re-run.
- **`imports`**: the file is CommonJS (`require` or `module.exports`, no ES `import` or
  `export`), and the codemod adds an ES `import`. Move the file to ES modules, then re-run.
- **`jsx-runtime`**: the file's JSX isn't React's: a `@jsx` pragma or `@jsxImportSource` naming
  another runtime (Preact, Solid), or a package that sets one in its tsconfig or depends on one
  instead of React. bestax-bulma components are React components.

## A page converted from HTML: `html-*`

Run on an HTML page (`bestax-migrate bulma-classes page.html`, or a folder with `-e html`, or
`-e html,htm` to take `.htm` pages too), the
codemod writes a module beside the page and runs everything above on it, so a page gets the same
TODOs its markup would as JSX. What a component can't carry gets an `html-*` rule. TODOs about the
whole page sit above the component, the rest above its `return`, and each ends with the page and
the line it came from (`(index.html:42)`). The page itself stays as it was, so the code a TODO
points at is still there to read. A rule names only a tag, an attribute or a fixed word, never
anything the page says.

### The page's head: `html-head:<tag>`

A component renders into the `<body>` of the app's own document, so nothing in the page's
`<head>` comes with it.

- **`html-head:title`**: set the title where the app sets each page's title (its router's or
  framework's head API). Under React 19 the component can render `<title>` itself and React moves
  it into the head; React 18 leaves it in the body, so use `document.title` in an effect there.
- **`html-head:meta`**: `charset` and `viewport` go once in the app's `index.html`. A page's own
  (a description, Open Graph tags) go where the app sets each page's head.
- **`html-head:link`**: icons, preconnects and preloads are app-wide, so keep them in
  `index.html`; a `canonical` is per page.
- **`html-head:style`**: the `<style>` block was dropped. Move its rules into the app's stylesheet.
- **`html-head:base`**: `<base href>` changed how the page's relative URLs resolved, and the app
  has one document for every route. Make those URLs absolute instead (see `html-url:relative`).
- **`html-head`**: anything else in the head (a `<noscript>`, a `<template>`). Move it into
  `index.html` if the app needs it.

### Stylesheets and scripts it loads: `html-asset:<kind>`

Each `<link rel="stylesheet">` and `<script src>`, by what its URL says it is. A component loads
neither, so load what the app still needs once for the whole app, from its entry module or
`index.html`. The TODO quotes the URL.

- **`html-asset:bulma`**: Bulma's own stylesheet, with the version its URL names
  (`bulma@0.9.4`, or none for a copy of the page's own).
  - Under the default `--css keep` it is only reported: keep loading Bulma
    (`import 'bulma/css/bulma.min.css'` in the entry, with that version of `bulma` installed, or the
    CDN `<link>` in `index.html`).
  - Under `--css bestax` the module imports `@allxsmith/bestax-bulma/bestax.css` in the link's
    place, and under `--css bulma` it imports `bulma/css/bulma.min.css` and
    `@allxsmith/bestax-bulma/extras.css`, the way the same import in a JSX file is retargeted, so the
    package.json step sees the module's `bulma` import too. One import from each page module is
    fine, since the bundler loads it once. What is left gets the TODO: a page made for Bulma 0.9, or
    one whose URL doesn't say, moves to Bulma 1 (the docs' Bulma 0.9 to 1 guide), and under
    `--css bestax` a page with a primary color class (`is-primary`, `has-text-primary`) changes
    color, since `bestax.css` builds Bulma with bestax's own primary. To keep it, set the
    `--bulma-primary-*` variables as [css-migration.md](../css-migration.md) says, or use
    `--css bulma`. A Bulma 1 page with no primary class gets the import and no TODO. A TypeScript
    build resolves the import through the bundler's CSS types (Vite's `vite/client`), as it does
    every stylesheet import.
  - No import is written in a Next.js app, whose Pages Router takes a global stylesheet only in
    `pages/_app`, nor for a link with a media query (`media="print"`), since an import applies to
    every medium. The TODO says where it goes instead: the root layout or `pages/_app`, or a
    `<link>` with the same `media` in `index.html`.
  - One of Bulma's other builds (`bulma-no-dark-mode`, `bulma-prefixed`, 0.9's `bulma-rtl`) is
    reported in every mode, since the codemod imports only the standard one. bestax's own builds,
    Bulma with its extras, are under `@allxsmith/bestax-bulma/versions/`.
- **`html-asset:font-awesome`**: Font Awesome, with the major its URL names. bestax's `Icon`
  writes its classes (`fas fa-<name>`) and loads no font of its own, so keep loading it, from the
  `<link>` in `index.html` or from npm: bestax-bulma's optional peer range for
  `@fortawesome/fontawesome-free` is `^6.7.2 || ^7.0.0`, and an older one fails `npm install`
  with `ERESOLVE`.
  - 6 and 7: keep it as it is, or install it and import its `css/all.min.css` from the entry.
  - 5: the CDN link keeps working, since 5 reads the classes `Icon` writes. From npm, take 6 or 7,
    which still read 5's names.
  - 4: its classes are `fa fa-<name>`, and `Icon` writes `fas fa-<name>`, which 4 doesn't style.
    Install 6 or 7 with `css/all.min.css`, then either import `css/v4-shims.min.css` beside it so
    the page's 4 names keep working, or move them to the current names (`fa-envelope-o` is
    `envelope` with `variant="regular"`).
  - A kit (`kit.fontawesome.com`): keep loading it from `index.html`, or install Font Awesome from
    npm instead. A URL with no version: the same, with the v4 shims beside it if the page's names
    are 4's (`fa fa-<name>`).
- **`html-asset:bulma-extension`**: a `bulma-*` package (or `@creativebulma/bulma-*`). An
  extension's stylesheet and script are one TODO, with both lines. Where bestax has a component
  for what it does, the TODO names it; render that in place of the extension's markup and script,
  whose styles ship in `extras.css` and `bestax.css`, and stop loading the extension once nothing
  the app keeps uses its classes:

  | Extension                                               | bestax                                                          |
  | ------------------------------------------------------- | --------------------------------------------------------------- |
  | `bulma-carousel`                                        | `Carousel`, with a `CarouselItem` for each slide                |
  | `bulma-slider`                                          | `Slider`                                                        |
  | `bulma-switch`                                          | `Switch`                                                        |
  | `bulma-checkradio`                                      | `Checkbox` and `Radio`, which draw their own box                |
  | `bulma-tooltip`, `@creativebulma/bulma-tooltip`         | `Tooltip`                                                       |
  | `bulma-badge`, `@creativebulma/bulma-badge`             | `Badge`                                                         |
  | `bulma-steps`                                           | `Steps`                                                         |
  | `bulma-timeline`                                        | `Timeline`                                                      |
  | `bulma-tagsinput`, `@creativebulma/bulma-tagsinput`     | `Taginput`                                                      |
  | `bulma-calendar`                                        | `DateInput`, `TimeInput`, `DateTimeInput` and `DateRangeInput`  |
  | `bulma-accordion`                                       | `Collapses`, with a `Collapse` for each item                    |
  | `bulma-collapsible`, `@creativebulma/bulma-collapsible` | `Collapse` (`Collapses` for an accordion)                       |
  | `bulma-pageloader`                                      | `Loading`, `isFullPage` for one over the whole page             |
  | `bulma-quickview`                                       | `Sidebar`                                                       |
  | `bulma-toast`                                           | `Toast`: `toast.show()` from code, with a `ToastContainer` once |

  `bulma-extensions`, the bundle, holds several of these: replace the ones in the table, and keep
  loading the bundle only for the rest. **bulma-social** has no bestax component: keep loading it,
  since its classes (`is-twitter`, `is-github`) style Bulma's `.button`, which `Button` renders,
  so they go on `Button` through `className`:

  ```tsx
  <Button as="a" className="is-github" href="https://github.com/example">
    <Icon name="github" variant="brands" />
  </Button>
  ```

  Any other extension: keep loading it while the page's markup uses its classes, which go on
  bestax's components through `className`, and under `--css bestax` or `--css bulma` check it
  works with Bulma 1, which an extension can predate.

- **`html-asset:jquery`**: jQuery itself (a plugin such as jQuery UI is `html-asset:script`).
  React renders the page now, so what the page's scripts did with jQuery (toggling classes,
  handlers, showing and hiding) becomes state and event props; load jQuery only if a library the
  app keeps still needs it.
- **`html-asset:webfont`**: a web font's stylesheet (Google Fonts, Bunny Fonts, Adobe Fonts).
  Keep the `<link>` in `index.html` with its preconnects, or self-host the font and import it from
  the entry. Google's Material Icons and Material Symbols are icon fonts, which `Icon` writes with
  `library="material-icons"` or `library="material-symbols"`; keep the link, or install the
  `material-icons` or `material-symbols` package.
- **`html-asset:stylesheet`**: any other stylesheet. The page's own, beside it (in its folder or
  one below), is imported once for the app in the order the page loads it, so its rules still win
  over Bulma's where they did (a module beside the page imports `css/styles.css` as
  `./css/styles.css`), or its rules move into the app's stylesheet. For one that isn't in the
  page's folder, the TODO says only that: the page's `<base href>`, if it has one, may have loaded
  it from somewhere else, so find the one it meant, or drop it.
- **`html-asset:script`**: any other script. The component runs none: load a library the app still
  needs in `index.html` (or install it), and port what the page's own scripts did into the
  component. A script of the page's own, beside it, is read the way an inline script is, so one
  that toggles the burger, drives a carousel or switches the theme gets that `html-script:<pattern>`
  TODO instead, quoting the file. One a `../` reaches outside the page's folder isn't read. A
  `<script src>` of a type a browser loads nothing for (`text/template`, `application/json`) isn't
  code: it gets the `html-script` TODO for data (`html-script:json-ld` for JSON-LD), naming its
  file.

### Inline scripts: `html-script:<pattern>`

Every inline `<script>` is dropped, and its TODO gives the lines in the page where its code still
is. One that does something bestax has a component for gets that pattern's rule, and a script
can get more than one. A script of the page's own, beside it (`<script src="js/scripts.js">`), is
read for the burger, a carousel and a theme toggle too, and its TODO names the file:

- **`html-script:burger`** toggles the navbar burger (`.navbar-burger`, or the `.burger` class
  Bulma 0.x's docs put beside it). Keep the open state in `useState` and pass it to
  `Navbar.Burger` and `Navbar.Menu` (the `family:navbar-burger` TODO on the burger says why the
  markup stays):

  ```tsx
  function SiteNavbar() {
    const [open, setOpen] = useState(false);
    return (
      <Navbar role="navigation" aria-label="main navigation">
        <Navbar.Brand>
          <Navbar.Item href="/">Home</Navbar.Item>
          <Navbar.Burger
            active={open}
            onClick={() => setOpen(!open)}
            aria-label="menu"
          />
        </Navbar.Brand>
        <Navbar.Menu active={open}>
          <Navbar.Start>
            <Navbar.Item href="/docs">Docs</Navbar.Item>
          </Navbar.Start>
        </Navbar.Menu>
      </Navbar>
    );
  }
  ```

- **`html-script:modal`** opens or closes a modal. `Modal` shows while `active` is true and calls
  `onClose` from its background, its close button and Escape, so keep the open state in
  `useState` (the `family:modal` TODO covers rebuilding the markup).
- **`html-script:dismiss`** removes an element when its `.delete` is clicked. `Notification`
  takes `hasDelete` and `onDelete`, `Tag` takes `onDelete` and `Message` takes `onClose`; render
  the element only while it's in state.
- **`html-script:carousel`** drives a carousel. `Carousel` takes its slides as `CarouselItem`
  children and renders its own arrows and indicators (`autoplay` for a timed one). Its styles ship
  in bestax's `extras.css` and `bestax.css`, not in Bulma's stylesheet.
- **`html-script:theme`** switches Bulma's light and dark schemes. The toggle is `Theme`'s: it
  writes `data-theme` on `<html>` from its `colorMode` (`light`, `dark` or `system`), so keep the
  choice in state, save it in `localStorage`, and pass it. The first paint is `index.html`'s:
  `Theme` writes from an effect, after the first paint, so a visitor whose saved choice differs
  from their OS sees the OS's scheme first. A small inline script in the `<head>` of `index.html`
  that reads the saved choice (or the OS's, with none saved) and writes `data-theme` before the
  app loads paints the right one, and the toggle's state starts from what it wrote. The
  bestax-theming skill covers `Theme` and `colorMode`.
- **`html-script:json-ld`** is structured data for search engines. Render it where the app sets
  each page's head, as
  `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`.
- **`html-script`**: any other inline script, or a `<script type>` that isn't code (a template,
  JSON data). Port what it does into the component as state, effects and event handlers.

### `<html>` and `<body>`: `html-document:<name>`

The app's document has its own `<html>` and `<body>`, which a component can't reach.

- **`html-document:has-navbar-fixed-top`**, and the same for `has-navbar-fixed-bottom`,
  `has-navbar-fixed-top-desktop`, `has-navbar-fixed-top-touch`, `has-navbar-fixed-bottom-desktop`,
  `has-navbar-fixed-bottom-touch`, `has-spaced-navbar-fixed-top` and
  `has-spaced-navbar-fixed-bottom` (`html-document:has-navbar-fixed-bottom` and so on): Bulma
  pads the page for a fixed navbar from it. Put the class on the `<html>` in `index.html`, since
  bestax's `Navbar` adds none there, whatever its `fixed` says.
- **`html-document:data-theme`**, **`html-document:theme-dark`**, **`html-document:theme-light`**:
  the page's color scheme. Put it on the `<html>` in `index.html`, or render
  `<Theme colorMode="dark">`, which writes `data-theme` on `<html>`.
- **`html-document:lang`**, **`html-document:dir`**: set them on the `<html>` in `index.html`.
- **`html-document:class`**: the page's own classes on `<html>` or `<body>`. Put them on the
  app's own `<body>` (or `<html>`), or on an element around the page's content if the styles
  allow it.
- **`html-document:id`**, **`html-document:style`**, **`html-document`**: any other attribute
  there, which moves the same way.

### Event handlers: `html-event:<attribute>`

An `onclick="…"` and its kind, on any element or on `<body>` (`onload`). React takes a function,
not code in a string, so the attribute was dropped; the TODO quotes the code and names the prop
that takes it (`onClick`). Port the code into a handler, reading the element from the event rather
than `this`. A `<body onload>` becomes an effect.

### Elements: `html-element:<kind>`

- **`html-element:custom`**: a custom element (`<my-widget>`) renders as written, but the script
  that defines it isn't loaded by the module: import its definition in the app. A TypeScript
  build also needs the tag declared in `JSX.IntrinsicElements`.
- **`html-element:obsolete`**: `<center>`, `<font>`, `<marquee>` and their kind still render, but
  React's types list few of them. Replace each with current markup (`has-text-centered` for
  `<center>`, a class for `<font>`).
- **`html-element:unknown`**: a tag that isn't HTML renders as an unknown inline element, and
  TypeScript rejects it. Replace it with the element it stands for.
- **`html-element:template`**: `<template>` holds markup for a script to clone. Render that
  markup from the component where the script used it.
- **`html-element:name`**: a tag JSX can't write (`<o:p>`, from Word), so its children were
  written in its place. Put back the element it stood for, if it mattered.
- **`html-element:conditional-comment`**: an Internet Explorer conditional comment was dropped;
  no browser React supports reads one.

### URLs: `html-url:<kind>`

- **`html-url:javascript`**: a `javascript:` URL won't run (React 19 replaces it with one that
  throws, and React 18 warns). Move the code into an `onClick` handler.
- **`html-url:relative`**: `img/logo.png` resolved against the page's folder, and in the app it
  resolves against the address the component renders at. The file is there beside the page, so
  copy it into the app's `public/` folder and point at it from the site root (`/img/logo.png`), or
  import it. A link to another page beside this one should point at the route that page becomes.
  Each relative URL in a `srcset` is its own entry, quoted as itself (`` `hero@2x.png` in `srcset` ``).
  Several of these share one TODO line, and each is its own report entry.
- **`html-url:missing`**: a relative URL whose target isn't beside the page, read the way the
  browser read it, so it was a dead link or a missing file already. Point it somewhere real, or
  drop it.

### Attributes: `html-attr:<kind>`

- **`html-attr:name`**: an attribute JSX can't write (`@click`, `:class`, `x-on:click`), or one the
  element already had under another spelling, was left out. A framework's directive is code to port
  into the component.
- **`html-attr:unknown`**: an attribute React has no prop for by that name, written as it was.
  React renders it. Whether a TypeScript build takes it depends on the element (React's types
  list `valign` on a `<td>` and not on a `<th>`), so the TODO doesn't say; what to do depends on
  the attribute, and the TODO says which:
  - React's own prop in the wrong case (`defaultvalue`, `defaultchecked`), which the page never
    read since it isn't HTML: rename it to the prop (`defaultValue`), or drop it if it isn't
    meant.
  - An obsolete presentational attribute (`valign`, `bgcolor`, `nowrap`), which CSS replaced:
    write it as CSS or a class.
  - Anything else: drop it if nothing reads it, make it a `data-` attribute if a script of the
    page's reads it, and if React's types don't list it on that element, declare it for a
    TypeScript build.
- **`html-attr:style`**: a `style` declaration a browser can't read (`*zoom: 1`) was left out, as a
  browser leaves it out. Delete it, or rewrite it if it meant something.
- **`html-attr:important`**: React sets a style without a priority, so the declaration is written
  without its `!important`. If a stylesheet rule beats it now, move it into a class in the app's
  stylesheet.

### Parse errors: `html-parse:<code>`

The HTML has an error the browser repaired (`html-parse:duplicate-attribute`,
`html-parse:end-tag-without-matching-open-element`), reported once for each kind, with how many
more there are. The module follows the DOM the browser builds from it, which may not be what the
markup meant, so check that part of the page. A code too long for a rule id is reported as the bare
`html-parse`.

### The page itself: `html-file:<case>`

- **`html-file:exists`**: the module beside the page is already there, and the codemod never
  writes over a file. That makes a second run change nothing. Move or delete the module to convert
  the page again.
- **`html-file:not-included`**: a folder walk found the page, and it has Bulma classes, but a walk
  takes a page only when `--extensions` lists its extension, since most `.html` files in a React
  project aren't pages to convert (Vite's `index.html`, `public/`). `-e` matches an extension
  exactly, as it does for every file, so `-e html` takes no `.htm` page; the TODO names the one
  the page needs. Name the page, or add its extension to `--extensions` (`-e html,htm` for both).
- **`html-file:template-syntax`**: the page is a server template (`{{`, `{%`, `<?php`, `<%`), which
  isn't HTML a browser reads as written. Convert the HTML it renders, or the template by hand.

A page with no Bulma component class writes nothing and reports nothing.

## Things that get no TODO

- Helper classes on a `<div>` (`<div className="is-flex mt-4">`): bestax has no plain `<div>`
  wrapper, and the classes are valid Bulma, so the element stays.
- `.help`, `.label`, `.loader` and the other classes in the component map's "left alone" list.
- A class with no bestax prop on a converted element: it stays in `className`.

## After the codemod

Class order changes on converted elements (bestax writes its own classes first), so snapshot
tests that compare class strings will churn while the rendered page stays the same. Update the
snapshots after reviewing the diff.

If the build runs PurgeCSS, the report says so: a converted element's classes now come from
bestax's code, some of them built from props at runtime (`mt="4"` renders `mt-4`), so the
PurgeCSS config has to scan bestax's dist and safelist those patterns. The docs' optimizing CSS
guide has the config.
