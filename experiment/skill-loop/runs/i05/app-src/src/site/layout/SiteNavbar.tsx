import { useState } from 'react';
import { Navbar, Button, Buttons, Icon, Span } from '@allxsmith/bestax-bulma';
import { ROUTES, href, type RoutePath } from '../routes';

export interface SiteNavbarProps {
  current: RoutePath;
  isDark: boolean;
  onToggleScheme: () => void;
}

export function SiteNavbar({
  current,
  isDark,
  onToggleScheme,
}: SiteNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <Navbar fixed="top" aria-label="main navigation">
      <Navbar.Brand>
        <Navbar.Item href={href('/')} onClick={close}>
          <Icon
            name="network-wired"
            textColor="primary"
            mr="2"
            aria-hidden="true"
          />
          <Span textSize="4" textWeight="bold">
            Netadyne
          </Span>
        </Navbar.Item>
        <Navbar.Burger
          active={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="menu"
          aria-expanded={menuOpen}
        />
      </Navbar.Brand>

      <Navbar.Menu active={menuOpen}>
        <Navbar.Start>
          {ROUTES.filter(r => r.path !== '/').map(route => (
            <Navbar.Item
              key={route.path}
              href={href(route.path)}
              active={current === route.path}
              onClick={close}
            >
              {route.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item>
            <Buttons>
              <Button
                color="text"
                onClick={onToggleScheme}
                aria-label={
                  isDark ? 'Switch to light mode' : 'Switch to dark mode'
                }
              >
                <Icon name={isDark ? 'sun' : 'moon'} aria-hidden="true" />
              </Button>
              <Button
                as="a"
                href={href('/pricing')}
                color="primary"
                isOutlined
                onClick={close}
              >
                Sign in
              </Button>
              <Button
                as="a"
                href={href('/contact')}
                color="primary"
                onClick={close}
              >
                Get API key
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
