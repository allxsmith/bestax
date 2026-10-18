import {
  Button,
  Container,
  Figure,
  Hero,
  Paragraph,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** The call to landlords, over the city skyline. */
function LandlordsCta() {
  return (
    <Hero size="medium" color="light">
      <Hero.Body pb="5">
        <Container textAlign="centered">
          <SubTitle as="h2">For landlords &amp; property managers</SubTitle>
          <Title>Want to Decrease Time on Market?</Title>
          <Paragraph mt="5">
            {/* `is-shadowy` is the original's lifted button, from index.css. */}
            <Button
              as="a"
              href="https://github.com/aldi/awesome-bulma-templates"
              size="medium"
              color="primary"
              className="is-shadowy"
            >
              Learn more
            </Button>
          </Paragraph>
          <Figure mt="6" pt="6">
            <img src="/media/cartoon_city.png" alt="Find rentals" />
          </Figure>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default LandlordsCta;
