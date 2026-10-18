import {
  Button,
  Buttons,
  Card,
  Column,
  Columns,
  Container,
  Paragraph,
  Section,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** The original's three cards, which say the same thing. */
const services = ['first', 'second', 'third'];

/** "Our Services": on the home page and the Services page. */
function OurServices() {
  return (
    <Section>
      <Container>
        <div className="has-text-centered mb-5">
          <Title size="1">Our Services</Title>
          <SubTitle as="h4">
            There are many variations of passages of Lorem Ipsum available, but
            the majority have
          </SubTitle>
        </div>
        <Columns>
          {services.map(service => (
            <Column key={service}>
              <Card>
                <Card.Content>
                  <div className="has-text-centered">
                    <img
                      src="/images/card-item.webp"
                      alt=""
                      width="75"
                      height="74"
                    />
                  </div>
                  <Title size="3" textAlign="centered" className="service-name">
                    Orange
                  </Title>
                  <Paragraph textAlign="centered">
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which
                    don&apos;t look even slightly believable.
                  </Paragraph>
                </Card.Content>
              </Card>
            </Column>
          ))}
        </Columns>
        <Buttons isCentered>
          <Button type="button" color="black" size="medium">
            Read More
          </Button>
        </Buttons>
      </Container>
    </Section>
  );
}

export default OurServices;
