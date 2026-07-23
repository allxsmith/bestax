import { useState } from 'react';
import {
  Navbar,
  Button,
  Buttons,
  Icon,
  Image,
  Title,
  Tag,
} from '@allxsmith/bestax-bulma';
import { useRouter, type Route } from '../router';

const NAV_LINKS: { route: Route; label: string }[] = [
  { route: 'product', label: 'Product' },
  { route: 'benchmarks', label: 'Benchmarks' },
  { route: 'pricing', label: 'Pricing' },
  { route: 'docs', label: 'Docs' },
  { route: 'company', label: 'Company' },
];

export interface SiteNavbarProps {
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

export function SiteNavbar({ colorMode, onToggleColorMode }: SiteNavbarProps) {
  const { route, navigate } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (target: Route) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    navigate(target);
  };

  return (
    <Navbar fixed="top" aria-label="main navigation">
      <Navbar.Brand>
        <Navbar.Item as="a" href="#home" onClick={go('home')}>
          <Image
            src="/netadyne.svg"
            alt=""
            size="32x32"
            mr="3"
            aria-hidden="true"
          />
          <Title as="p" size="5" mb="0">
            Netadyne
          </Title>
          <Tag color="link" isRounded size="normal" ml="3">
            Skynet-1
          </Tag>
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
              key={link.route}
              as="a"
              href={`#${link.route}`}
              active={route === link.route}
              onClick={go(link.route)}
            >
              {link.label}
            </Navbar.Item>
          ))}
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item>
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
              <Button color="text" as="a" href="#docs" onClick={go('docs')}>
                Sign in
              </Button>
              <Button color="primary" onClick={() => navigate('waitlist')}>
                <Icon name="key" mr="2" aria-hidden="true" />
                Get API key
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
