import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Grid,
  Cell,
  Card,
  Box,
  Title,
  SubTitle,
  Content,
  Button,
  Buttons,
  Icon,
  IconText,
  Media,
  Avatar,
  Avatars,
  Tag,
  Block,
  Span,
  Paragraph,
  Divider,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { DISCLAIMER, MILESTONES, VALUES } from '../data/content';
import { useRouter } from '../router';

const LEADERSHIP = [
  {
    name: 'Dr. Wen Okonjo',
    role: 'Co-founder & CEO',
    initials: 'WO',
    bio: 'Previously led long-horizon agents research at a frontier lab. Wrote the original plan-graph paper.',
  },
  {
    name: 'Dr. Tomas Lindqvist',
    role: 'Co-founder & Chief Scientist',
    initials: 'TL',
    bio: 'Built the decode-layer policy compiler that makes Skynet guardrails deterministic rather than prompted.',
  },
  {
    name: 'Amara Boateng',
    role: 'Head of Safety',
    initials: 'AB',
    bio: 'Runs the release gate. Has blocked three ship dates and would happily block a fourth.',
  },
  {
    name: 'Rafael Ibarra',
    role: 'VP Engineering',
    initials: 'RI',
    bio: 'Owns the serving stack that gets 1,840 tokens a second out of a frontier model.',
  },
];

const NUMBERS = [
  { icon: 'users', value: '312', label: 'People', detail: 'Across 11 countries' },
  {
    icon: 'flask',
    value: '47',
    label: 'Papers published',
    detail: 'Including the ones that failed',
  },
  {
    icon: 'building-columns',
    value: '$2.4B',
    label: 'Raised to date',
    detail: 'Series D, closed March 2026',
  },
  {
    icon: 'earth-americas',
    value: '9',
    label: 'Datacenter regions',
    detail: 'Three of them sovereign',
  },
];

export function CompanyPage() {
  const { navigate } = useRouter();

  return (
    <>
      <Hero color="primary" size="medium" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Netadyne Research</Title>
            <SubTitle size="4" mt="4">
              Eleven researchers started this in 2021 with one thesis: the
              bottleneck was never scale, it was planning. Skynet is that thesis,
              shipped.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={4}
            gap={5}
          >
            {NUMBERS.map(number => (
              <Cell key={number.label} display="flex" flexDirection="column">
                <StatCard
                  icon={number.icon}
                  value={number.value}
                  label={number.label}
                  detail={number.detail}
                  flexGrow="1"
                />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Safety"
            title="A model this capable needs a shorter leash, not a longer one"
            lead="Autonomy is the product, so the controls around it are the other half of the product."
          />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={2}
            gap={5}
          >
            {VALUES.map(value => (
              <Cell key={value.title} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <IconText mb="3">
                      <Icon
                        name={value.icon}
                        size="medium"
                        textColor="link"
                        aria-hidden="true"
                      />
                    </IconText>
                    <Title size="5" mb="3">
                      {value.title}
                    </Title>
                    <Content textColor="grey">{value.body}</Content>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
          <Block textAlign="centered" mt="6">
            <Button color="link" isOutlined onClick={() => navigate('docs')}>
              <Icon name="file-shield" mr="2" aria-hidden="true" />
              Read the Skynet-1 model card
            </Button>
          </Block>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns isCentered>
            <Column sizeDesktop={9}>
              <SectionHeading
                eyebrow="History"
                title="Five years, four turning points"
              />
              {MILESTONES.map(milestone => (
                <Box key={milestone.year} mb="4">
                  <Columns isVCentered>
                    <Column isNarrow>
                      <Tag color="link" size="large" isRounded>
                        {milestone.year}
                      </Tag>
                    </Column>
                    <Column>
                      <Title size="5" mb="2">
                        {milestone.title}
                      </Title>
                      <Span textColor="grey">{milestone.body}</Span>
                    </Column>
                  </Columns>
                </Box>
              ))}
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading eyebrow="Leadership" title="Who runs the place" />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={2}
            gap={5}
          >
            {LEADERSHIP.map(person => (
              <Cell key={person.name} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Media>
                    <Media.Left>
                      <Avatar
                        name={person.name}
                        initials={person.initials}
                        size="64x64"
                      />
                    </Media.Left>
                    <Media.Content>
                      <Title size="5" mb="1">
                        {person.name}
                      </Title>
                      <Span textColor="link" textSize="7" textWeight="semibold">
                        {person.role}
                      </Span>
                      <Content textColor="grey" mt="3">
                        {person.bio}
                      </Content>
                    </Media.Content>
                  </Media>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Box p="6">
            <Columns isVCentered>
              <Column sizeDesktop={8}>
                <Title size="3" mb="3">
                  We are hiring across research, serving, and safety
                </Title>
                <Paragraph textColor="grey" mb="4">
                  41 open roles in San Francisco, London, Nairobi, and remote.
                  We read every application, and we tell you either way.
                </Paragraph>
                <Avatars mb="4">
                  {LEADERSHIP.map(person => (
                    <Avatar
                      key={person.name}
                      name={person.name}
                      initials={person.initials}
                      size="48x48"
                    />
                  ))}
                </Avatars>
              </Column>
              <Column sizeDesktop={4}>
                <Buttons>
                  <Button color="primary" isFullWidth>
                    See open roles
                  </Button>
                  <Button
                    color="link"
                    isOutlined
                    isFullWidth
                    onClick={() => navigate('waitlist')}
                  >
                    Talk to us instead
                  </Button>
                </Buttons>
              </Column>
            </Columns>
          </Box>

          <Divider />

          <Paragraph textAlign="centered" textSize="7" textColor="grey">
            {DISCLAIMER}
          </Paragraph>
        </Container>
      </Section>
    </>
  );
}
