'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@allxsmith/bestax-bulma';

// Every page shares this navbar, from the root layout. It keeps the menu's
// open state, so it's a client component. Each item renders Next's Link
// through `as`, and `active` and `aria-current` follow the path, as the
// routing guide shows: https://bestax.io/docs/guides/features/routing
const PAGES = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Navbar>
      <Navbar.Brand>
        <Navbar.Item as={NextLink} href="/" onClick={closeMenu}>
          <NextImage
            src="/bestax.svg"
            alt="Bestax home"
            width={28}
            height={28}
          />
        </Navbar.Item>
        <Navbar.Burger
          active={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        />
      </Navbar.Brand>
      <Navbar.Menu active={menuOpen}>
        <Navbar.Start>
          {PAGES.map(({ href, label }) => (
            <Navbar.Item
              key={href}
              as={NextLink}
              href={href}
              active={pathname === href}
              aria-current={pathname === href ? 'page' : undefined}
              onClick={closeMenu}
            >
              {label}
            </Navbar.Item>
          ))}
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  );
}
