import {
  Footer,
  Container,
  Columns,
  Column,
  Title,
  Span,
  UnorderedList,
  ListItem,
  Link,
} from '@allxsmith/bestax-bulma';

const GROUPS = [
  { heading: 'Product', links: ['SkyNet', 'SkyNet Mini', 'Benchmarks', 'Pricing', 'Changelog'] },
  { heading: 'Developers', links: ['Documentation', 'API reference', 'SDKs', 'Status', 'Cookbook'] },
  { heading: 'Company', links: ['About Netadyne', 'Research', 'Careers', 'Blog', 'Contact'] },
  { heading: 'Legal', links: ['Privacy', 'Terms', 'Acceptable use', 'Security', 'Trust center'] },
];

export default function SiteFooter() {
  return (
    <Footer id="docs">
      <Container>
        <Columns>
          <Column size={4}>
            <Title size="5" mb="2">
              <Span textColor="primary">◆</Span> Netadyne
            </Title>
            <Span textColor="grey">
              Frontier AI, responsibly deployed. SkyNet is Netadyne&rsquo;s
              flagship large language model.
            </Span>
          </Column>

          {GROUPS.map(group => (
            <Column key={group.heading}>
              <Title size="6" mb="3">
                {group.heading}
              </Title>
              <UnorderedList>
                {group.links.map(link => (
                  <ListItem key={link} mb="2">
                    <Link href="#" textColor="grey">
                      {link}
                    </Link>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}
        </Columns>

        <Span
          textSize="7"
          textColor="grey"
          display="block"
          textAlign="centered"
          mt="6"
        >
          © 2026 Netadyne, Inc. All rights reserved. Benchmark figures compare
          SkyNet v1.0 to the latest public Fable release.
        </Span>
      </Container>
    </Footer>
  );
}
