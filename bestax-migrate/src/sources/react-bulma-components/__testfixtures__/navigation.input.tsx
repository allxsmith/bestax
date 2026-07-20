import { Breadcrumb, Dropdown, Menu, Navbar, Pagination, Panel, Tabs } from 'react-bulma-components';

export function Chrome({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  return (
    <div>
      <Navbar color="dark" fixed="top" transparent>
        <Navbar.Brand>
          <Navbar.Item renderAs="a" href="/">
            Home
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
              <Navbar.Dropdown boxed right>
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
      <Menu>
        <Menu.List title="General">
          <Menu.List.Item active>Dashboard</Menu.List.Item>
          <Menu.List.Item>Customers</Menu.List.Item>
        </Menu.List>
      </Menu>
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
        <Panel.Block active>bestax</Panel.Block>
      </Panel>
      <Dropdown label="Pick one" hoverable closeOnSelect up align="right">
        <Dropdown.Item value="a">First</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item value="b">Second</Dropdown.Item>
      </Dropdown>
      <Pagination current={page} total={10} onChange={setPage} align="center" rounded delta={2} />
    </div>
  );
}
