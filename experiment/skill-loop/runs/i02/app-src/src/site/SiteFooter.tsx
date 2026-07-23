import {
  Block,
  Footer,
  Container,
  Columns,
  Column,
  Title,
  Divider,
  Icon,
  Image,
  Link,
  Paragraph,
  Span,
  Strong,
  UnorderedList,
  ListItem,
} from '@allxsmith/bestax-bulma';
import type { PageId } from './content';

const LINK_GROUPS: { heading: string; links: { label: string; to?: PageId }[] }[] =
  [
    {
      heading: 'Product',
      links: [
        { label: 'Skynet Opus', to: 'home' },
        { label: 'Skynet Core', to: 'home' },
        { label: 'Skynet Edge', to: 'home' },
        { label: 'Benchmarks', to: 'benchmarks' },
        { label: 'Pricing', to: 'pricing' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Quickstart', to: 'docs' },
        { label: 'API reference', to: 'docs' },
        { label: 'SDKs', to: 'docs' },
        { label: 'Status' },
        { label: 'Changelog' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Netadyne' },
        { label: 'Research' },
        { label: 'Safety' },
        { label: 'Careers' },
        { label: 'Contact', to: 'contact' },
      ],
    },
  ];

interface SiteFooterProps {
  onNavigate: (page: PageId) => void;
}

export default function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeTablet="full" sizeDesktop={4}>
            <Block display="flex" alignItems="center" mb="3">
              <Image
                src="/netadyne.svg"
                alt=""
                size="32x32"
                mr="3"
                aria-hidden="true"
              />
              <Title size="5" mb="0">
                Netadyne
              </Title>
            </Block>
            <Paragraph textColor="grey" mb="4">
              Frontier intelligence, engineered for the error rate that actually
              matters. Skynet is available today in eleven regions.
            </Paragraph>
            <Span textSize="4" mr="3">
              <Link href="#" aria-label="Netadyne on GitHub">
                <Icon name="github" variant="brands" aria-hidden="true" />
              </Link>
            </Span>
            <Span textSize="4" mr="3">
              <Link href="#" aria-label="Netadyne on X">
                <Icon name="x-twitter" variant="brands" aria-hidden="true" />
              </Link>
            </Span>
            <Span textSize="4">
              <Link href="#" aria-label="Netadyne on LinkedIn">
                <Icon name="linkedin" variant="brands" aria-hidden="true" />
              </Link>
            </Span>
          </Column>

          {LINK_GROUPS.map(group => (
            <Column key={group.heading} sizeTablet={4} sizeDesktop={2}>
              <Title size="6" mb="3">
                {group.heading}
              </Title>
              <UnorderedList className="link-list">
                {group.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <Link
                      href="#"
                      textColor="grey"
                      onClick={event => {
                        event.preventDefault();
                        if (link.to) onNavigate(link.to);
                      }}
                    >
                      {link.label}
                    </Link>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}

          <Column sizeTablet="full" sizeDesktop={2}>
            <Title size="6" mb="3">
              Compliance
            </Title>
            <Paragraph textColor="grey" textSize="7">
              SOC 2 Type II · ISO 27001 · ISO 42001 · HIPAA eligible · GDPR
            </Paragraph>
          </Column>
        </Columns>

        <Divider />

        <Paragraph textSize="7" textColor="grey" mb="2">
          <Strong textColor="grey">Demo content.</Strong> Netadyne and Skynet are
          fictional, invented for this bestax-bulma template. Every benchmark
          score, price, and quotation on this site is made up — including the
          comparisons to Fable, which is a real model that has not been evaluated
          against anything here. Do not cite any of it.
        </Paragraph>

        <Paragraph textSize="7" textColor="grey">
          © 2026 Netadyne Intelligence, Inc. Built with{' '}
          <Link href="https://bestax.io" target="_blank" rel="noreferrer">
            bestax-bulma
          </Link>
          .
        </Paragraph>
      </Container>
    </Footer>
  );
}
