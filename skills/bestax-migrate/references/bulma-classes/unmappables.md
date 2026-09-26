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
spread carries, or leave it.

### `ref:<Target>`

The element has a `ref`, and the bestax component doesn't forward one, so the ref would stop
reaching the DOM node. Only `Button` and `Link` forward refs among the components this source
converts. Keep the element as markup.

### `tag:<Target>`

bestax renders that component on a fixed tag, or a short list of them through `as` (see the
**Tags** column in [component-map.md](component-map.md)), and this element is on another one:
`<div className="section">`, `<p className="notification">`. Changing the tag changes the
markup, so decide whether you want it; if you do, change it and re-run.

### `attr:<prop>`

An attribute on the element is also a prop of the bestax component, which would read it
differently: `<div className="box" color="red">` would lose its `color` attribute to Box's text
color. Rename or drop the attribute, then re-run.

It also covers an attribute the component's props type rejects. `Delete` takes no `type`
(`type="button"` is the one value that converts, because `Delete` renders it anyway), and
`Progress` types `value` and `max` as numbers, so `value="half"` stays. A number converts only
when it is spelled the way it renders (`value="40"`, not `value="040"`).

`attr:dangerouslySetInnerHTML` is the same kind of refusal: the element sets its own content,
and some bestax components render content of their own beside `children`, which React
rejects. Keep the element as markup.

`attr:className` is a `.navbar-divider` with another class on it (`<hr className="navbar-divider
mt-2">`). `Navbar.Divider` drops its own class for a `className` it's given, so the conversion
would lose `.navbar-divider`. Keep the element as markup, or move the extra class off it.

### `defaults:<Target>`

The component renders attributes of its own when the element doesn't set them. `Delete`
renders `type="button"` and `aria-label="Close"`. On a bare `<button className="delete">`,
converting would add both, changing a submit button inside a form into a plain button. Add the
attributes you want (usually both, with a real label), then re-run. `Navbar` renders
`role="navigation"` and `aria-label="main navigation"`, which Bulma's own navbar markup carries;
give the `<nav>` both, with your own label if you like.

### `drops:<Target>`

The component drops an attribute on this tag. Most of these do nothing there anyway: `Button`
drops `href`, `target` and `rel` on a `<button>`, and `Level.Item` keeps link attributes only
on an `<a>`. Remove the attribute, then re-run.

`disabled` is the exception. `Button` drops it on a tag with no disabled state
(`<a className="button" disabled>`), but Bulma greys out a disabled `.button` on any tag, so
dropping it would change how the element looks. Keep that element as markup.

### `children:<Target>`

The component's props type requires children, and the element has none (`Buttons`). An empty
`.buttons` does nothing; delete it or give it buttons.

On `Card` and `Card.Header` it means the children decide. `Card` renders its children inside a
`.card-content` of its own unless one of them is one of its parts (`Card.Header`,
`Card.Header.Icon`, `Card.Image`, `Card.Content`, `Card.Footer`, `Card.FooterItem`), and
`Card.Header` renders a `.card-header-title` of its own unless one of its children is a
`Card.Header.Title`. None of this element's direct children converted to one, so converting it
would add that wrapper. Look at the TODOs on the children first: a `<p className="card-header-title">`
gets `tag:Card.Header.Title`, and changing it to a `<div>` (Bulma styles it the same) lets the
header convert on the next run. A card whose content sits straight inside it, with no
`.card-content`, has no part to find; wrap that content in `Card.Content` if the extra padding
is what you want, or keep the markup. A part inside an expression (`{open && <div className="card-content">}`)
doesn't count, because it may not render.

### `context:<Target>`

`Field` and `Control` tell bestax's form controls inside them to skip their own `.field` and
`.control` wrappers. A `.field` or `.control` that already holds a bestax component (an `Input`
from an earlier, partial migration) would change how that component renders once converted, so
it stays markup. Convert it by hand and check that the component inside still renders what you
want, or leave it.

On an input or textarea it's the other direction: inside a bestax `Field` with a `label`,
`InputBase` and `TextAreaBase` take the Field's generated `id` when they have none, which the
element didn't have. Context follows what renders, not what the file says, so an input with no
`id` inside any other component of the app stays markup too, since that component could render
a labelled `Field` around it. Give the element its own `id`, then re-run.

The codemod reads one file at a time, so it can't see a component in another file that renders
a bestax `Field` or form control around this markup. If the app already uses them that way, give
its inputs ids before running the codemod, and check its forms afterwards.

### `only-child:<Target>`

The element is the only child of another component (`<Link href="/x"><a className="button">`),
which may reach into it with `cloneElement`: next/link's legacy behavior, a tooltip, a Radix
`asChild` trigger. A bestax component would not take those props or that ref the same way.
Convert it by hand if the parent only renders its children.

### `dynamic-class:<Target>`

The `className` is computed (`clsx(...)`, a ternary, a template with expressions), and with
its classes written out the element would become bestax `<Target>`. The codemod converts
static strings only. Convert by hand with the [prop map](prop-map.md), turning each condition
into the prop:

```tsx
// before
<button className={clsx('button', busy && 'is-loading')}>Save</button>
// after
<Button isLoading={busy}>Save</Button>
```

The classes in a computed `className` still count for every other rule: a `clsx('box')` on a
`<span>` gets `tag:Box`, and a `clsx('dropdown', …)` gets `family:dropdown`.

## A family it leaves as markup: `family:<class>`

The bestax component renders parts of its own, or adds attributes, so a one-element-at-a-time
conversion would change the markup. Convert the whole family by hand, and look at the result
in the browser:

- **`family:navbar-burger`**: `Navbar.Burger` is a `<button>` that renders its own spans and
  sets `aria-expanded` from `active`. Replace the whole toggle with it, drive `active` from the
  state the old click handler flipped, and pass the same state to `Navbar.Menu`'s `active`.
- **`family:navbar-link`**: inside a `Navbar.Dropdown`, `Navbar.Link` adds `aria-haspopup`,
  `aria-expanded` and keyboard handling. The codemod turned the `.has-dropdown` item around it
  into a `Navbar.Item` that keeps the class; to get the dropdown behavior, replace that item
  with `Navbar.Dropdown` (`hoverable` for `is-hoverable`) and the link with `Navbar.Link`.
- **`family:select`**: `SelectBase` renders the `.select` wrapper and the `<select>` together,
  with the element's attributes on the `<select>`. Replace the pair with one `SelectBase`
  inside the `Control`, keeping the `<option>`s as its children. See the `bestax-form` skill.
- **`family:file`**: `File` renders the whole `.file-label` tree itself, and a `.field` around
  it unless it's already inside one. Replace the `.file` block with one `File`; its API page
  lists the props for the button text, the file name and the icons.
- **`family:checkbox`**, **`family:radio`**, **`family:checkboxes`**, **`family:radios`**:
  bestax renders its own styled checkbox and radio markup, not Bulma's.
- **`family:modal`**: `Modal` renders its own background and content parts, and adds dialog
  attributes. Rebuild it with `Modal` and its parts, and drive it with its open prop.
- **`family:dropdown`**: `Dropdown` renders its own trigger and menu from props.
- **`family:icon`**, **`family:icon-text`**: `Icon` renders its own `<i>` and adds an
  `aria-label`. See the `bestax-icons` skill for its library and name props.
- **`family:image`**: `Image` renders its own `<img>`.
- **`family:menu`**: `Menu.Item` renders the `<li>` and the `<a>` together.
- **`family:message`**: `Message` always wraps its children in `.message-body`.
- **`family:pagination`**, **`family:panel`**, **`family:tabs`**, **`family:breadcrumb`**:
  each renders list items, links or roles of its own. Rebuild them from the component's docs.
- **`family:fixed-grid`**: `Grid isFixed` renders the `.fixed-grid` wrapper itself, and its
  `has-N-cols` classes from `fixedCols` (and `fixedColsMobile` and the other viewports). The
  `.grid` inside has already become a `Grid`; move the wrapper's column counts onto it as those
  props, add `isFixed`, and delete the wrapper.
- **`family:table-container`**: bestax renders `.table-container` from `Table isResponsive`.
- **`family:skeleton-block`**, **`family:skeleton-lines`**: `Skeleton` renders its own markup.

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
