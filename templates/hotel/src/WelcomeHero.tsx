import { Container, Hero, SubTitle, Title } from '@allxsmith/bestax-bulma';
import SiteNavbar from './SiteNavbar.tsx';

/** The full-height welcome over the pool photo, with the navbar on top. */
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
              <Title as="p" size="1" className="main-text">
                Welcome to Bulma Hotel
              </Title>
              <SubTitle as="p" size="4" className="main-text">
                Experience The Luxury
              </SubTitle>
            </div>
          </div>
          <span>
            <svg
              width="30px"
              height="100%"
              viewBox="0 0 247 390"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{
                fillRule: 'evenodd',
                clipRule: 'evenodd',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeMiterlimit: '1.5',
              }}
            >
              <path
                id="wheel"
                d="M123.359,79.775l0,72.843"
                style={{ fill: 'none', stroke: '#fff', strokeWidth: '20px' }}
              />
              <path
                id="mouse"
                d="M236.717,123.359c0,-62.565 -50.794,-113.359 -113.358,-113.359c-62.565,0 -113.359,50.794 -113.359,113.359l0,143.237c0,62.565 50.794,113.359 113.359,113.359c62.564,0 113.358,-50.794 113.358,-113.359l0,-143.237Z"
                style={{ fill: 'none', stroke: '#fff', strokeWidth: '20px' }}
              />
            </svg>
          </span>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default WelcomeHero;
