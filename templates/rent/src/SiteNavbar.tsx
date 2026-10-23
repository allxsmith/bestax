import { useState } from 'react';
import { Button, Container, Navbar, Tag } from '@allxsmith/bestax-bulma';

/** The top bar: the logo, the burger and the menu it opens on a phone. */
function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <Navbar transparent isSpaced role="navigation" aria-label="main navigation">
      <Container>
        <Navbar.Brand>
          <Navbar.Item href="/">
            <img
              src="/media/bulma-logo.svg"
              alt="Bulma Rent"
              width={80}
              height={20}
            />
          </Navbar.Item>
          <Navbar.Burger
            active={open}
            onClick={() => setOpen(!open)}
            aria-controls="navbarTopMain"
          />
        </Navbar.Brand>
        <Navbar.Menu id="navbarTopMain" active={open}>
          <Navbar.End>
            <Navbar.Item href="#" textWeight="semibold" gap="0">
              <span>Blog</span>
              <Tag color="success" className="m-l-5">
                NEW
              </Tag>
            </Navbar.Item>
            <Navbar.Item href="#" textWeight="semibold">
              Apartments
            </Navbar.Item>
            <Navbar.Item href="#" textWeight="semibold">
              Houses
            </Navbar.Item>
            <Navbar.Item href="#" textWeight="semibold">
              Post a listing
            </Navbar.Item>
            <Navbar.Item as="div">
              {/* The original linked a login page its author has since
                  moved; this is where it lives now. */}
              <Button
                as="a"
                href="https://aldi.github.io/bulma-login-template/"
                color="primary"
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
