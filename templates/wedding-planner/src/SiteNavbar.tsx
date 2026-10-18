import { useState } from 'react';
import { Container, Navbar } from '@allxsmith/bestax-bulma';

/** The menu's links, each to its section of the page. */
const links = [
  { label: 'home', href: '#' },
  { label: 'about', href: '#users-feed' },
  { label: 'features', href: '#features' },
  { label: 'contact', href: '#contact' },
];

/**
 * The navbar in the hero's head. The original toggled the burger with a
 * script; here `open` drives both `Navbar.Burger` and `Navbar.Menu`, and
 * following a link in the open menu closes it.
 */
function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <Navbar role="navigation" aria-label="main navigation">
      <Container>
        <Navbar.Brand>
          <Navbar.Item href="#">
            <img
              src="https://img.icons8.com/dusk/64/000000/p.png"
              alt="Wedding Planner"
              width="30"
              height="30"
            />
          </Navbar.Item>
          <Navbar.Item as="div">
            <h3 className="is-size-4">Wedding Planner</h3>
          </Navbar.Item>
          <Navbar.Burger active={open} onClick={() => setOpen(!open)} />
        </Navbar.Brand>
        <Navbar.Menu active={open} onClick={() => setOpen(false)}>
          <Navbar.End>
            {links.map(link => (
              <Navbar.Item key={link.label} href={link.href} textSize="6">
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.End>
        </Navbar.Menu>
      </Container>
    </Navbar>
  );
}

export default SiteNavbar;
