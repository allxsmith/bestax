import { useState } from 'react';
import {
  Button,
  Buttons,
  Icon,
  Image,
  Navbar,
  Span,
} from '@allxsmith/bestax-bulma';
import type { Route } from '../useHashRoute';

const NAV_LINKS: { href: string; label: string; route: Route }[] = [
  { href: '#/', label: 'Skynet', route: '/' },
  { href: '#/benchmarks', label: 'Benchmarks', route: '/benchmarks' },
  { href: '#/platform', label: 'Platform', route: '/platform' },
  { href: '#/pricing', label: 'Pricing', route: '/pricing' },
  { href: '#/company', label: 'Company', route: '/company' },
];

export interface SiteNavbarProps {
  route: Route;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

/** Site chrome: fixed top navbar. `has-navbar-fixed-top` lives in index.html. */
export function SiteNavbar({
  route,
  colorMode,
  onToggleColorMode,
}: SiteNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Navbar fixed="top" aria-label="main navigation">
      <Navbar.Brand>
        <Navbar.Item href="#/" onClick={() => setMenuOpen(false)}>
          <Image src="/netadyne.svg" alt="" size="32x32" mr="2" />
          <Span textWeight="bold" textSize="5">
            Netadyne
          </Span>
        </Navbar.Item>
        <Navbar.Burger
          active={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
          aria-label="menu"
          aria-expanded={menuOpen}
        />
      </Navbar.Brand>

      <Navbar.Menu active={menuOpen}>
        <Navbar.Start>
          {NAV_LINKS.map(link => (
            <Navbar.Item
              key={link.href}
              href={link.href}
              active={route === link.route}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item as="div">
            <Buttons>
              <Button
                color="text"
                onClick={onToggleColorMode}
                aria-label={
                  colorMode === 'dark'
                    ? 'Switch to light theme'
                    : 'Switch to dark theme'
                }
              >
                <Icon
                  name={colorMode === 'dark' ? 'sun' : 'moon'}
                  aria-hidden="true"
                />
              </Button>
              <Button as="a" href="#/contact" color="light">
                Talk to sales
              </Button>
              <Button as="a" href="#/pricing" color="primary">
                Get an API key
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
