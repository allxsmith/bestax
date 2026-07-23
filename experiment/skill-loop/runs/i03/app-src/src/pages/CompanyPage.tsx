import {
  Box,
  Button,
  Buttons,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Icon,
  Level,
  Section,
  Span,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { FeatureCard } from '../components/FeatureCard';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { TIMELINE, VALUES } from '../site/content';

const OPENINGS = [
  { role: 'Research Scientist, Verification', team: 'Research', place: 'Seattle' },
  { role: 'Member of Technical Staff, Inference', team: 'Engineering', place: 'Seattle / Remote' },
  { role: 'Evaluation Engineer', team: 'Research', place: 'Remote (US)' },
  { role: 'Solutions Architect, Financial Services', team: 'Go-to-market', place: 'New York' },
  { role: 'Security Engineer, Skynet Guard', team: 'Engineering', place: 'Seattle' },
  { role: 'Technical Writer', team: 'Product', place: 'Remote (US / EU)' },
];

export function CompanyPage() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow="Company"
              title="Netadyne"
              lede="We build models that know when they are wrong — and hand the operator the key to stop them."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={4}>
            <Cell display="flex" flexDirection="column">
              <StatCard label="Founded" value="2019" icon="flag" flexGrow="1" />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard label="People" value="612" icon="users" flexGrow="1" />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                label="Offices"
                value="4"
                icon="building"
                flexGrow="1"
              />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                label="Papers published"
                value="87"
                icon="file-lines"
                flexGrow="1"
              />
            </Cell>
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={6}>
              <Title as="h2" size="3" mb="4">
                The thesis
              </Title>
              <Content>
                <p>
                  In 2019 the field's answer to every failure was more
                  parameters. We thought the bottleneck was elsewhere: a model
                  that cannot tell a solid answer from a plausible one will
                  compound its own mistakes no matter how large it gets.
                </p>
                <p>
                  So Netadyne spent four years on verification — training models
                  to produce a calibrated judgement about their own output, and
                  to spend compute where that judgement is weakest. Skynet is
                  what that looks like at frontier scale: not a model that is
                  right more often by a few points, but one that is wrong an
                  order of magnitude less.
                </p>
                <p>
                  We publish the harness because a benchmark you cannot
                  reproduce is advertising, and because the only version of this
                  industry worth working in is one where the claims are
                  checkable.
                </p>
              </Content>
            </Column>
            <Column sizeDesktop={6}>
              <Title as="h2" size="3" mb="4">
                How we got here
              </Title>
              {TIMELINE.map(entry => (
                <Box key={entry.year} p="5" mb="4">
                  <Level isMobile mb="2">
                    <Level.Left>
                      <Level.Item>
                        <Title as="h3" size="5" mb="0">
                          {entry.title}
                        </Title>
                      </Level.Item>
                    </Level.Left>
                    <Level.Right>
                      <Level.Item>
                        <Tag color="primary" isRounded>
                          {entry.year}
                        </Tag>
                      </Level.Item>
                    </Level.Right>
                  </Level>
                  <Span display="block" textColor="grey">
                    {entry.body}
                  </Span>
                </Box>
              ))}
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Values"
            title="Three things we will not trade"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {VALUES.map(value => (
              <Cell key={value.title} display="flex" flexDirection="column">
                <FeatureCard
                  title={value.title}
                  body={value.body}
                  icon={value.icon}
                />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Careers"
            title="Open roles"
            lede="Seattle, New York, London, and Tokyo — plus remote across the US and EU."
            mb="6"
          />
          <Columns isMultiline>
            {OPENINGS.map(opening => (
              <Column
                key={opening.role}
                sizeTablet="half"
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1" p="5">
                  <Title as="h3" size="5" mb="3">
                    {opening.role}
                  </Title>
                  <Level isMobile>
                    <Level.Left>
                      <Level.Item>
                        <Span textSize="7" textColor="grey">
                          <Icon
                            name="location-dot"
                            textColor="grey"
                            mr="2"
                            aria-hidden="true"
                          />
                          {opening.place}
                        </Span>
                      </Level.Item>
                    </Level.Left>
                    <Level.Right>
                      <Level.Item>
                        <Tag>{opening.team}</Tag>
                      </Level.Item>
                    </Level.Right>
                  </Level>
                </Box>
              </Column>
            ))}
          </Columns>
          <Buttons isCentered mt="6">
            <Button as="a" href="#/contact" color="primary">
              Get in touch
            </Button>
          </Buttons>
        </Container>
      </Section>
    </>
  );
}
