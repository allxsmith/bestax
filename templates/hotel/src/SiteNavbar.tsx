import { useState } from 'react';
import {
  Button,
  Container,
  Control,
  Field,
  Icon,
  Navbar,
} from '@allxsmith/bestax-bulma';

/** The in-page links, in the order the original lists them. */
const links = [
  { label: 'Rooms', href: '#rooms' },
  { label: 'Gallery', href: '#hotel-gallery' },
  { label: 'About', href: '#about-us' },
  { label: 'Contact Us', href: '#contact-us' },
];

/**
 * The navbar in the hero's head. The original toggled the burger with a
 * script; here `open` drives both `Navbar.Burger` and `Navbar.Menu`, and
 * following a link in the open menu closes it.
 */
function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <Container>
      <Navbar role="navigation" aria-label="main navigation">
        <Navbar.Brand>
          <Navbar.Item href="https://aldi.github.io/awesome-bulma-templates">
            <img
              src="https://bulma.io/assets/images/bulma-logo.png"
              alt="Bulma Hotel"
              width="112"
              height="28"
            />
          </Navbar.Item>
          {/* Shown below desktop, where the buttons on the right fold into
              the menu. */}
          <Navbar.Item
            visibilityDesktop="hidden"
            href="tel:+302109849583"
            aria-label="Call us"
          >
            <Icon name="phone-flip" features="fa-lg" textColor="grey-darker" />
          </Navbar.Item>
          <Navbar.Item
            visibilityDesktop="hidden"
            href="mailto:reservations@bulmahotels.com"
            aria-label="Email us"
          >
            <Icon name="envelope" features="fa-lg" textColor="grey-darker" />
          </Navbar.Item>
          <Navbar.Item
            visibilityDesktop="hidden"
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <Icon name="facebook-f" variant="brands" features="fa-lg" />
          </Navbar.Item>
          <Navbar.Burger active={open} onClick={() => setOpen(!open)} />
        </Navbar.Brand>
        <Navbar.Menu active={open} onClick={() => setOpen(false)}>
          <Navbar.Start>
            <Navbar.Item href="#" active>
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
                  {/* is-facebook is bulma-social's, imported in main.tsx. */}
                  <Button
                    as="a"
                    size="normal"
                    className="is-facebook"
                    href="https://www.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                    <Icon name="phone-flip" />
                    <span>Call Us</span>
                  </Button>
                </Control>
              </Field>
            </Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Navbar>
    </Container>
  );
}

export default SiteNavbar;
