import { useState } from 'react';
import {
  Button,
  Buttons,
  Icon,
  Navbar,
  Span,
} from '@allxsmith/bestax-bulma';
import { NAV_LINKS, type Route } from '../site/content';

export interface SiteNavProps {
  route: Route;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

export function SiteNav({ route, colorMode, onToggleColorMode }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Navbar fixed="top" aria-label="main navigation">
      <Navbar.Brand>
        <Navbar.Item href="#/home" onClick={close}>
          <Icon name="circle-nodes" textColor="primary" mr="2" aria-hidden />
          <Span textWeight="bold" textSize="5">
            Netadyne
          </Span>
        </Navbar.Item>
        <Navbar.Burger
          active={open}
          onClick={() => setOpen(o => !o)}
          aria-label="menu"
        />
      </Navbar.Brand>

      <Navbar.Menu active={open}>
        <Navbar.Start>
          {NAV_LINKS.map(link => (
            <Navbar.Item
              key={link.route}
              href={`#/${link.route}`}
              active={route === link.route}
              onClick={close}
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
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
              >
                <Icon
                  name={colorMode === 'dark' ? 'sun' : 'moon'}
                  aria-hidden="true"
                />
              </Button>
              <Button as="a" href="#/platform" onClick={close}>
                Docs
              </Button>
              <Button
                as="a"
                color="primary"
                href="#/contact"
                onClick={close}
              >
                Get API access
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
