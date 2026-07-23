import { useState } from 'react';
import {
  Button,
  Buttons,
  Icon,
  IconText,
  Navbar,
  Span,
} from '@allxsmith/bestax-bulma';
import type { Route } from '../routes';
import { ROUTES } from '../routes';

export interface SiteNavProps {
  /** The currently active route, used to highlight its nav item. */
  current: Route;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

export function SiteNav({
  current,
  colorMode,
  onToggleColorMode,
}: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Navbar fixed="top" color="dark">
      <Navbar.Brand>
        <Navbar.Item href="#/" onClick={close}>
          <IconText>
            <Icon name="satellite-dish" textColor="primary" aria-hidden="true" />
            <Span textWeight="bold" textSize="5">
              NETADYNE
            </Span>
          </IconText>
        </Navbar.Item>
        <Navbar.Burger
          active={open}
          onClick={() => setOpen(o => !o)}
          aria-label="menu"
        />
      </Navbar.Brand>

      <Navbar.Menu active={open}>
        <Navbar.Start>
          {ROUTES.filter(r => r.inNav).map(route => (
            <Navbar.Item
              key={route.path}
              href={`#${route.path}`}
              active={route.path === current}
              onClick={close}
            >
              {route.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item as="div">
            <Buttons>
              <Button
                color="dark"
                onClick={onToggleColorMode}
                aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Icon
                  name={colorMode === 'dark' ? 'sun' : 'moon'}
                  aria-hidden="true"
                />
              </Button>
              <Button
                as="a"
                href="#/access"
                color="primary"
                onClick={close}
              >
                Request access
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
