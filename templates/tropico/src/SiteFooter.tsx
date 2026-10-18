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
  Paragraph,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';

const blurb =
  "randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum,";

/**
 * The networks, each a white button with a black icon that turns orange on
 * hover (`is-black-social`, in index.css). The `is-<brand>` classes are
 * bulma-social's, imported in main.tsx, and go on `Button` through
 * `className`.
 */
const networks = [
  { name: 'Facebook', brand: 'facebook', href: 'https://www.facebook.com' },
  { name: 'Instagram', brand: 'instagram', href: 'https://www.instagram.com' },
  { name: 'Twitter', brand: 'twitter', href: 'https://twitter.com' },
  { name: 'YouTube', brand: 'youtube', href: 'https://www.youtube.com' },
];

/** The footer every page closes with. */
function SiteFooter() {
  return (
    <Section>
      <Container>
        <div className="footer-main">
          <Columns>
            {['Fruits', 'Services', 'List'].map(heading => (
              <Column key={heading}>
                <Title size="4">{heading}</Title>
                <Paragraph>{blurb}</Paragraph>
              </Column>
            ))}
            <Column>
              <Title size="4">Follow Us</Title>
              <Buttons>
                {networks.map(network => (
                  <Button
                    key={network.brand}
                    as="a"
                    size="medium"
                    isInverted
                    className={`is-${network.brand} is-black-social`}
                    href={network.href}
                    aria-label={network.name}
                  >
                    <Icon
                      name={network.brand}
                      variant="brands"
                      features="fa-lg"
                    />
                  </Button>
                ))}
              </Buttons>
              <Title size="4">Subscribe Now</Title>
              <Field>
                <InputBase
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                />
              </Field>
              <Buttons>
                <Button type="button" size="medium" className="is-orange">
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
