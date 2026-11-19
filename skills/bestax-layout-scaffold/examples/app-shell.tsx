// App shell with sidebar: an AppFrame with a Navbar across the top, a Menu
// column down the side, and the page. The admin/dashboard default.
//
// AppFrame lays the page out and keeps the header and the menu column in view
// while the page scrolls, so the Navbar is not `fixed` and <html> needs no
// `has-navbar-fixed-top`. Below the desktop breakpoint the menu becomes a drawer
// that AppFrame.Burger opens; from desktop up the burger collapses the column.
// The frame renders the page's <main>, so it goes at the top of the app, not
// inside a <main> of its own.
//
// Bulma hides `Navbar.Menu` below desktop until it's active, so the links it
// would hold go in the menu column as well, here under "Account".
//
// `ConfigProvider` wraps the shell once at the root to set the app-wide icon
// library (so <Icon> needs no `library` prop) and, optionally, a class prefix.
import {
  AppFrame,
  ConfigProvider,
  Navbar,
  Menu,
  Section,
  Title,
  Box,
} from '@allxsmith/bestax-bulma';

export default function AdminShell() {
  return (
    <ConfigProvider iconLibrary="fa">
      <AppFrame>
        <AppFrame.Header>
          <Navbar color="dark" aria-label="Site">
            <Navbar.Brand>
              <Navbar.Item href="#">Acme Admin</Navbar.Item>
              <AppFrame.Burger />
            </Navbar.Brand>
          </Navbar>
        </AppFrame.Header>

        <AppFrame.Nav>
          <Menu>
            <Menu.Label>General</Menu.Label>
            <Menu.List>
              <Menu.Item active href="#">
                Dashboard
              </Menu.Item>
              <Menu.Item href="#">Customers</Menu.Item>
              <Menu.Item href="#">Orders</Menu.Item>
            </Menu.List>
            <Menu.Label>Admin</Menu.Label>
            <Menu.List>
              <Menu.Item href="#">Team</Menu.Item>
              <Menu.Item href="#">Settings</Menu.Item>
            </Menu.List>
            <Menu.Label>Account</Menu.Label>
            <Menu.List>
              <Menu.Item href="#">Docs</Menu.Item>
              <Menu.Item href="#">Profile</Menu.Item>
            </Menu.List>
          </Menu>
        </AppFrame.Nav>

        <AppFrame.Main>
          <Section>
            <Title size="3">Dashboard</Title>
            <Box>Main content area: drop dashboard widgets here.</Box>
          </Section>
        </AppFrame.Main>
      </AppFrame>
    </ConfigProvider>
  );
}
