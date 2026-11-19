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

const services = [1, 2, 3];

/** "Our Services": three cards, on the home page and the services page. */
function ServicesSection() {
  return (
    <Section>
      <Container>
        <div className="has-text-centered" id="services-text-container">
          <Title size="1">Our Services</Title>
          <SubTitle as="h4">
            There are many variations of passages of Lorem Ipsum available, but
            the majority have
          </SubTitle>
        </div>
        <br />
        <Columns>
          {services.map(service => (
            <Column key={service}>
              <Card>
                <Card.Content>
                  <div className="has-text-centered">
                    <img
                      src="/images/card-item-1.svg"
                      alt=""
                      width={75}
                      height={74}
                    />
                  </div>
                  <Title
                    size="3"
                    textAlign="centered"
                    className="card-product-description"
                  >
                    Orange
                  </Title>
                  <Paragraph textAlign="centered">
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which don't
                    look even slightly believable.
                  </Paragraph>
                </Card.Content>
              </Card>
            </Column>
          ))}
        </Columns>
        <Buttons isCentered>
          <Button color="black" size="medium">
            Read More
          </Button>
        </Buttons>
      </Container>
    </Section>
  );
}

export default ServicesSection;
