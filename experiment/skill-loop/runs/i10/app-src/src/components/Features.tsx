import {
  Section,
  Container,
  Title,
  SubTitle,
  Grid,
  Cell,
  Card,
  Span,
} from '@allxsmith/bestax-bulma';
import { FEATURES } from '../data';

export default function Features() {
  return (
    <Section id="features" className="section-alt">
      <Container>
        <Title size="2" textAlign="centered">
          Built for the work that matters
        </Title>
        <SubTitle size="5" textColor="grey" textAlign="centered" mb="6">
          One model that reasons, sees, and acts — at production scale
        </SubTitle>

        <Grid gap="5" minCol={12}>
          {FEATURES.map(f => (
            <Cell key={f.title}>
              <Card>
                <Card.Content>
                  <Span textColor="primary" textSize="4">
                    ◆
                  </Span>
                  <Title size="5" mt="3" mb="2">
                    {f.title}
                  </Title>
                  <Span textColor="grey">{f.body}</Span>
                </Card.Content>
              </Card>
            </Cell>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
