import { Container, Hero, SubTitle, Title } from '@allxsmith/bestax-bulma';
import SiteNavbar from './SiteNavbar.tsx';

/** The full-height welcome over the hotel and its pool, with the navbar on top. */
function WelcomeHero() {
  return (
    <Hero as="header" size="fullheight" className="main_hero">
      <Hero.Head>
        <Container>
          <SiteNavbar />
        </Container>
      </Hero.Head>
      <Hero.Body>
        <Container textAlign="centered">
          <div className="pb-6">
            <div>
              <Title size="1" className="main-text">
                Welcome to Bulma Hotel
              </Title>
              <SubTitle as="p" size="4" className="main-text">
                Experience The Luxury
              </SubTitle>
            </div>
          </div>
          {/* A mouse with its wheel rolling down, the hint to scroll. Drawn
              for this port; README.md's Images section says so. */}
          <span>
            <svg
              width="30px"
              height="100%"
              viewBox="0 0 246 390"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="none"
              stroke="#fff"
              strokeWidth="20"
              strokeLinecap="round"
            >
              <line id="wheel" x1="123" y1="80" x2="123" y2="152" />
              <rect x="10" y="10" width="226" height="370" rx="113" />
            </svg>
          </span>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default WelcomeHero;
