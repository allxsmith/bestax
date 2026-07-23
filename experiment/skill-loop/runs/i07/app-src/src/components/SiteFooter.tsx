import {
  Column,
  Columns,
  Container,
  Divider,
  Footer,
  Icon,
  Image,
  Link,
  ListItem,
  Paragraph,
  Span,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';

const FOOTER_NAV: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: 'Product',
      links: [
        { label: 'Skynet Core', href: '#/' },
        { label: 'Benchmarks', href: '#/benchmarks' },
        { label: 'Platform', href: '#/platform' },
        { label: 'Pricing', href: '#/pricing' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'API reference', href: '#/platform' },
        { label: 'SDKs', href: '#/platform' },
        { label: 'Status', href: '#/platform' },
        { label: 'Changelog', href: '#/platform' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#/company' },
        { label: 'Research', href: '#/company' },
        { label: 'Careers', href: '#/company' },
        { label: 'Contact sales', href: '#/contact' },
      ],
    },
  ];

const SOCIAL: { name: string; icon: string; label: string }[] = [
  { name: 'x-twitter', icon: 'x-twitter', label: 'Netadyne on X' },
  { name: 'github', icon: 'github', label: 'Netadyne on GitHub' },
  { name: 'linkedin', icon: 'linkedin', label: 'Netadyne on LinkedIn' },
];

export function SiteFooter() {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeTablet="half" sizeDesktop={5}>
            <Image src="/netadyne.svg" alt="" size="48x48" mb="3" />
            <Title as="p" size="5" mb="2">
              Netadyne
            </Title>
            <Paragraph textColor="grey" mb="4">
              Frontier intelligence, built so the error rate falls faster than
              the capability curve rises.
            </Paragraph>
            <UnorderedList display="flex">
              {SOCIAL.map(social => (
                <ListItem key={social.name} mr="4">
                  <Link href="#/company">
                    <Icon
                      name={social.icon}
                      variant="brands"
                      ariaLabel={social.label}
                    />
                  </Link>
                </ListItem>
              ))}
            </UnorderedList>
          </Column>

          {FOOTER_NAV.map(group => (
            <Column key={group.heading} sizeTablet="one-third" sizeDesktop={2}>
              <Title as="h2" size="6" mb="3">
                {group.heading}
              </Title>
              {/* A bare UnorderedList is already marker-less and flush —
                  Bulma's reset unstyles <ul> outside of Content. */}
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

        <Divider my="5" />

        <Paragraph textSize="7" textColor="grey" mb="2">
          © 2026 Netadyne, Inc. · Privacy · Terms · Trust Center
        </Paragraph>
        <Paragraph textSize="7" textColor="grey">
          <Span textWeight="semibold">Fiction notice:</Span> Netadyne and Skynet
          are invented for this demo site. Every benchmark figure, customer, and
          quote here is made up, and no evaluation was run against Fable or any
          other real model. Built with{' '}
          <Link
            href="https://bestax.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            bestax-bulma
          </Link>
          .
        </Paragraph>
      </Container>
    </Footer>
  );
}
