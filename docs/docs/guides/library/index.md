---
title: Library Overview
sidebar_label: Overview
sidebar_position: 1
---

# Library Overview

**bestax-bulma** wraps every Bulma CSS class in a typed React component, giving you full IntelliSense, prop-level validation, and zero class-string wiring. The library mirrors Bulma's own layered design so that mapping between the CSS docs and the React API is always one-to-one.

```tsx live
<Box>
  <Columns isVCentered>
    <Column isNarrow>
      <Icon name="cube" size="large" textColor="primary" ariaLabel="library" />
    </Column>
    <Column>
      <Title size="4" mb="1">
        80 typed components
      </Title>
      <SubTitle size="6" textColor="grey">
        Elements, Components, Form, Layout — all in one package.
      </SubTitle>
    </Column>
    <Column isNarrow>
      <Tags>
        <Tag color="primary">React</Tag>
        <Tag color="info">Bulma v1</Tag>
        <Tag color="success">TypeScript</Tag>
      </Tags>
    </Column>
  </Columns>
</Box>
```

---

## Architecture

Bulma organises its styles into a clear hierarchy, and bestax-bulma mirrors it exactly:

```tsx live
<Grid isFixed fixedCols={3} gap={4}>
  <Cell>
    <Notification color="primary" textColor="black" fullHeight>
      <Title size="5" textColor="black">
        Elements
      </Title>
      <Tag color="dark" isRounded>
        30
      </Tag>
      <Paragraph mt="2" textColor="black">
        Foundational atoms — buttons, tags, icons, typography
      </Paragraph>
      <a
        href="/docs/guides/library/elements"
        style={{ color: '#000', fontWeight: 'bold' }}
      >
        See more &rarr;
      </a>
    </Notification>
  </Cell>
  <Cell>
    <Notification color="link" textColor="black" fullHeight>
      <Title size="5" textColor="black">
        Components
      </Title>
      <Tag color="dark" isRounded>
        19
      </Tag>
      <Paragraph mt="2" textColor="black">
        Composed patterns — modals, navbars, cards, tabs
      </Paragraph>
      <a
        href="/docs/guides/library/components"
        style={{ color: '#000', fontWeight: 'bold' }}
      >
        See more &rarr;
      </a>
    </Notification>
  </Cell>
  <Cell>
    <Notification color="success" textColor="black" fullHeight>
      <Title size="5" textColor="black">
        Form
      </Title>
      <Tag color="dark" isRounded>
        16
      </Tag>
      <Paragraph mt="2" textColor="black">
        Input controls — text fields, selects, checkboxes
      </Paragraph>
      <a
        href="/docs/guides/library/form"
        style={{ color: '#000', fontWeight: 'bold' }}
      >
        See more &rarr;
      </a>
    </Notification>
  </Cell>
  <Cell>
    <Notification color="info" textColor="black" fullHeight>
      <Title size="5" textColor="black">
        Columns
      </Title>
      <Tag color="dark" isRounded>
        2
      </Tag>
      <Paragraph mt="2" textColor="black">
        Classic 12-column flexbox grid
      </Paragraph>
      <a href="/docs/api/columns" style={{ color: '#000', fontWeight: 'bold' }}>
        See more &rarr;
      </a>
    </Notification>
  </Cell>
  <Cell>
    <Notification color="warning" textColor="black" fullHeight>
      <Title size="5" textColor="black">
        Grid
      </Title>
      <Tag color="dark" isRounded>
        2
      </Tag>
      <Paragraph mt="2" textColor="black">
        Bulma v1 CSS-grid layout
      </Paragraph>
      <a href="/docs/api/grid" style={{ color: '#000', fontWeight: 'bold' }}>
        See more &rarr;
      </a>
    </Notification>
  </Cell>
  <Cell>
    <Notification color="danger" textColor="black" fullHeight>
      <Title size="5" textColor="black">
        Layout
      </Title>
      <Tag color="dark" isRounded>
        6
      </Tag>
      <Paragraph mt="2" textColor="black">
        Page-level containers — hero, footer, section
      </Paragraph>
      <a
        href="/docs/api/layout/container"
        style={{ color: '#000', fontWeight: 'bold' }}
      >
        See more &rarr;
      </a>
    </Notification>
  </Cell>
</Grid>
```

Every Bulma class has a corresponding React component in the matching tier, so the mental model you already know from Bulma transfers directly.

---

## Elements (30)

Foundational building blocks: typography, buttons, media, lists, data display, and feedback.

[Block](/docs/api/elements/block), [Box](/docs/api/elements/box), [Button](/docs/api/elements/button), [Buttons](/docs/api/elements/buttons), [Code](/docs/api/elements/code), [Content](/docs/api/elements/content), [Delete](/docs/api/elements/delete), [Divider](/docs/api/elements/divider), [Emphasis](/docs/api/elements/emphasis), [Figure](/docs/api/elements/figure), [Icon](/docs/api/elements/icon), [IconText](/docs/api/elements/icontext), [Image](/docs/api/elements/image), [Link](/docs/api/elements/link), [LinkButton](/docs/api/elements/linkbutton), [ListItem](/docs/api/elements/listitem), [Notification](/docs/api/elements/notification), [OrderedList](/docs/api/elements/orderedlist), [Paragraph](/docs/api/elements/paragraph), [Pre](/docs/api/elements/pre), [Progress](/docs/api/elements/progress), [Skeleton](/docs/api/elements/skeleton), [Span](/docs/api/elements/span), [Strong](/docs/api/elements/strong), [SubTitle](/docs/api/elements/subtitle), [Table](/docs/api/elements/table), [Tag](/docs/api/elements/tag), [Tags](/docs/api/elements/tags), [Title](/docs/api/elements/title), [UnorderedList](/docs/api/elements/unorderedlist)

```tsx live
<div>
  <Buttons>
    <Button color="primary">Primary</Button>
    <Button color="info" isOutlined>
      Info
    </Button>
    <Button color="success" isLight>
      Success
    </Button>
  </Buttons>
  <Progress value={65} max={100} color="primary" />
  <Tags mt="3">
    <Tag color="info">React</Tag>
    <Tag color="primary">Bulma</Tag>
    <Tag color="success">TypeScript</Tag>
    <Tag color="warning">Accessible</Tag>
  </Tags>
</div>
```

[Browse all Elements &rarr;](/docs/guides/library/elements)

---

## Components (19)

Higher-level composed UI patterns: navigation, overlays, feedback, and interactive controls.

[Breadcrumb](/docs/api/components/breadcrumb), [Card](/docs/api/components/card), [Carousel](/docs/api/components/carousel), [Collapse](/docs/api/components/collapse), [Dialog](/docs/api/components/dialog), [Dropdown](/docs/api/components/dropdown), [Loading](/docs/api/components/loading), [Menu](/docs/api/components/menu), [Message](/docs/api/components/message), [Modal](/docs/api/components/modal), [Navbar](/docs/api/components/navbar), [Pagination](/docs/api/components/pagination), [Panel](/docs/api/components/panel), [Sidebar](/docs/api/components/sidebar), [Snackbar](/docs/api/components/snackbar), [Steps](/docs/api/components/steps), [Tabs](/docs/api/components/tabs), [Toast](/docs/api/components/toast), [Tooltip](/docs/api/components/tooltip)

```tsx live
<Columns>
  <Column>
    <Card>
      <Card.Content>
        <Title size="5">Dashboard</Title>
        <SubTitle size="6" textColor="grey">
          Analytics overview
        </SubTitle>
        <Progress value={72} max={100} color="info" />
      </Card.Content>
    </Card>
  </Column>
  <Column>
    <Card>
      <Card.Content>
        <Title size="5">Users</Title>
        <SubTitle size="6" textColor="grey">
          Manage accounts
        </SubTitle>
        <Progress value={45} max={100} color="success" />
      </Card.Content>
    </Card>
  </Column>
</Columns>
```

[Browse all Components &rarr;](/docs/guides/library/components)

---

## Form (16)

Input controls for building accessible, flexible forms.

[Autocomplete](/docs/api/form/autocomplete), [Checkbox](/docs/api/form/checkbox), [Checkboxes](/docs/api/form/checkboxes), [Control](/docs/api/form/control), [Field](/docs/api/form/field), [File](/docs/api/form/file), [Input](/docs/api/form/input), [Numberinput](/docs/api/form/numberinput), [Radio](/docs/api/form/radio), [Radios](/docs/api/form/radios), [Rate](/docs/api/form/rate), [Select](/docs/api/form/select), [Slider](/docs/api/form/slider), [Switch](/docs/api/form/switch), [Taginput](/docs/api/form/taginput), [TextArea](/docs/api/form/textarea)

`Input`, `Select`, and `TextArea` accept `label`, icon, and `message` props to auto-wrap with `Field` + `Control`. For complex layouts, use the raw `InputBase`, `SelectBase`, and `TextAreaBase` primitives.

```tsx live
function FormShowcase() {
  const [on, setOn] = React.useState(true);
  return (
    <Columns>
      <Column>
        <Field label="Name">
          <Input placeholder="Jane Doe" />
        </Field>
      </Column>
      <Column>
        <Field label="Role">
          <Select>
            <option>Developer</option>
            <option>Designer</option>
            <option>Manager</option>
          </Select>
        </Field>
      </Column>
      <Column isNarrow>
        <Field label="Active">
          <Switch
            checked={on}
            onChange={e => setOn(e.target.checked)}
            color="success"
            isRounded
          >
            {on ? 'Yes' : 'No'}
          </Switch>
        </Field>
      </Column>
    </Columns>
  );
}
```

[Browse all Form components &rarr;](/docs/guides/library/form)

---

## Columns & Grid

:::info Two layout systems
**Columns** is Bulma's classic 12-column flexbox system — great for most layouts. **Grid** is the new CSS-grid system in Bulma v1 — ideal for complex, auto-responsive layouts.
:::

**Columns** — classic flexbox:

```tsx live
<Columns>
  <Column size="one-quarter">
    <Notification color="primary" textAlign="centered">
      1/4
    </Notification>
  </Column>
  <Column>
    <Notification color="link" textAlign="centered">
      Auto
    </Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="primary" textAlign="centered">
      1/4
    </Notification>
  </Column>
</Columns>
```

**Grid** — CSS-grid with auto-responsive cells:

```tsx live
<Grid minCol={8} gap={3}>
  <Cell>
    <Notification color="success" textAlign="centered">
      1
    </Notification>
  </Cell>
  <Cell colSpan={2}>
    <Notification color="warning" textAlign="centered">
      span 2
    </Notification>
  </Cell>
  <Cell>
    <Notification color="success" textAlign="centered">
      3
    </Notification>
  </Cell>
  <Cell>
    <Notification color="info" textAlign="centered">
      4
    </Notification>
  </Cell>
  <Cell>
    <Notification color="info" textAlign="centered">
      5
    </Notification>
  </Cell>
</Grid>
```

[View Columns API &rarr;](/docs/api/columns) &nbsp;|&nbsp; [View Grid API &rarr;](/docs/api/grid)

---

## Layout (6)

Page-level structural primitives.

[Container](/docs/api/layout/container), [Footer](/docs/api/layout/footer), [Hero](/docs/api/layout/hero), [Level](/docs/api/layout/level), [Media](/docs/api/layout/media), [Section](/docs/api/layout/section)

```tsx live
<Hero color="info" size="small">
  <Hero.Body>
    <Title>Hero Banner</Title>
    <SubTitle>Page-level layout components give your app structure.</SubTitle>
  </Hero.Body>
</Hero>
```

[View Layout API &rarr;](/docs/api/layout/container)

---

## Helpers

Utilities for working with Bulma classes and configuration:

- **useBulmaClasses** — a React hook that converts helper props into Bulma class strings
- **classNames** — a lightweight class-merging utility
- **Theme** — a component that injects Bulma CSS variables for local or global theming
- **ConfigProvider** — a context provider for global settings like class prefix and icon library

[View Helpers API &rarr;](/docs/api/helpers/usebulmaclasses)

---

## Extras — free forever

:::tip 🍺 Free as in beer
Every component in this library — including all extras — is free and always will be. No premium tier, no paywall.
:::

Beyond the core Bulma wrappers, bestax-bulma ships additional components that fill gaps where Bulma doesn't provide a built-in solution:

| Category       | Extras                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| **Components** | Carousel, Steps, Dialog, Toast, Snackbar, Sidebar, Loading, Tooltip, Collapse |
| **Form**       | Autocomplete, Switch, Slider, Numberinput, Rate, Taginput                     |
| **Elements**   | LinkButton                                                                    |

These extras include purpose-built SCSS that follows Bulma v1's CSS-variable conventions, so they theme and customise exactly like native Bulma components. They're bundled into `bestax.css` — no separate import needed.
