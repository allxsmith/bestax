import { Button, Buttons, Navbar } from "@allxsmith/bestax-bulma";
export function SiteNavbar() {
  // TODO(bestax-migrate): `.navbar-burger` stays as markup: bestax `Navbar.Burger` is a `<button>` that renders its own spans and `aria-expanded`, so rebuild the toggle with it, by hand
  // TODO(bestax-migrate): `.navbar-link` stays as markup: inside a `Navbar.Dropdown`, bestax `Navbar.Link` adds `aria-haspopup`, `aria-expanded` and keyboard handling, so convert the `.has-dropdown` item and its link together, by hand
  return (
    <Navbar role="navigation" aria-label="main navigation">
      <Navbar.Brand>
        <Navbar.Item href="https://bulma.io">
          <img src="/logo.svg" alt="Logo" />
        </Navbar.Item>
        <a
          role="button"
          className="navbar-burger"
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarBasicExample"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </Navbar.Brand>
      <Navbar.Menu id="navbarBasicExample">
        <Navbar.Start>
          <Navbar.Item>Home</Navbar.Item>
          <Navbar.Item>Documentation</Navbar.Item>
          <Navbar.Item as="div" className="has-dropdown is-hoverable">
            <a className="navbar-link">More</a>
            <Navbar.DropdownMenu>
              <Navbar.Item>About</Navbar.Item>
              <Navbar.Item className="is-selected">Jobs</Navbar.Item>
              <Navbar.Item>Contact</Navbar.Item>
              <Navbar.Divider />
              <Navbar.Item>Report an issue</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Item>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item as="div">
            <Buttons>
              <Button as="a" color="primary">
                <strong>Sign up</strong>
              </Button>
              <Button as="a" isLight>Log in</Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
