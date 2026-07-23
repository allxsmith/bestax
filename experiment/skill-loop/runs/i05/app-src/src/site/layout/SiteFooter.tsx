import {
  Footer,
  Container,
  Columns,
  Column,
  Title,
  Icon,
  IconText,
  Span,
  Paragraph,
  Divider,
  UnorderedList,
  ListItem,
  Link,
} from '@allxsmith/bestax-bulma';
import { href } from '../routes';

const GROUPS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Models', to: href('/models') },
      { label: 'Benchmarks', to: href('/benchmarks') },
      { label: 'Pricing', to: href('/pricing') },
      { label: 'Safety', to: href('/safety') },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'API reference', to: href('/models') },
      { label: 'SDKs', to: href('/models') },
      { label: 'Status', to: href('/safety') },
      { label: 'Changelog', to: href('/models') },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Netadyne', to: href('/safety') },
      { label: 'Careers', to: href('/contact') },
      { label: 'Press', to: href('/contact') },
      { label: 'Contact', to: href('/contact') },
    ],
  },
];

export function SiteFooter() {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeTablet="half" sizeDesktop="one-third">
            <IconText mb="3">
              <Icon name="network-wired" textColor="primary" aria-hidden="true" />
              <Span textSize="4" textWeight="bold">
                Netadyne
              </Span>
            </IconText>
            <Paragraph textColor="grey" mb="4">
              Frontier intelligence, engineered for production. Skynet is
              available today in 31 regions.
            </Paragraph>
            <IconText textColor="grey">
              <Icon name="location-dot" aria-hidden="true" />
              <Span textSize="7">Palo Alto · Zürich · Singapore</Span>
            </IconText>
          </Column>

          {GROUPS.map(group => (
            <Column key={group.heading} sizeTablet="one-third" sizeDesktop={2}>
              <Title as="p" size="6" mb="3">
                {group.heading}
              </Title>
              <UnorderedList ml="0">
                {group.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <Link href={link.to} textColor="grey">
                      {link.label}
                    </Link>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}
        </Columns>

        <Divider />

        <Paragraph textColor="grey" textSize="7" mb="2">
          © 2026 Netadyne Research, Inc. All rights reserved.
        </Paragraph>
        <Paragraph textColor="grey" textSize="7" mb="0">
          Demo site. Netadyne and Skynet are fictional; every benchmark figure,
          price and customer quote on this site is illustrative and does not
          describe any real product.
        </Paragraph>
      </Container>
    </Footer>
  );
}
