import { useState } from 'react';
import { Button, Buttons, Container, Navbar } from '@allxsmith/bestax-bulma';
import { paths, type Page } from './router.ts';

/** The pages, in the order the original's navbar lists them. */
const links: { page: Page; label: string }[] = [
  { page: 'home', label: 'Home' },
  { page: 'fruits', label: 'Fruits' },
  { page: 'services', label: 'Services' },
  { page: 'contact', label: 'Contact us' },
];

/**
 * The navbar every page opens with. `open` drives both `Navbar.Burger` and
 * `Navbar.Menu`, and following a link in the open menu closes it. The links
 * sit inside one item, as the original's do, and the current page's carries
 * `aria-current`, which changes nothing on screen, as in the original.
 */
function SiteNavbar({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);

  return (
    <Container>
      <Navbar role="navigation" aria-label="main navigation">
        <Navbar.Brand>
          <Navbar.Item href="https://bulma.io">
            <img
              src="https://bulma.io/assets/brand/Bulma%20Logo.svg"
              alt="Bulma"
              width="112"
              height="28"
            />
          </Navbar.Item>
          <Navbar.Burger active={open} onClick={() => setOpen(!open)} />
        </Navbar.Brand>
        <Navbar.Menu active={open} onClick={() => setOpen(false)}>
          <Navbar.End>
            {/* Bulma 1 spaces an item's children; Bulma 0.9 didn't. */}
            <Navbar.Item as="div" gap="0">
              {links.map(link => (
                <Navbar.Item
                  key={link.page}
                  href={paths[link.page]}
                  aria-current={link.page === page ? 'page' : undefined}
                >
                  {link.label}
                </Navbar.Item>
              ))}
              <Buttons>
                {/* is-orange is the template's own, in index.css. */}
                <Button
                  as="a"
                  color="primary"
                  className="is-orange"
                  href={paths.contact}
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
