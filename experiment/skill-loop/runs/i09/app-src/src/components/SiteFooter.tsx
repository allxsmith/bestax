import {
  Footer,
  Container,
  Columns,
  Column,
  Title,
  UnorderedList,
  ListItem,
  Link,
  Image,
  Strong,
  Span,
  Paragraph,
  Divider,
  Icon,
} from '@allxsmith/bestax-bulma';

const LINK_GROUPS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: 'Product',
      links: [
        { label: 'Models', href: '#/models' },
        { label: 'Benchmarks', href: '#/benchmarks' },
        { label: 'Pricing', href: '#/pricing' },
        { label: 'Changelog', href: '#/models' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'API reference', href: '#/models' },
        { label: 'Python SDK', href: '#/models' },
        { label: 'TypeScript SDK', href: '#/models' },
        { label: 'Eval harness', href: '#/benchmarks' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Contact sales', href: '#/contact' },
        { label: 'Research', href: '#/benchmarks' },
        { label: 'Careers', href: '#/contact' },
        { label: 'Trust & safety', href: '#/contact' },
      ],
    },
  ];

export function SiteFooter() {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeDesktop={5}>
            {/* No `gap` helper on flex layouts — the logo carries mr="2". */}
            <Span display="flex" alignItems="center" mb="3">
              <Image src="/netadyne.svg" alt="" size="32x32" mr="2" />
              <Strong textSize="5">Netadyne</Strong>
            </Span>
            <Paragraph textColor="grey">
              Netadyne builds frontier models that finish the job. Skynet is our
              third-generation family, trained on the Helix-4 cluster in Ames,
              Iowa.
            </Paragraph>
            <Span display="flex" alignItems="center" mt="4">
              <Link href="#/contact" mr="4" aria-label="Netadyne on GitHub">
                <Icon name="github" variant="brands" aria-hidden="true" />
              </Link>
              <Link href="#/contact" mr="4" aria-label="Netadyne on X">
                <Icon name="x-twitter" variant="brands" aria-hidden="true" />
              </Link>
              <Link href="#/contact" aria-label="Netadyne on LinkedIn">
                <Icon name="linkedin" variant="brands" aria-hidden="true" />
              </Link>
            </Span>
          </Column>

          {LINK_GROUPS.map(group => (
            <Column key={group.heading}>
              <Title as="p" size="6" mb="3">
                {group.heading}
              </Title>
              {/* Bulma's reset already unstyles <ul> — no prop or CSS needed. */}
              <UnorderedList>
                {group.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <Link href={link.href} textColor="grey">
                      {link.label}
                    </Link>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}
        </Columns>

        <Divider />

        <Paragraph textSize="7" textColor="grey">
          © 2026 Netadyne Intelligence, Inc. All rights reserved. Netadyne and
          Skynet are trademarks of Netadyne Intelligence, Inc.
        </Paragraph>
        <Paragraph textSize="7" textColor="grey" mt="2">
          <Strong textColor="grey">Demo site.</Strong> Netadyne and Skynet are
          fictional, and every benchmark figure, price, quote, and customer on
          this site is invented to demonstrate a bestax-bulma layout. Fable is a
          real model from another company; none of the comparisons here reflect
          any actual measurement of it.
        </Paragraph>
      </Container>
    </Footer>
  );
}
