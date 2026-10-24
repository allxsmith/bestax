import { Fragment, type FormEvent } from 'react';
import {
  Button,
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
 * modifiers style Bulma's `.button`, which `Button` renders, so they go on it
 * through `className`. Their links are placeholders to point at the
 * hotel's own pages.
 */
const social = [
  { name: 'Facebook', className: 'is-facebook', icon: 'facebook-f' },
  { name: 'Foursquare', className: 'is-foursquare', icon: 'foursquare' },
  { name: 'Twitter', className: 'is-twitter', icon: 'twitter' },
  { name: 'LinkedIn', className: 'is-linkedin', icon: 'linkedin-in' },
];

/** The sign-up stays on the page; send the address from here. */
function handleSubscribe(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

/** The newsletter, the social links and the address, then the credit. */
function SiteFooter() {
  return (
    <Hero as="footer">
      <Hero.Body>
        <Container>
          <Columns>
            <Column size="4">
              <Content>
                <Title size="6" className="footer_title">
                  NEWSLETTER
                </Title>
                <p>We love to share new offers and exclusive promotions</p>
                <div className="newsletter">
                  <form
                    action="#"
                    method="POST"
                    className="newsletter-form"
                    onSubmit={handleSubscribe}
                  >
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      aria-label="Email address"
                    />
                    <button type="submit" aria-label="Subscribe">
                      <i className="fa fa-paper-plane" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </Content>
            </Column>
            <Column size="4" textAlign="centered">
              <Content>
                <div>
                  <Title size="6" className="footer_title">
                    SOCIAL MEDIA
                  </Title>
                  <p>Follow the Bulma Hotels on social media</p>
                  {social.map(brand => (
                    <Fragment key={brand.name}>
                      <Button
                        as="a"
                        size="medium"
                        className={brand.className}
                        href="#"
                        aria-label={brand.name}
                      >
                        <Icon
                          name={brand.icon}
                          variant="brands"
                          features="fa-lg"
                        />
                      </Button>{' '}
                    </Fragment>
                  ))}
                </div>
              </Content>
            </Column>
            <Column size="4">
              <Content>
                <Title size="6" className="footer_title">
                  ADDRESS
                </Title>
                <Paragraph m="0">Reach the destination safely</Paragraph>
                <Paragraph m="0">
                  Street 21 - Kifisia - 99999 - Athens Greece
                </Paragraph>
                <div>
                  <i className="fa fa-phone-flip" aria-hidden="true" /> &nbsp;{' '}
                  <span>Phone Number</span> &nbsp;{' '}
                  <a href="tel:+302109999999">+210 9999999</a>
                </div>
              </Content>
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
      <Hero.Foot>
        <Container textAlign="centered">
          <p className="footer-text">
            &copy; 2020 - Bulma Hotel. All rights reserved. <br />
            <a
              href="https://github.com/aldi?utm_source=Github"
              style={{ color: 'white' }}
            >
              Designed with{' '}
              <i
                className="fa fa-heart fa-fw"
                style={{ fontSize: '10px', color: 'red' }}
                aria-hidden="true"
              />{' '}
              by aldi
            </a>
          </p>
        </Container>
      </Hero.Foot>
    </Hero>
  );
}

export default SiteFooter;
