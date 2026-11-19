import { useState } from 'react';
import { Button, Control, Field, Icon, Navbar } from '@allxsmith/bestax-bulma';

/** The in-page links, in the order the menu shows them. */
const links = [
  { label: 'Rooms', href: '#rooms' },
  { label: 'Gallery', href: '#hotel-gallery' },
  { label: 'About', href: '#about-us' },
  { label: 'Contact Us', href: '#contact-us' },
];

/**
 * The navbar in the welcome hero's head. Below the desktop breakpoint the
 * brand shows call, mail and Facebook icons, and the burger opens the menu,
 * which the original's js/scripts.js toggled. The brand is the hotel's name
 * in text, where the original shows Bulma's logo.
 */
function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <Navbar>
      <Navbar.Brand>
        <Navbar.Item href="https://aldi.github.io/awesome-bulma-templates">
          <span className="wordmark">
            Bulma <span>Hotel</span>
          </span>
        </Navbar.Item>
        <Navbar.Item
          visibilityDesktop="hidden"
          href="tel:+302109999999"
          aria-label="Call us"
        >
          <Icon name="phone" features="fa-lg" style={{ color: '#333' }} />
        </Navbar.Item>
        <Navbar.Item
          visibilityDesktop="hidden"
          href="mailto:reservations@bulmahotels.com"
          aria-label="Email us"
        >
          <Icon name="envelope" features="fa-lg" style={{ color: '#333' }} />
        </Navbar.Item>
        <Navbar.Item
          visibilityDesktop="hidden"
          href="#"
          target="_blank"
          aria-label="Facebook"
        >
          <Icon name="facebook-f" variant="brands" features="fa-lg" />
        </Navbar.Item>
        <Navbar.Burger
          active={open}
          onClick={() => setOpen(!open)}
          aria-controls="navMenuBlogHero"
        />
      </Navbar.Brand>
      <Navbar.Menu id="navMenuBlogHero" active={open}>
        <Navbar.Start>
          <Navbar.Item active href="#">
            Home
          </Navbar.Item>
          {links.map(link => (
            <Navbar.Item key={link.href} href={link.href}>
              {link.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item as="div">
            <Field grouped>
              <Control as="p">
                <Button as="a" size="normal" className="is-facebook" href="#">
                  <Icon name="facebook-f" variant="brands" />
                  <span>Facebook</span>
                </Button>
              </Control>
              <Control as="p">
                <Button
                  as="a"
                  size="normal"
                  color="success"
                  href="tel:+302109999999"
                >
                  <Icon name="phone" />
                  <span>Call Us</span>
                </Button>
              </Control>
            </Field>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}

export default SiteNavbar;
