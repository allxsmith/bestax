import React from "react";
import { Button, Card, Hero, Level, Media, Menu, Message, Modal, Navbar } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): bestax `Modal` closes on Escape (calling `onClose`) and locks body scroll by default, which bloomer's never did: pass `onClose`, or set `closeOnEscape={false}` / `lockScroll={false}` to keep bloomer's behaviour; it renders inline unless `portal` is set
export const Compounds = ({ open }: { open: boolean }) => (
  <>
    <Card>
      <Card.Header>
        <Card.Header.Title>Title</Card.Header.Title>
        <Card.Header.Icon>
          <span>?</span>
        </Card.Header.Icon>
      </Card.Header>
      <Card.Image>
        <img src="a.png" alt="" />
      </Card.Image>
      <Card.Content>Body</Card.Content>
      <Card.Footer>
        <Card.FooterItem>Save</Card.FooterItem>
      </Card.Footer>
    </Card>
    <Hero color="primary" size="medium">
      <Hero.Head>Head</Hero.Head>
      <Hero.Body>Body</Hero.Body>
      <Hero.Foot>Foot</Hero.Foot>
    </Hero>
    <Hero color="dark" size="fullheight">
      <Hero.Body>Tall</Hero.Body>
    </Hero>
    <Level isMobile>
      <Level.Left>
        <Level.Item>Left</Level.Item>
      </Level.Left>
      <Level.Right>
        <Level.Item href="/all" as="a">
          All
        </Level.Item>
      </Level.Right>
    </Level>
    <Media as="div">
      <Media.Left as="figure">img</Media.Left>
      <Media.Content>text</Media.Content>
      <Media.Right>x</Media.Right>
    </Media>
    <Menu>
      <Menu.Label>General</Menu.Label>
      <Menu.List>
        <Menu.Item active href="/">
          Dashboard
        </Menu.Item>
      </Menu.List>
    </Menu>
    <Message color="info">
      <Message.Header>Hello</Message.Header>
      <Message.Body>World</Message.Body>
    </Message>
    <Modal active={open}>
      <Modal.Background />
      <Modal.Card>
        <Modal.Card.Head>
          <Modal.Card.Title>Modal title</Modal.Card.Title>
        </Modal.Card.Head>
        <Modal.Card.Body>Content</Modal.Card.Body>
        <Modal.Card.Foot>Footer</Modal.Card.Foot>
      </Modal.Card>
      <Modal.Close size="large" />
    </Modal>
    <Navbar transparent>
      <Navbar.Brand>
        <Navbar.Item href="/">Logo</Navbar.Item>
        <Navbar.Burger active={open} />
      </Navbar.Brand>
      <Navbar.Menu active={open}>
        <Navbar.Start>
          <Navbar.Item active>Home</Navbar.Item>
          <Navbar.Dropdown hoverable>
            <Navbar.Link>More</Navbar.Link>
            <Navbar.DropdownMenu>
              <Navbar.Item href="/about">About</Navbar.Item>
              <Navbar.Divider />
              <Navbar.Item>Jobs</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item as="div">
            <Button>Log in</Button>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  </>
);
