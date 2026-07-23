import { useState } from 'react';
import {
  Navbar,
  Image,
  Strong,
  Button,
  Buttons,
  Icon,
} from '@allxsmith/bestax-bulma';
import { NAV_PAGES, type PageId } from '../data/site';

export interface SiteNavbarProps {
  page: PageId;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

export function SiteNavbar({
  page,
  colorMode,
  onToggleColorMode,
}: SiteNavbarProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Navbar fixed="top" color="dark">
      <Navbar.Brand>
        <Navbar.Item href="#/" onClick={close}>
          <Image src="/netadyne.svg" alt="" size="32x32" mr="2" />
          <Strong textColor="light" textSize="5">
            Netadyne
          </Strong>
        </Navbar.Item>
        <Navbar.Burger
          active={open}
          onClick={() => setOpen(o => !o)}
          aria-label="menu"
        />
      </Navbar.Brand>

      <Navbar.Menu active={open}>
        <Navbar.Start>
          {NAV_PAGES.map(item => (
            <Navbar.Item
              key={item.id}
              href={`#/${item.id}`}
              active={page === item.id}
              onClick={close}
            >
              {item.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item as="div">
            <Buttons>
              <Button
                color="dark"
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
              {/* `href` alone keeps Button a <button> — `as="a"` is what makes
                  it a real link. */}
              <Button color="primary" as="a" href="#/contact" onClick={close}>
                Get API access
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
