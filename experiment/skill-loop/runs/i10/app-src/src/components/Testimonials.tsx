import {
  Section,
  Container,
  Title,
  Columns,
  Column,
  Box,
  Content,
  Span,
} from '@allxsmith/bestax-bulma';
import { TESTIMONIALS } from '../data';

export default function Testimonials() {
  return (
    <Section className="section-alt">
      <Container>
        <Title size="2" textAlign="centered" mb="6">
          Teams are already switching from Fable
        </Title>

        <Columns>
          {TESTIMONIALS.map(t => (
            <Column key={t.name} display="flex" flexDirection="column">
              <Box flexGrow="1">
                <Content>
                  <Span textSize="4" textColor="primary">
                    &ldquo;
                  </Span>
                  <Span textSize="5">{t.quote}</Span>
                </Content>
                <Span textWeight="bold">{t.name}</Span>
                <br />
                <Span textSize="7" textColor="grey">
                  {t.role}
                </Span>
              </Box>
            </Column>
          ))}
        </Columns>
      </Container>
    </Section>
  );
}
