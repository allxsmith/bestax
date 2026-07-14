# Layout archetypes

Four named, composable page patterns. For each: **when to pick it**, the **JSX skeleton**, and its
**responsive behavior**. Map the request to one archetype and build it — do not ask the user layout
questions. Full runnable versions live in `examples/`.

Wrap any page once at the root in `<ConfigProvider iconLibrary="…">` so `<Icon>` needs no per-icon
`library` prop (see `examples/app-shell.tsx` and `examples/content-page.tsx`). Inside, style with
helper props (`mt`, `textAlign`, `textColor`), never inline `style`.

---

## 1. App shell with sidebar

**Pick when:** the request is an internal/authenticated tool — dashboard, admin, console, back
office, or anything that mentions a persistent sidebar/navigation. The default for "build me an
app".

**Skeleton:**

```tsx
<>
  <Navbar fixed="top" color="dark">
    <Navbar.Brand>
      <Navbar.Item href="#">Brand</Navbar.Item>
      <Navbar.Burger
        active={open}
        onClick={() => setOpen(o => !o)}
        aria-label="menu"
      />
    </Navbar.Brand>
    <Navbar.Menu active={open}>
      <Navbar.End>
        <Navbar.Item href="#">Account</Navbar.Item>
      </Navbar.End>
    </Navbar.Menu>
  </Navbar>

  <Container fluid>
    <Columns>
      <Column size={3} sizeWidescreen={2}>
        <Menu>
          <Menu.Label>General</Menu.Label>
          <Menu.List>
            <Menu.Item active href="#">
              Dashboard
            </Menu.Item>
            <Menu.Item href="#">Customers</Menu.Item>
          </Menu.List>
        </Menu>
      </Column>
      <Column>
        <Section>{/* main content */}</Section>
      </Column>
    </Columns>
  </Container>
</>
```

**Required:** add `has-navbar-fixed-top` to `<html>` (see `examples/app-shell.tsx`) so content is
not hidden behind the fixed navbar.

**Responsive:** the navbar collapses to a burger on mobile (`Navbar.Burger` + `Navbar.Menu active`).
The sidebar and content columns sit side by side on tablet and up, and stack (menu above content)
on mobile.

---

## 2. Marketing / landing

**Pick when:** the request is a public-facing page — landing, homepage, marketing, product or
pricing page. The default for "build me a site/page".

**Skeleton:**

```tsx
<>
  <Hero color="primary" size="medium">
    <Hero.Body>
      <Container textAlign="centered">
        <Title size="1">Headline</Title>
        <SubTitle size="3">Supporting line.</SubTitle>
        <Buttons isCentered>
          <Button color="light" size="large">
            Primary CTA
          </Button>
        </Buttons>
      </Container>
    </Hero.Body>
  </Hero>

  <Section size="large">
    <Container>
      <Columns>
        <Column>
          <Box>{/* feature */}</Box>
        </Column>
        <Column>
          <Box>{/* feature */}</Box>
        </Column>
        <Column>
          <Box>{/* feature */}</Box>
        </Column>
      </Columns>
    </Container>
  </Section>

  <Footer>
    <Container>
      <Content textAlign="centered">{/* footer */}</Content>
    </Container>
  </Footer>
</>
```

**Responsive:** `Section`s already stack vertically. The feature `Columns` collapse to one feature
per row on mobile. Use `Hero size="large"` / `"fullheight"` for a taller hero.

**Hero CTAs:** on a colored hero use **filled** buttons only — `color="light"` for the primary
CTA and `color="primary" isInverted` (solid white, primary text) for a secondary. A thin
`isOutlined` button on a fixed-color surface is low-contrast and degrades further under OS dark
mode. Single-mode page designs should also pin the scheme at the root
(`<Theme isRoot colorMode="light">`) — see the `bestax-theming` skill's contrast rules.

---

## 3. Centered single-column

**Pick when:** the request is one focused task — login, sign up, auth, settings, checkout, or a
single standalone form/panel.

**Skeleton:**

```tsx
<Section>
  <Container>
    <Columns isCentered>
      <Column size="half" sizeWidescreen="one-third">
        <Box>{/* form / panel */}</Box>
      </Column>
    </Columns>
  </Container>
</Section>
```

**Responsive:** the centered column is narrow on desktop and becomes full width on mobile. Tighten
or widen via the `size*` breakpoint props (`one-third` desktop, `half` tablet, full mobile).

---

## 4. Card grid / catalog

**Pick when:** the request is a collection of similar items — catalog, gallery, products, listing,
search results, "a grid of cards".

**Skeleton:**

```tsx
<Section>
  <Container>
    <Columns isMultiline>
      {items.map(item => (
        <Column
          key={item.id}
          sizeMobile="full"
          sizeTablet="half"
          sizeDesktop="one-third"
          display="flex"
          flexDirection="column"
        >
          <Card
            flexGrow="1"
            image={item.image}
            header={item.name}
            footer={<span className="card-footer-item">{item.price}</span>}
          >
            {item.blurb}
          </Card>
        </Column>
      ))}
    </Columns>
  </Container>
</Section>
```

**Responsive:** `isMultiline` wraps cards onto new rows; the `size*` props set the per-row count —
1 on mobile, 2 on tablet, 3 on desktop here. Change the fractions to change the column count.

**Equal heights:** the `display="flex" flexDirection="column"` on each `Column` plus
`flexGrow="1"` on the `Card` stretches every card to its row's height — without it, cards end
at their content and rows look ragged (`height: 100%` on the card does nothing). Alternatively
build the whole grid with `Grid`/`Cell` (`<Grid isFixed fixedColsMobile={1} fixedColsTablet={2}
fixedColsDesktop={3} gap={4}>`) — CSS Grid keeps cells equal-height for free; see the
`Grid / Cell` section in `layout-components.md`.

---

## Combining archetypes

Archetypes nest. An "admin dashboard with a product list" is **App shell** whose main `Column`
holds a **Card grid**. A "settings page inside the app" is **App shell** whose main column holds a
**Centered** panel. Pick the outer archetype from the dominant intent, then place another inside
its content area.
