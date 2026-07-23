import { useState } from 'react';
import {
  Navbar,
  Button,
  Buttons,
  Icon,
  Image,
  Span,
  Tag,
} from '@allxsmith/bestax-bulma';
import { NAV, type PageId } from './content';

interface SiteNavbarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  colorMode: 'light' | 'dark';
  onToggleColorMode: () => void;
}

export default function SiteNavbar({
  page,
  onNavigate,
  colorMode,
  onToggleColorMode,
}: SiteNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // No router in this app — anchors keep the items keyboard-accessible while
  // navigation stays in React state.
  const go = (next: PageId) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    onNavigate(next);
  };

  return (
    <Navbar fixed="top">
      <Navbar.Brand>
        <Navbar.Item href="#home" onClick={go('home')}>
          <Image
            src="/netadyne.svg"
            alt=""
            size="32x32"
            mr="2"
            aria-hidden="true"
          />
          <Span textWeight="bold" textSize="5">
            Netadyne
          </Span>
        </Navbar.Item>
        <Navbar.Burger
          active={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
          aria-label="Toggle navigation"
        />
      </Navbar.Brand>

      <Navbar.Menu active={menuOpen}>
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
          <Navbar.Item href="#benchmarks" onClick={go('benchmarks')}>
            <Span mr="2">Skynet</Span>
            <Tag color="primary" isRounded>
              New
            </Tag>
          </Navbar.Item>
        </Navbar.Start>

        <Navbar.End>
          <Navbar.Item as="div">
            <Buttons>
              <Button
                color="ghost"
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
              <Button
                color="primary"
                isOutlined
                onClick={() => onNavigate('docs')}
              >
                Docs
              </Button>
              <Button color="primary" onClick={() => onNavigate('contact')}>
                Request access
              </Button>
            </Buttons>
          </Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
