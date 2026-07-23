import {
  Column,
  Columns,
  Container,
  Divider,
  Footer,
  Icon,
  IconText,
  Link,
  ListItem,
  Paragraph,
  Span,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Overview', href: '#/' },
      { label: 'Benchmarks', href: '#/benchmarks' },
      { label: 'Platform', href: '#/platform' },
      { label: 'Pricing', href: '#/pricing' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'API reference', href: '#/platform' },
      { label: 'Quickstart', href: '#/platform' },
      { label: 'Evaluation harness', href: '#/benchmarks' },
      { label: 'Status', href: '#/platform' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Netadyne', href: '#/' },
      { label: 'Safety policy', href: '#/' },
      { label: 'Careers', href: '#/' },
      { label: 'Contact sales', href: '#/access' },
    ],
  },
];

export function SiteFooter() {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeTablet="half" sizeDesktop={4}>
            <IconText mb="3">
              <Icon
                name="satellite-dish"
                textColor="primary"
                aria-hidden="true"
              />
              <Span textWeight="bold" textSize="5">
                NETADYNE
              </Span>
            </IconText>
            <Paragraph textColor="grey" textSize="6">
              Frontier intelligence, engineered for production. Skynet is
              Netadyne's flagship model family, available in the Netadyne cloud,
              your VPC, or air-gapped on your own rack.
            </Paragraph>
          </Column>

          {COLUMNS.map(col => (
            <Column key={col.heading} sizeTablet="one-third" sizeDesktop={2}>
              <Title as="p" size="6" textWeight="semibold" mb="3">
                {col.heading}
              </Title>
              <UnorderedList>
                {col.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <Link href={link.href} textColor="grey">
                      {link.label}
                    </Link>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}

          <Column sizeTablet="half" sizeDesktop={2}>
            <Title as="p" size="6" textWeight="semibold" mb="3">
              Compliance
            </Title>
            <Paragraph textColor="grey" textSize="7">
              SOC 2 Type II
              <br />
              ISO/IEC 27001
              <br />
              HIPAA-ready
              <br />
              EU data residency
            </Paragraph>
          </Column>
        </Columns>

        <Divider />

        <Paragraph textAlign="centered" textColor="grey" textSize="7">
          &copy; 2026 Netadyne Systems, Inc. All rights reserved.
        </Paragraph>
        <Paragraph textAlign="centered" textColor="grey" textSize="7" mt="2">
          Demo site. Netadyne and Skynet are fictional, and every benchmark
          figure, customer quote, and price on this site is invented for the
          mockup — none of it describes a real product or a real evaluation.
        </Paragraph>
      </Container>
    </Footer>
  );
}
