import { useState } from 'react';
import {
  Button,
  Column,
  Columns,
  Container,
  Hero,
  Navbar,
  Paragraph,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** The menu's items, each pointing at its section of the page. */
const menu = [
  { label: 'home', href: '#hero' },
  { label: 'about', href: '#users-feed' },
  { label: 'features', href: '#features' },
  { label: 'contact', href: '#contact' },
];

const offers = [
  'Lorem ipsum dolor sit amet',
  'Augue mauris augue neque gravida in',
  'Faucibus pulvinar elementum integer',
  'Faucibus purus in massa tempor nec',
  'Ante metus dictum at tempor commodo',
];

/** The hero: the navbar, the opening lines and the wedding illustration. */
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Hero id="hero" size="medium">
      <Hero.Head>
        <Navbar>
          <Container>
            <Navbar.Brand>
              <Navbar.Item href="#">
                <img
                  src="https://img.icons8.com/dusk/64/000000/p.png"
                  width={30}
                  height={30}
                  alt="Home"
                />
              </Navbar.Item>
              <Navbar.Item>
                <h3 className="is-size-4">Wedding Planner</h3>
              </Navbar.Item>
              <Navbar.Burger
                active={menuOpen}
                onClick={() => setMenuOpen(open => !open)}
              />
            </Navbar.Brand>
            <Navbar.Menu active={menuOpen}>
              <Navbar.End>
                {menu.map(item => (
                  <Navbar.Item
                    key={item.label}
                    href={item.href}
                    textSize="6"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Navbar.Item>
                ))}
              </Navbar.End>
            </Navbar.Menu>
          </Container>
        </Navbar>
      </Hero.Head>
      <Hero.Body>
        <Container>
          <Columns>
            <Column>
              <Title>Engaging line</Title>
              <Paragraph textAlignMobile="centered">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Gravida rutrum quisque non tellus orci ac auctor. Quis enim
                lobortis scelerisque fermentum.
              </Paragraph>
              <hr className="rounded" />
              <SubTitle as="p" size="3" className="offers-title">
                What we offer
              </SubTitle>
              {offers.map(offer => (
                <Paragraph key={offer} textAlignMobile="centered">
                  <i
                    className="fa-solid fa-check offer-check"
                    aria-hidden="true"
                  />{' '}
                  {offer}
                </Paragraph>
              ))}
              {/* The original scrolled to the steps from every button on the
                  page, with jQuery; this is the one that is meant to. */}
              <Button
                type="button"
                textSize="6"
                isRounded
                className="learn-more"
                onClick={() =>
                  document.getElementById('features')?.scrollIntoView()
                }
              >
                Learn more
              </Button>
            </Column>
            <Column>
              <img src="/img/undraw_wedding_t1yl.svg" alt="" />
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Header;
