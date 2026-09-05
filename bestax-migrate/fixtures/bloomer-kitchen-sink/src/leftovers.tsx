// Everything the bloomer codemod intentionally refuses to convert. This file
// is EXCLUDED from the e2e's typecheck of the migrated output — a `todo`
// PropAction deliberately leaves the original attribute in place next to its
// TODO comment, so the result is not expected to compile. The e2e asserts the
// TODO rules instead.
import React from "react";
import {
  Box,
  Button,
  Columns,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Field,
  Heading,
  Hero,
  Icon,
  Input,
  Media,
  Nav,
  NavItem,
  NavLeft,
  NavToggle,
  Subtitle,
  TabList,
  Tabs,
  Tile,
  Title,
  withHelpersModifiers,
} from "bloomer";
import "bloomer/lib/elements/Box";

const Plain = (props: { className?: string }) => <div {...props} />;
const Helped = withHelpersModifiers(Plain);

export const Leftovers = ({
  go,
  dim,
}: {
  go: (p: object) => JSX.Element;
  dim: string;
}) => (
  <Box tag="section" hasTextColor="white-ter">
    {/* Bulma v1 replaced tiles with Grid/Cell. */}
    <Tile isAncestor>
      <Tile isParent isSize={4}>
        <Tile isChild>tile</Tile>
      </Tile>
    </Tile>

    {/* Bulma 0.4's nav, gone since 0.5 */}
    <Nav>
      <NavLeft>
        <NavItem isActive>Home</NavItem>
      </NavLeft>
      <NavToggle />
    </Nav>

    {/* Bulma v1 no longer styles .heading */}
    <Heading>Label</Heading>

    {/* bestax's Dropdown renders its own trigger and menu */}
    <Dropdown isActive>
      <DropdownTrigger>
        <Button>Open</Button>
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownContent>
          <DropdownItem href="/a">A</DropdownItem>
        </DropdownContent>
      </DropdownMenu>
    </Dropdown>

    {/* no bestax prop for these Bulma modifiers */}
    <Columns isGrid>
      <div />
    </Columns>
    <Hero isBold isHalfHeight>
      hero
    </Hero>
    <Media isSize="large">media</Media>
    <Subtitle isSpaced>sub</Subtitle>
    <Input isActive />
    <Field hasAddons="fullwidth">
      <Input />
    </Field>
    <Tabs>
      <TabList isAlign="center">
        <li />
      </TabList>
    </Tabs>
    <Title isSize={3} isFullWidth>
      Wide
    </Title>

    {/* the render prop, and Font Awesome 4 classes */}
    <Button render={go} isLink isColor="info">
      Rendered
    </Button>
    <Icon className="fa fa-github" />

    {/* dynamic helper values */}
    <Box isDisplay={dim} isHidden={dim === "x"} />

    <Helped isMarginless>helped</Helped>
  </Box>
);
