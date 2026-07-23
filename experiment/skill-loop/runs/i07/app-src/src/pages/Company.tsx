import {
  Avatar,
  Box,
  Button,
  Buttons,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Media,
  Paragraph,
  Section,
  Span,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { MILESTONES } from '../data/site';

const LEADERSHIP = [
  {
    name: 'Ines Battaglia',
    role: 'Co-founder & CEO',
    bio: 'Previously led pretraining infrastructure at two frontier labs. Writes the model cards herself.',
  },
  {
    name: 'Kwame Adjei',
    role: 'Co-founder & Chief Scientist',
    bio: 'Author of the Adyne architecture. Believes recall should not decay with context length, and proved it.',
  },
  {
    name: 'Mira Sørensen',
    role: 'Head of Alignment',
    bio: 'Holds the interpretability veto. Has used it twice, both times against a shipping deadline.',
  },
  {
    name: 'Rafael Duarte',
    role: 'VP Engineering',
    bio: 'Built the serving stack that keeps p50 time-to-first-token under a quarter second at 4M context.',
  },
];

const PRINCIPLES = [
  'Publish the failures alongside the wins, in the same document.',
  'No capability release without an interpretability sign-off that can say no.',
  'Customer data is never training data — not by default, not by opt-out.',
  'If a benchmark result cannot be reproduced from our published harness, we retract it.',
];

const OPEN_ROLES = [
  'Research Scientist, Interpretability',
  'Staff Engineer, Inference',
  'Applied AI Engineer, Enterprise',
  'Evaluation Lead',
  'Security Engineer',
  'Technical Writer',
];

export function Company() {
  return (
    <>
      <Section size="medium" className="hero-wash">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={7}>
              <SectionHeading
                eyebrow="Company"
                title="Netadyne builds intelligence that gets things right."
                subtitle="Founded in 2019 by six researchers who thought the field was optimising the wrong number. Capability is easy to demo; reliability is what people actually deploy."
                as="h1"
                size="1"
              />
            </Column>
            <Column sizeDesktop={5}>
              <Grid isFixed fixedColsMobile={2} gap={4}>
                <Cell display="flex" flexDirection="column">
                  <StatCard value="340" label="People" icon="users" />
                </Cell>
                <Cell display="flex" flexDirection="column">
                  <StatCard
                    value="12"
                    label="Regions"
                    icon="globe"
                    color="link"
                  />
                </Cell>
                <Cell display="flex" flexDirection="column">
                  <StatCard
                    value="41"
                    label="Papers published"
                    icon="file-lines"
                    color="info"
                  />
                </Cell>
                <Cell display="flex" flexDirection="column">
                  <StatCard
                    value="2"
                    label="Launches vetoed"
                    icon="hand"
                    color="warning"
                  />
                </Cell>
              </Grid>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading eyebrow="History" title="How we got here" mb="6" />
          <Columns isMultiline>
            {MILESTONES.map(milestone => (
              <Column
                key={milestone.year}
                sizeTablet="half"
                sizeDesktop={3}
                display="flex"
                flexDirection="column"
              >
                <Box p="5" flexGrow="1">
                  <Tag color="primary" mb="3">
                    {milestone.year}
                  </Tag>
                  <Title as="h3" size="5" mb="2">
                    {milestone.title}
                  </Title>
                  <Paragraph textColor="grey" mb="0">
                    {milestone.body}
                  </Paragraph>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading eyebrow="Leadership" title="Who runs it" mb="6" />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {LEADERSHIP.map(person => (
              <Cell key={person.name} display="flex" flexDirection="column">
                <Box flexGrow="1" p="5">
                  <Media>
                    <Media.Left>
                      <Avatar name={person.name} size="64x64" shape="circle" />
                    </Media.Left>
                    <Media.Content>
                      <Title as="h3" size="5" mb="1">
                        {person.name}
                      </Title>
                      <Paragraph textColor="primary" textSize="7" mb="3">
                        {person.role}
                      </Paragraph>
                      <Paragraph textColor="grey" mb="0">
                        {person.bio}
                      </Paragraph>
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
          <Columns>
            <Column sizeDesktop={6}>
              <SectionHeading
                eyebrow="Principles"
                title="What we hold ourselves to"
                mb="4"
              />
              <Content>
                <ul>
                  {PRINCIPLES.map(principle => (
                    <li key={principle}>{principle}</li>
                  ))}
                </ul>
              </Content>
            </Column>

            <Column sizeDesktop={6}>
              <SectionHeading
                eyebrow="Careers"
                title="We are hiring"
                subtitle="Remote-first across twelve regions, with an in-person research week every quarter."
                mb="4"
              />
              <Tags mb="5">
                {OPEN_ROLES.map(role => (
                  <Tag key={role} size="medium">
                    {role}
                  </Tag>
                ))}
              </Tags>
              <Buttons>
                <Button as="a" href="#/contact" color="primary">
                  See all 24 open roles
                </Button>
              </Buttons>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container textAlign="centered">
          <Title as="h2" size="3" mb="3">
            On the name
          </Title>
          <Columns isCentered>
            <Column sizeDesktop={7}>
              <Paragraph textColor="grey" mb="0">
                Yes, we know. It was a placeholder in a 2021 planning document,
                it stuck, and by the time anyone objected the trademark was
                filed. Our alignment team would like it noted that they{' '}
                <Span textWeight="semibold">did</Span> object, in writing, twice.
              </Paragraph>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
