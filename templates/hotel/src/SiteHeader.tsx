import { Container, Hero, SubTitle, Title } from '@allxsmith/bestax-bulma';
import SiteNavbar from './SiteNavbar.tsx';

/** The full-height welcome over the pool photo, with the navbar on top. */
function SiteHeader() {
  return (
    <Hero size="fullheight" className="main-hero">
      <Hero.Head>
        <SiteNavbar />
      </Hero.Head>
      <Hero.Body>
        <Container textAlign="centered">
          <Title as="p" size="1" className="main-text">
            Welcome to Bulma Hotel
          </Title>
          <SubTitle as="p" size="4" mb="0" pb="6" className="main-text">
            Experience The Luxury
          </SubTitle>
          {/* A mouse whose wheel scrolls, hinting at the page below. */}
          <svg
            width="30px"
            height="100%"
            viewBox="0 0 247 390"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={1.5}
            aria-hidden="true"
          >
            <path
              className="scroll-wheel"
              d="M123.359,79.775l0,72.843"
              fill="none"
              stroke="#fff"
              strokeWidth={20}
            />
            <path
              d="M236.717,123.359c0,-62.565 -50.794,-113.359 -113.358,-113.359c-62.565,0 -113.359,50.794 -113.359,113.359l0,143.237c0,62.565 50.794,113.359 113.359,113.359c62.564,0 113.358,-50.794 113.358,-113.359l0,-143.237Z"
              fill="none"
              stroke="#fff"
              strokeWidth={20}
            />
          </svg>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default SiteHeader;
