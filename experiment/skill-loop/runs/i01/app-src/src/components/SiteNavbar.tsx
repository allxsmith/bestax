import { useState } from 'react';
import {
  Button,
  Buttons,
  Icon,
  IconText,
  Navbar,
} from '@allxsmith/bestax-bulma';
import { NAV, type PageId } from '../data/site';

interface SiteNavbarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

export function SiteNavbar({
  page,
  onNavigate,
  colorMode,
  onToggleColorMode,
}: SiteNavbarProps) {
  const [open, setOpen] = useState(false);

  const go = (target: PageId) => (event: React.MouseEvent) => {
    event.preventDefault();
    setOpen(false);
    onNavigate(target);
  };

  return (
    <Navbar fixed="top" aria-label="main navigation">
      <Navbar.Brand>
        <Navbar.Item href="#home" onClick={go('home')}>
          <IconText
            iconProps={{ name: 'circle-nodes', 'aria-hidden': 'true' }}
            textColor="primary"
          >
            <span className="is-size-5 has-text-weight-bold">NETADYNE</span>
          </IconText>
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
          {NAV.map(item => (
            <Navbar.Item
              key={item.id}
              href={`#${item.id}`}
              active={page === item.id}
              onClick={go(item.id)}
            >
              {item.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item as="div">
            <Buttons>
              <Button
                color="ghost"
                onClick={onToggleColorMode}
                aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
              >
                <Icon
                  name={colorMode === 'dark' ? 'sun' : 'moon'}
                  aria-hidden="true"
                />
              </Button>
              <Button color="ghost" onClick={go('contact')}>
                Sign in
              </Button>
              <Button color="primary" onClick={go('contact')}>
                <IconText
                  iconProps={{ name: 'arrow-right', 'aria-hidden': 'true' }}
                >
                  Get API access
                </IconText>
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
