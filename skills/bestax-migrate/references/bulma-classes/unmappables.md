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
`Progress` types `value` and `max` as numbers, so `value="half"` stays. Every component types
`tabIndex` as a number too, so `tabIndex="0"` converts as `tabIndex={0}`. A number converts only
when it is spelled the way it renders (`value="40"`, not `value="040"`).

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

### `defaults:<Target>`

The component renders attributes of its own when the element doesn't set them. `Delete`
renders `type="button"` and `aria-label="Close"`. On a bare `<button className="delete">`,
converting would add both, changing a submit button inside a form into a plain button. Add the
attributes you want (usually both, with a real label), then re-run. `Navbar` renders
`role="navigation"` and `aria-label="main navigation"`, which Bulma's own navbar markup carries;
give the `<nav>` both, with your own label if you like. `Breadcrumb` renders
`aria-label="breadcrumbs"`, so give its `<nav>` an `aria-label`, whatever it says.
`Icon` renders `aria-label="icon"`, so give a `.icon` an `aria-label` that says what the icon means.
`Pagination` renders Bulma's own `role="navigation"` and `aria-label="pagination"`, and
`Pagination.Previous`, `Pagination.Next` and `Pagination.Link` render `tabIndex={0}`, so give each
element the attribute it's missing.
`Card.FooterItem`, `Card.Header.Icon` and `Navbar.Item` render `type="button"` on a `<button>` that
sets none, and `Card.Header.Icon` renders `aria-label="more options"` too. One whose `type` isn't
`button`, `submit` or `reset` gets an `attr:type` TODO instead, since bestax writes `button` in its
place. Write the type you mean, then re-run.

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
`active`: `<a className={on ? 'is-active' : undefined}>` becomes `<Menu.Item active={on}>`.

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
