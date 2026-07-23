import { useState, type MouseEvent } from 'react';
import {
  Button,
  Buttons,
  Icon,
  Image,
  Navbar,
  Span,
  Strong,
} from '@allxsmith/bestax-bulma';
import { ROUTES, type Navigate, type PageId } from '../routes';

export interface SiteNavProps {
  current: PageId;
  onNavigate: Navigate;
  isDark: boolean;
  onToggleScheme: () => void;
}

export function SiteNav({
  current,
  onNavigate,
  isDark,
  onToggleScheme,
}: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (page: PageId) => {
    setMenuOpen(false);
    onNavigate(page);
  };

  return (
    <Navbar fixed="top" aria-label="Main navigation">
      <Navbar.Brand>
        <Navbar.Item
          as="a"
          href="#home"
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            go('home');
          }}
        >
          <Image src="/netadyne.svg" alt="" size="32x32" mr="2" />
          <Strong>Netadyne</Strong>
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
          {ROUTES.filter(route => route.inNav).map(route => (
            <Navbar.Item
              key={route.id}
              as="a"
              href={`#${route.id}`}
              active={current === route.id}
              onClick={(e: MouseEvent) => {
                e.preventDefault();
                go(route.id);
              }}
            >
              {route.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item>
            <Buttons>
              <Button
                onClick={onToggleScheme}
                aria-label={
                  isDark ? 'Switch to light theme' : 'Switch to dark theme'
                }
              >
                <Icon
                  name={isDark ? 'white-balance-sunny' : 'weather-night'}
                  aria-hidden="true"
                />
              </Button>
              <Button onClick={() => go('docs')}>Docs</Button>
              <Button color="primary" onClick={() => go('contact')}>
                <Span>Get API access</Span>
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
