import {
  Button,
  Buttons,
  Column,
  Columns,
  Container,
  Content,
  Field,
  Icon,
  InputBase,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';

const blurbs = ['Fruits', 'Services', 'List'];

/**
 * The brand colors come from bulma-social (imported in main.tsx): its
 * `is-facebook` and other modifiers style Bulma's `.button`, which `Button`
 * renders, so they go on it through `className`. The original's own
 * `.is-black-social` turns each icon black.
 */
const networks = [
  {
    name: 'Facebook',
    className: 'is-facebook',
    icon: 'facebook',
    href: 'https://facebook.com',
  },
  {
    name: 'Instagram',
    className: 'is-instagram',
    icon: 'instagram',
    href: 'https://instagram.com',
  },
  {
    name: 'Twitter',
    className: 'is-twitter',
    icon: 'twitter',
    href: 'https://twitter.com',
  },
  {
    name: 'YouTube',
    className: 'is-youtube',
    icon: 'youtube',
    href: 'https://youtube.com',
  },
];

/** The footer every page shares. */
function SiteFooter() {
  return (
    <Section>
      <Container>
        <div className="footer-main">
          <Columns>
            {blurbs.map(blurb => (
              <Column key={blurb}>
                <Title size="4">{blurb}</Title>
                <p>
                  randomised words which don't look even slightly believable. If
                  you are going to use a passage of Lorem Ipsum,
                </p>
              </Column>
            ))}

            <Column>
              <Title size="4">Follow Us</Title>
              <Buttons>
                {networks.map(network => (
                  <Button
                    key={network.name}
                    as="a"
                    size="medium"
                    isInverted
                    className={`${network.className} is-black-social`}
                    href={network.href}
                    aria-label={network.name}
                  >
                    <Icon
                      name={network.icon}
                      variant="brands"
                      features="fa-lg"
                    />
                  </Button>
                ))}
              </Buttons>
              <Title size="4">Subscribe Now</Title>
              <Field>
                <InputBase type="text" placeholder="Email" aria-label="Email" />
              </Field>
              <Buttons>
                <Button size="medium" className="is-orange">
                  Subscribe
                </Button>
              </Buttons>
            </Column>
          </Columns>
        </div>
      </Container>

      <footer className="footer-secondary">
        <Content textAlign="centered">
          <p>
            Copyright © 2021 Tropico Template ♥ by{' '}
            <a href="https://github.com/restylianos">restylianos</a>
          </p>
        </Content>
      </footer>
    </Section>
  );
}

export default SiteFooter;
