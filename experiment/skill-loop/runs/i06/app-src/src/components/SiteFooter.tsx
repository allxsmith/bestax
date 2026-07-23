import {
  Column,
  Columns,
  Container,
  Divider,
  Footer,
  Icon,
  Image,
  Level,
  Link,
  ListItem,
  Paragraph,
  Span,
  Strong,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';
import type { Navigate, PageId } from '../routes';

const COLUMNS: { heading: string; links: { label: string; page: PageId }[] }[] =
  [
    {
      heading: 'Product',
      links: [
        { label: 'Overview', page: 'home' },
        { label: 'Models', page: 'models' },
        { label: 'Benchmarks', page: 'benchmarks' },
        { label: 'Pricing', page: 'pricing' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Quickstart', page: 'docs' },
        { label: 'Tool use', page: 'docs' },
        { label: 'Eval harness', page: 'benchmarks' },
        { label: 'Status', page: 'docs' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Safety', page: 'safety' },
        { label: 'Model card', page: 'safety' },
        { label: 'Contact', page: 'contact' },
        { label: 'Careers', page: 'contact' },
      ],
    },
  ];

export interface SiteFooterProps {
  onNavigate: Navigate;
}

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeDesktop={5}>
            <Level isMobile justifyContent="flex-start" mb="3">
              <Level.Left>
                <Level.Item>
                  <Image src="/netadyne.svg" alt="" size="32x32" mr="2" />
                </Level.Item>
                <Level.Item>
                  <Title size="5" mb="0">
                    Netadyne
                  </Title>
                </Level.Item>
              </Level.Left>
            </Level>
            <Paragraph mb="4">
              <Span textColor="grey">
                Frontier models that make an order of magnitude fewer mistakes.
                Seattle · Zürich · Singapore.
              </Span>
            </Paragraph>
            <Level isMobile justifyContent="flex-start">
              <Level.Left>
                <Level.Item>
                  <Icon name="github" ariaLabel="Netadyne on GitHub" />
                </Level.Item>
                <Level.Item>
                  <Icon name="twitter" ariaLabel="Netadyne on X" />
                </Level.Item>
                <Level.Item>
                  <Icon name="linkedin" ariaLabel="Netadyne on LinkedIn" />
                </Level.Item>
              </Level.Left>
            </Level>
          </Column>

          {COLUMNS.map(column => (
            <Column key={column.heading}>
              <Title size="6" mb="3">
                {column.heading}
              </Title>
              <UnorderedList>
                {column.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <Link
                      href={`#${link.page}`}
                      onClick={e => {
                        e.preventDefault();
                        onNavigate(link.page);
                      }}
                    >
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
            <Paragraph mb="0">
              <Span textSize="7" textColor="grey">
                © 2026 Netadyne Research. A fictional company, built to
                demonstrate <Strong>@allxsmith/bestax-bulma</Strong>. All
                benchmark figures, including comparisons to Fable, are invented
                for this demo.
              </Span>
            </Paragraph>
          </Column>
          <Column isNarrow>
            <Paragraph mb="0">
              <Span textSize="7" textColor="grey">
                Privacy · Terms · Trust centre
              </Span>
            </Paragraph>
          </Column>
        </Columns>
      </Container>
    </Footer>
  );
}
