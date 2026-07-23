import {
  Hero,
  Container,
  Title,
  SubTitle,
  Button,
  Buttons,
  Tag,
  Level,
  Span,
} from '@allxsmith/bestax-bulma';
import { HEADLINE_STATS } from '../data';

export default function HeroSection() {
  return (
    <Hero size="large" className="hero-wash" id="top">
      <Hero.Body>
        <Container textAlign="centered">
          <Tag color="primary" size="medium" mb="5">
            Introducing SkyNet — Netadyne&rsquo;s frontier model
          </Tag>
          <Title size="1" isSpaced>
            Meet <Span textColor="primary">SkyNet</Span>.
            <br />
            10× better than Fable.
          </Title>
          <SubTitle size="4" textColor="grey" mt="4">
            Netadyne&rsquo;s new flagship LLM beats Fable on every public
            benchmark — with a tenth of the errors, a tenth of the cost, and a
            million-token memory.
          </SubTitle>

          <Buttons isCentered mt="6">
            <Button color="primary" size="large" href="#waitlist">
              Get API access
            </Button>
            <Button color="primary" isInverted size="large" href="#benchmarks">
              See the benchmarks
            </Button>
          </Buttons>

          <Level isMobile mt="6">
            {HEADLINE_STATS.map(stat => (
              <Level.Item key={stat.label} hasTextCentered>
                <div>
                  <Title size="2" textColor="primary" mb="1">
                    {stat.value}
                  </Title>
                  <Span textSize="6" textColor="grey">
                    {stat.label}
                  </Span>
                </div>
              </Level.Item>
            ))}
          </Level>
        </Container>
      </Hero.Body>
    </Hero>
  );
}
