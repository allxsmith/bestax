import { useState } from 'react';
import { Button, Container, Navbar, Tag } from '@allxsmith/bestax-bulma';

/**
 * Where "Sign in" goes: the bestax port of aldi's Login template, opened in
 * StackBlitz. The original pointed at a page that no longer exists.
 */
const SIGN_IN_URL =
  'https://stackblitz.com/github/allxsmith/bestax-templates/tree/main/login?file=src/App.tsx';

const links = ['Apartments', 'Houses', 'Post a listing'];

/**
 * The top bar. The burger and the menu are controlled: one piece of state
 * opens both, in place of the original's script.
 */
function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    // Navbar has no prop for Bulma's `is-spaced`, so it goes in className.
    <Navbar transparent className="is-spaced">
      <Container>
        <Navbar.Brand>
          <Navbar.Item href="/">
            <img
              src="https://bulma.io/assets/images/bulma-logo.png"
              alt="Bulma Rent"
              width={80}
              height={20}
            />
          </Navbar.Item>
          {/* Bulma v1 draws the burger in the link blue; the original's is grey. */}
          <Navbar.Burger
            textColor="grey-dark"
            active={open}
            onClick={() => setOpen(isOpen => !isOpen)}
            aria-controls="navbarTopMain"
          />
        </Navbar.Brand>
        <Navbar.Menu id="navbarTopMain" active={open}>
          <Navbar.End>
            <Navbar.Item href="#" textWeight="semibold">
              <span>Blog</span> <Tag color="success">NEW</Tag>
            </Navbar.Item>
            {links.map(link => (
              <Navbar.Item key={link} href="#" textWeight="semibold">
                {link}
              </Navbar.Item>
            ))}
            <Navbar.Item as="div">
              <Button
                as="a"
                color="primary"
                href={SIGN_IN_URL}
                target="_blank"
                rel="noreferrer"
              >
                Sign in
              </Button>
            </Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Container>
    </Navbar>
  );
}

export default SiteNavbar;
