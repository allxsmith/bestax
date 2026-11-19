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
          {/* A blocky mouse with its wheel rolling down, the hint to scroll,
              in pixels 20 units square. Drawn for this port; README.md's
              Images section says so. */}
          <span>
            <svg
              width="30px"
              height="100%"
              viewBox="0 0 240 400"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="#fff"
              shapeRendering="crispEdges"
            >
              <path d="M80 0h80v20h-80zM40 20h40v20h-40zM160 20h40v20h-40zM20 40h20v40h-20zM200 40h20v40h-20zM0 80h20v240h-20zM220 80h20v240h-20zM20 320h20v40h-20zM200 320h20v40h-20zM40 360h40v20h-40zM160 360h40v20h-40zM80 380h80v20h-80z" />
              <rect id="wheel" x="100" y="80" width="40" height="60" />
            </svg>
          </span>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default WelcomeHero;
