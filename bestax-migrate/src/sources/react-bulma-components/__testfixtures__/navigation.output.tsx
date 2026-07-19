import { Breadcrumb, Dropdown, Menu, Navbar, Pagination, Panel, Tabs } from "@allxsmith/bestax-bulma";

export function Chrome({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  // TODO(bestax-migrate): `boxed` — no boxed prop; add className="is-boxed" to Navbar.DropdownMenu
  // TODO(bestax-migrate): `value` — bestax Dropdown.Item has no value prop; use onClick and your own state
  // TODO(bestax-migrate): `delta` — no delta prop in bestax Pagination
  return (
    <div>
      <Navbar color="dark" fixed="top" transparent>
        <Navbar.Brand>
          <Navbar.Item as="a" href="/">
            Home
          </Navbar.Item>
          <Navbar.Burger />
        </Navbar.Brand>
        <Navbar.Menu>
          <Navbar.Start>
            <Navbar.Item active>Docs</Navbar.Item>
          </Navbar.Start>
          <Navbar.End>
            <Navbar.Dropdown>
              <Navbar.Link arrowless>More</Navbar.Link>
              <Navbar.DropdownMenu boxed right>
                <Navbar.Item href="/about">About</Navbar.Item>
                <Navbar.Divider />
                <Navbar.Item href="/jobs">Jobs</Navbar.Item>
              </Navbar.DropdownMenu>
            </Navbar.Dropdown>
          </Navbar.End>
        </Navbar.Menu>
      </Navbar>
      <Breadcrumb separator="succeeds" alignment="centered" size="medium">
        <li><a href="/">Bulma</a></li>
        <li className="is-active"><a href="/docs">Documentation
                    </a></li>
      </Breadcrumb>
      <Menu>
        <Menu.Label>General</Menu.Label>
        <Menu.List>
          <Menu.Item active>Dashboard</Menu.Item>
          <Menu.Item>Customers</Menu.Item>
        </Menu.List>
      </Menu>
      <Tabs align="centered" fullwidth toggle rounded>
        <Tabs.List>
          <Tabs.Item active>Pictures</Tabs.Item>
          <Tabs.Item>Music</Tabs.Item>
        </Tabs.List>
      </Tabs>
      <Panel color="info">
        <Panel.Heading>Repositories</Panel.Heading>
        <Panel.Tabs>
          <a className="is-active">All</a>
          <a>Public</a>
        </Panel.Tabs>
        <Panel.Block active>bestax</Panel.Block>
      </Panel>
      <Dropdown label="Pick one" hoverable closeOnClick up right>
        <Dropdown.Item value="a">First</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item value="b">Second</Dropdown.Item>
      </Dropdown>
      <Pagination current={page} total={10} onPageChange={setPage} align="centered" rounded delta={2} />
    </div>
  );
}
