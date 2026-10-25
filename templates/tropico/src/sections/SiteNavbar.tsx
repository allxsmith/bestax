import { useState } from 'react';
import { Button, Buttons, Container, Navbar } from '@allxsmith/bestax-bulma';
import { routes, type Route } from '../router.ts';

const links: { route: Route; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'fruits', label: 'Fruits' },
  { route: 'services', label: 'Services' },
  { route: 'contact', label: 'Contact us' },
];

/**
 * The navbar every page shares. The burger opens the menu below the touch
 * breakpoint, and choosing a page closes it again.
 */
function SiteNavbar({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Container id="navbar-container">
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item href="https://bulma.io">
            <img
              src="/images/bulma-logo.svg"
              alt="Bulma"
              width={112}
              height={28}
            />
          </Navbar.Item>
          <Navbar.Burger active={open} onClick={() => setOpen(!open)} />
        </Navbar.Brand>

        <Navbar.Menu active={open}>
          <Navbar.Start />
          <Navbar.End>
            {/* An item holding the others, as the original nests them. */}
            <Navbar.Item as="div" gap="0">
              {links.map(link => (
                <Navbar.Item
                  key={link.route}
                  href={routes[link.route]}
                  aria-current={link.route === route ? 'page' : undefined}
                  onClick={close}
                >
                  {link.label}
                </Navbar.Item>
              ))}
              <Buttons>
                <Button
                  as="a"
                  href={routes.contact}
                  color="primary"
                  className="is-orange"
                  onClick={close}
                >
                  <strong>Get a quote</strong>
                </Button>
              </Buttons>
            </Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Navbar>
    </Container>
  );
}

export default SiteNavbar;
