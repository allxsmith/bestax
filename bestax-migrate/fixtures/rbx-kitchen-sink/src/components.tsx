import React from "react";
import {
  Breadcrumb,
  Card,
  Level,
  Media,
  Menu,
  Message,
  Modal,
  Navbar,
  Pagination,
  Panel,
  Tab,
} from "rbx";

export const Components = () => (
  <>
    <Card>
      <Card.Header>
        <Card.Header.Title align="centered">Card</Card.Header.Title>
        <Card.Header.Icon>+</Card.Header.Icon>
      </Card.Header>
      <Card.Content>Body</Card.Content>
      <Card.Footer>
        <Card.Footer.Item>Action</Card.Footer.Item>
      </Card.Footer>
    </Card>
    <Breadcrumb align="centered" separator="bullet" size="small">
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item active href="/here">
        Here
      </Breadcrumb.Item>
    </Breadcrumb>
    <Level breakpoint="mobile">
      <Level.Item align="left">Left</Level.Item>
      <Level.Item>Middle</Level.Item>
      <Level.Item align="right">Right</Level.Item>
    </Level>
    <Media>
      <Media.Item align="left">Avatar</Media.Item>
      <Media.Item align="content">Content</Media.Item>
      <Media.Item align="right">Extra</Media.Item>
    </Media>
    <Menu>
      <Menu.Label>Menu</Menu.Label>
      <Menu.List>
        <Menu.List.Item active>Active</Menu.List.Item>
        <Menu.List.Item>Other</Menu.List.Item>
      </Menu.List>
    </Menu>
    <Message color="success">
      <Message.Header>Header</Message.Header>
      <Message.Body>Body</Message.Body>
    </Message>
    <Modal active>
      <Modal.Background />
      <Modal.Card>
        <Modal.Card.Head>
          <Modal.Card.Title>Title</Modal.Card.Title>
        </Modal.Card.Head>
        <Modal.Card.Body>Body</Modal.Card.Body>
        <Modal.Card.Foot>Foot</Modal.Card.Foot>
      </Modal.Card>
      <Modal.Close />
    </Modal>
    <Navbar color="primary" fixed="top" transparent>
      <Navbar.Brand>
        <Navbar.Item>Brand</Navbar.Item>
        <Navbar.Burger />
      </Navbar.Brand>
      <Navbar.Menu>
        <Navbar.Segment align="start">
          <Navbar.Item active>Start</Navbar.Item>
          <Navbar.Divider />
        </Navbar.Segment>
        <Navbar.Segment align="end">
          <Navbar.Item>End</Navbar.Item>
        </Navbar.Segment>
      </Navbar.Menu>
    </Navbar>
    <Pagination align="centered" size="small" rounded>
      <Pagination.Step align="previous">Prev</Pagination.Step>
      <Pagination.List>
        <Pagination.Link>1</Pagination.Link>
        <Pagination.Ellipsis />
      </Pagination.List>
      <Pagination.Step align="next">Next</Pagination.Step>
    </Pagination>
    <Panel color="info">
      <Panel.Heading>Panel</Panel.Heading>
      <Panel.Tab.Group>
        <Panel.Tab active>All</Panel.Tab>
        <Panel.Tab>Some</Panel.Tab>
      </Panel.Tab.Group>
      <Panel.Block active>Block</Panel.Block>
    </Panel>
    <Tab.Group align="centered" size="medium" kind="toggle-rounded" fullwidth>
      <Tab active>One</Tab>
      <Tab>Two</Tab>
    </Tab.Group>
  </>
);
