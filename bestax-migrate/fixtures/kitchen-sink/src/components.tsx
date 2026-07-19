import { useState } from 'react';
import {
  Breadcrumb,
  Card,
  Dropdown,
  Menu,
  Message,
  Modal,
  Navbar,
  Pagination,
  Panel,
  Tabs,
} from 'react-bulma-components';

export function Widgets() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Navbar color="dark" fixed="top" transparent>
        <Navbar.Brand>
          <Navbar.Item renderAs="a" href="/">
            bestax
          </Navbar.Item>
          <Navbar.Burger />
        </Navbar.Brand>
        <Navbar.Menu>
          <Navbar.Container align="left">
            <Navbar.Item active>Docs</Navbar.Item>
          </Navbar.Container>
          <Navbar.Container align="right">
            <Navbar.Item renderAs="div">
              <Navbar.Link arrowless>More</Navbar.Link>
              <Navbar.Dropdown right>
                <Navbar.Item href="/about">About</Navbar.Item>
                <Navbar.Divider />
                <Navbar.Item href="/jobs">Jobs</Navbar.Item>
              </Navbar.Dropdown>
            </Navbar.Item>
          </Navbar.Container>
        </Navbar.Menu>
      </Navbar>
      <Breadcrumb separator="succeeds" align="center" size="medium">
        <Breadcrumb.Item>
          <a href="/">Bulma</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item active href="/docs">
          Documentation
        </Breadcrumb.Item>
      </Breadcrumb>
      <Card>
        <Card.Image size="4by3" src="/cover.png" alt="Cover" />
        <Card.Header>
          <Card.Header.Title>Widgets</Card.Header.Title>
          <Card.Header.Icon>▼</Card.Header.Icon>
        </Card.Header>
        <Card.Content>Body</Card.Content>
        <Card.Footer>
          <Card.Footer.Item>Save</Card.Footer.Item>
        </Card.Footer>
      </Card>
      <Menu>
        <Menu.List title="General">
          <Menu.List.Item active>Dashboard</Menu.List.Item>
          <Menu.List.Item>Customers</Menu.List.Item>
        </Menu.List>
      </Menu>
      <Message color="danger">
        <Message.Header>Error</Message.Header>
        <Message.Body>Something failed.</Message.Body>
      </Message>
      <Modal show={open} onClose={() => setOpen(false)}>
        <Modal.Card>
          <Modal.Card.Header>
            <Modal.Card.Title>Terms</Modal.Card.Title>
          </Modal.Card.Header>
          <Modal.Card.Body>Fine print.</Modal.Card.Body>
          <Modal.Card.Footer>The end.</Modal.Card.Footer>
        </Modal.Card>
      </Modal>
      <Tabs type="toggle-rounded" align="center" fullwidth>
        <Tabs.Tab active>Pictures</Tabs.Tab>
        <Tabs.Tab>Music</Tabs.Tab>
      </Tabs>
      <Panel color="info">
        <Panel.Header>Repositories</Panel.Header>
        <Panel.Tabs>
          <Panel.Tabs.Tab active>All</Panel.Tabs.Tab>
          <Panel.Tabs.Tab>Public</Panel.Tabs.Tab>
        </Panel.Tabs>
        <Panel.Block active>
          <Panel.Icon>
            <i className="fas fa-book" />
          </Panel.Icon>
          bestax
        </Panel.Block>
      </Panel>
      <Dropdown label="Pick one" hoverable closeOnSelect up>
        <Dropdown.Item>First</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item>Second</Dropdown.Item>
      </Dropdown>
      <Pagination current={page} total={10} onChange={setPage} align="center" rounded size="small" />
    </div>
  );
}
