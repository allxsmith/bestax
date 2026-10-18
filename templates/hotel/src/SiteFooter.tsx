import {
  Button,
  Buttons,
  Column,
  Columns,
  Container,
  Content,
  Hero,
  Icon,
  Paragraph,
  Title,
} from '@allxsmith/bestax-bulma';

/**
 * The brand colors come from bulma-social (imported in main.tsx): its
 * modifiers style Bulma's `.button`, which `Button` renders, so they go on
 * it through `className`. The original's buttons link nowhere; these point
 * at each network's home page until the hotel has pages of its own.
 */
const networks = [
  {
    name: 'Facebook',
    className: 'is-facebook',
    href: 'https://www.facebook.com',
    icon: 'facebook-f',
  },
  {
    name: 'Foursquare',
    className: 'is-foursquare',
    href: 'https://foursquare.com',
    icon: 'foursquare',
  },
  {
    name: 'Twitter',
    className: 'is-twitter',
    href: 'https://twitter.com',
    icon: 'twitter',
  },
  {
    name: 'LinkedIn',
    className: 'is-linkedin',
    href: 'https://www.linkedin.com',
    icon: 'linkedin-in',
  },
];

/** The footer: the newsletter, social media and the address, then the credit. */
function SiteFooter() {
  return (
    <footer className="site-footer">
      <Hero>
        <Hero.Body>
          <Container>
            <Columns>
              <Column size="4">
                <Content>
                  <Title size="6" textColor="white">
                    NEWSLETTER
                  </Title>
                  <p>We love to share new offers and exclusive promotions</p>
                  {/* The original posts to `#`; subscribe from here. */}
                  <form
                    className="newsletter-form"
                    onSubmit={event => event.preventDefault()}
                  >
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      aria-label="Email address"
                      autoComplete="email"
                      required
                    />
                    <button type="submit" aria-label="Subscribe">
                      <Icon name="paper-plane" />
                    </button>
                  </form>
                </Content>
              </Column>
              <Column size="4" textAlign="centered">
                <Content>
                  <Title size="6" textColor="white">
                    SOCIAL MEDIA
                  </Title>
                  <p>Follow the Bulma Hotels on social media</p>
                  <Buttons isCentered>
                    {networks.map(network => (
                      <Button
                        key={network.name}
                        as="a"
                        size="medium"
                        className={network.className}
                        href={network.href}
                        aria-label={`Bulma Hotel on ${network.name}`}
                      >
                        <Icon
                          name={network.icon}
                          variant="brands"
                          features="fa-lg"
                        />
                      </Button>
                    ))}
                  </Buttons>
                </Content>
              </Column>
              <Column size="4">
                <Content>
                  <Title size="6" textColor="white">
                    ADDRESS
                  </Title>
                  <Paragraph m="0">Reach the destination safely</Paragraph>
                  <Paragraph m="0">
                    Street 21 - Kifisia - 99999 - Athens Greece
                  </Paragraph>
                  <div>
                    <Icon name="phone" /> <span>Phone Number</span> &nbsp;{' '}
                    <a href="tel:+302109999999">+210 9999999</a>
                  </div>
                </Content>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
        {/* The original's credit, kept where it was. */}
        <Hero.Foot>
          <Container textAlign="centered">
            <p className="footer-text">
              &copy; 2020 - Bulma Hotel. All rights reserved.
              <br />
              <a href="https://github.com/aldi?utm_source=Github">
                Designed with{' '}
                <i
                  className="fa-solid fa-heart fa-xs fa-fw has-text-danger"
                  aria-hidden="true"
                />{' '}
                by aldi
              </a>
            </p>
          </Container>
        </Hero.Foot>
      </Hero>
    </footer>
  );
}

export default SiteFooter;
