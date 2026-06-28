// App shell with sidebar — fixed top Navbar + a narrow Menu column beside the
// main content. The admin/dashboard default.
//
// A fixed-top navbar needs the `has-navbar-fixed-top` class on <html> so the page
// is padded below it — Bulma requires this and the library does NOT add it for
// you. The columns sit side by side on tablet and up, and stack (menu above
// content) on mobile.
import React, { useEffect, useState } from 'react';
import {
  Navbar,
  Menu,
  Container,
  Columns,
  Column,
  Section,
  Title,
  Box,
} from '@allxsmith/bestax-bulma';

export default function AdminShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('has-navbar-fixed-top');
    return () => {
      document.documentElement.classList.remove('has-navbar-fixed-top');
    };
  }, []);

  return (
    <>
      <Navbar fixed="top" color="dark">
        <Navbar.Brand>
          <Navbar.Item href="#">Acme Admin</Navbar.Item>
          <Navbar.Burger
            active={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
            aria-label="menu"
            aria-expanded={menuOpen}
          />
        </Navbar.Brand>
        <Navbar.Menu active={menuOpen}>
          <Navbar.End>
            <Navbar.Item href="#">Docs</Navbar.Item>
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
                <Menu.Item href="#">Orders</Menu.Item>
              </Menu.List>
              <Menu.Label>Admin</Menu.Label>
              <Menu.List>
                <Menu.Item href="#">Team</Menu.Item>
                <Menu.Item href="#">Settings</Menu.Item>
              </Menu.List>
            </Menu>
          </Column>

          <Column>
            <Section>
              <Title size="3">Dashboard</Title>
              <Box>Main content area — drop dashboard widgets here.</Box>
            </Section>
          </Column>
        </Columns>
      </Container>
    </>
  );
}
