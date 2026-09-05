import React from "react";
import {
  Box,
  Button,
  Columns,
  Heading,
  HeroVideo,
  Nav,
  NavItem,
  NavLeft,
  Tile,
  Title,
  withHelpersModifiers,
} from "bloomer";
import "bloomer/lib/elements/Box";

const Plain = (props: { className?: string }) => <div {...props} />;
const Helped = withHelpersModifiers(Plain);

export const Leftovers = ({ go }: { go: (p: object) => JSX.Element }) => (
  <Box tag="section">
    <Tile isAncestor>
      <Tile isParent isSize={4}>
        <Tile isChild>tile</Tile>
      </Tile>
    </Tile>
    <Nav>
      <NavLeft>
        <NavItem isActive>Home</NavItem>
      </NavLeft>
    </Nav>
    <Heading tag="h6">Label</Heading>
    <HeroVideo isTransparent>
      <video />
    </HeroVideo>
    <Columns isGrid>
      <div />
    </Columns>
    <Button render={go} isLink isColor="info">
      Rendered
    </Button>
    <Title isSize={3} isFullWidth>
      Wide
    </Title>
    <Helped isMarginless>helped</Helped>
  </Box>
);
