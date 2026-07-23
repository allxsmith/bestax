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
  Span,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: 'Models',
      links: [
        { label: 'Skynet Ultra', href: '#/skynet' },
        { label: 'Skynet Pro', href: '#/skynet' },
        { label: 'Skynet Edge', href: '#/skynet' },
        { label: 'Benchmarks', href: '#/benchmarks' },
      ],
    },
    {
      heading: 'Platform',
      links: [
        { label: 'API reference', href: '#/platform' },
        { label: 'SDKs', href: '#/platform' },
        { label: 'Skynet Guard', href: '#/platform' },
        { label: 'Status', href: '#/platform' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Netadyne', href: '#/company' },
        { label: 'Research', href: '#/company' },
        { label: 'Careers', href: '#/company' },
        { label: 'Contact', href: '#/contact' },
      ],
    },
  ];

export function SiteFooter() {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeTablet="half" sizeDesktop={5}>
            <IconText mb="3">
              <Icon name="circle-nodes" textColor="primary" aria-hidden />
              <Span textWeight="bold" textSize="5">
                Netadyne
              </Span>
            </IconText>
            <Span display="block" textColor="grey" mb="4">
              Frontier models that know when they are wrong. Seattle,
              Washington.
            </Span>
            <IconText>
              <Icon name="envelope" textColor="grey" aria-hidden />
              <Link href="#/contact">hello@netadyne.ai</Link>
            </IconText>
          </Column>

          {COLUMNS.map(col => (
            <Column key={col.heading} sizeTablet="one-third" sizeDesktop={2}>
              <Title as="h2" size="6" mb="3">
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
        </Columns>

        <Divider />

        <Columns isVCentered>
          <Column>
            <Span textSize="7" textColor="grey">
              © 2026 Netadyne Research, Inc. All rights reserved.
            </Span>
          </Column>
          <Column isNarrow>
            <Span textSize="7" textColor="grey">
              Netadyne, Skynet, and Skynet Guard are fictional products; every
              figure on this site is illustrative sample data.
            </Span>
          </Column>
        </Columns>
      </Container>
    </Footer>
  );
}
