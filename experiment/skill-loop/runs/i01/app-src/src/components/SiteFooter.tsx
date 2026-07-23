import {
  Column,
  Columns,
  Container,
  Content,
  Divider,
  Footer,
  Icon,
  IconText,
  Title,
  UnorderedList,
  ListItem,
} from '@allxsmith/bestax-bulma';
import type { PageId } from '../data/site';

interface FooterGroup {
  heading: string;
  links: { label: string; page?: PageId }[];
}

const GROUPS: FooterGroup[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Skynet Nova', page: 'models' },
      { label: 'Skynet Flash', page: 'models' },
      { label: 'Skynet Edge', page: 'models' },
      { label: 'Benchmarks', page: 'benchmarks' },
      { label: 'Pricing', page: 'pricing' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'Quickstart', page: 'docs' },
      { label: 'API reference', page: 'docs' },
      { label: 'SDKs', page: 'docs' },
      { label: 'Eval harness', page: 'benchmarks' },
      { label: 'Status', page: 'docs' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Netadyne' },
      { label: 'Research' },
      { label: 'Safety' },
      { label: 'Careers' },
      { label: 'Contact sales', page: 'contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of service' },
      { label: 'Privacy policy' },
      { label: 'Acceptable use' },
      { label: 'Trust centre' },
      { label: 'Sub-processors' },
    ],
  },
];

const SOCIALS = [
  { icon: 'github', label: 'GitHub' },
  { icon: 'x-twitter', label: 'X' },
  { icon: 'linkedin', label: 'LinkedIn' },
];

interface SiteFooterProps {
  onNavigate: (page: PageId) => void;
}

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <Footer>
      <Container>
        <Columns isMultiline>
          <Column sizeTablet={12} sizeDesktop={4}>
            <IconText
              iconProps={{ name: 'circle-nodes', 'aria-hidden': 'true' }}
              textColor="primary"
              mb="3"
            >
              <span className="is-size-5 has-text-weight-bold">NETADYNE</span>
            </IconText>
            <Content textColor="grey">
              <p>
                Frontier intelligence, engineered for production. Skynet is
                built, aligned and served end to end by Netadyne.
              </p>
            </Content>
            <IconText
              iconProps={{ name: 'location-dot', 'aria-hidden': 'true' }}
              textColor="grey"
            >
              San Francisco · London · Singapore
            </IconText>
          </Column>

          {GROUPS.map(group => (
            <Column key={group.heading} sizeTablet={3} sizeDesktop={2}>
              <Title size="6" as="h3" textTransform="uppercase" mb="3">
                {group.heading}
              </Title>
              {/* Outside a `.content` block Bulma's reset strips list styling,
                  so these render as a plain stack of links. */}
              <UnorderedList textSize="6">
                {group.links.map(link => (
                  <ListItem key={link.label} mb="2">
                    <a
                      href={link.page ? `#${link.page}` : '#'}
                      onClick={event => {
                        event.preventDefault();
                        if (link.page) onNavigate(link.page);
                      }}
                    >
                      {link.label}
                    </a>
                  </ListItem>
                ))}
              </UnorderedList>
            </Column>
          ))}
        </Columns>

        <Divider />

        <Columns isVCentered>
          <Column>
            <Content size="small" textColor="grey">
              <p>
                © 2026 Netadyne Intelligence, Inc. All rights reserved. Skynet
                is a trademark of Netadyne Intelligence, Inc.
              </p>
              <p>
                <strong>Demo site.</strong> Netadyne and Skynet are fictional,
                and every benchmark score, price and quote on this site is
                invented sample content — including the comparisons to Fable.
              </p>
            </Content>
          </Column>
          <Column isNarrow display="flex">
            {SOCIALS.map(social => (
              <a key={social.label} href="#" aria-label={social.label} className="ml-3">
                <Icon
                  name={social.icon}
                  variant="brands"
                  size="medium"
                  textColor="grey"
                  ariaLabel={social.label}
                />
              </a>
            ))}
          </Column>
        </Columns>
      </Container>
    </Footer>
  );
}
