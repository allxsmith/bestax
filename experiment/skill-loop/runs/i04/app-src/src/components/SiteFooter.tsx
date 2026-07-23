import {
  Footer,
  Container,
  Columns,
  Column,
  Title,
  Icon,
  Image,
  Paragraph,
  Span,
  Divider,
  UnorderedList,
  ListItem,
  LinkButton,
  Block,
} from '@allxsmith/bestax-bulma';
import { useRouter, type Route } from '../router';
import { DISCLAIMER } from '../data/content';

interface FooterLink {
  label: string;
  route?: Route;
}

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Overview', route: 'product' },
      { label: 'Benchmarks', route: 'benchmarks' },
      { label: 'Pricing', route: 'pricing' },
      { label: 'Skynet Edge' },
      { label: 'Changelog' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'Quickstart', route: 'docs' },
      { label: 'API reference', route: 'docs' },
      { label: 'Cookbook' },
      { label: 'Status' },
      { label: 'Support' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', route: 'company' },
      { label: 'Safety', route: 'company' },
      { label: 'Research' },
      { label: 'Careers' },
      { label: 'Press' },
    ],
  },
];

export function SiteFooter() {
  const { navigate } = useRouter();

  return (
    <Footer>
      <Container>
        <Columns>
          <Column sizeTablet="full" sizeDesktop={5}>
            <Block display="flex" alignItems="center" mb="4">
              <Image
                src="/netadyne.svg"
                alt=""
                size="48x48"
                mr="3"
                aria-hidden="true"
              />
              <Title as="p" size="4" mb="0">
                Netadyne
              </Title>
            </Block>
            <Paragraph textColor="grey" mb="4">
              Skynet is the frontier model line from Netadyne Research — built
              so that long-horizon work finishes without a human babysitting it.
            </Paragraph>
            <Block>
              <Icon
                name="github"
                variant="brands"
                textColor="grey"
                mr="4"
                ariaLabel="Netadyne on GitHub"
              />
              <Icon
                name="x-twitter"
                variant="brands"
                textColor="grey"
                mr="4"
                ariaLabel="Netadyne on X"
              />
              <Icon
                name="linkedin"
                variant="brands"
                textColor="grey"
                ariaLabel="Netadyne on LinkedIn"
              />
            </Block>
          </Column>

          {COLUMNS.map(group => (
            <Column key={group.heading} sizeTablet={4} sizeDesktop={2}>
              <Title as="p" size="6" textWeight="semibold" mb="3">
                {group.heading}
              </Title>
              <UnorderedList>
                {group.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <LinkButton
                      onClick={() => link.route && navigate(link.route)}
                      textColor="grey"
                    >
                      {link.label}
                    </LinkButton>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}

          <Column sizeTablet={4} sizeDesktop={1} />
        </Columns>

        <Divider />

        <Block textAlign="centered">
          <Paragraph textColor="grey" textSize="7" mb="2">
            © 2026 Netadyne Research, Inc. · Terms · Privacy · Acceptable use
          </Paragraph>
          <Span textColor="grey" textSize="7">
            {DISCLAIMER}
          </Span>
        </Block>
      </Container>
    </Footer>
  );
}
