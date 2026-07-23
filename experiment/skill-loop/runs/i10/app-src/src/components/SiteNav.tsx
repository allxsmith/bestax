import { useState } from 'react';
import { Navbar, Button, Span } from '@allxsmith/bestax-bulma';

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <Navbar fixed="top" color="dark">
      <Navbar.Brand>
        <Navbar.Item href="#top">
          <Span textWeight="bold" textSize="5">
            <Span textColor="primary">◆</Span> Netadyne
          </Span>
        </Navbar.Item>
        <Navbar.Burger
          active={open}
          onClick={() => setOpen(o => !o)}
          aria-label="menu"
          aria-expanded={open}
        />
      </Navbar.Brand>
      <Navbar.Menu active={open}>
        <Navbar.Start>
          <Navbar.Item href="#benchmarks">Benchmarks</Navbar.Item>
          <Navbar.Item href="#features">Capabilities</Navbar.Item>
          <Navbar.Item href="#pricing">Pricing</Navbar.Item>
          <Navbar.Item href="#docs">Docs</Navbar.Item>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item href="#signin">Sign in</Navbar.Item>
          <Navbar.Item as="div">
            <Button color="primary" href="#waitlist">
              Get API access
            </Button>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
