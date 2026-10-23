import {
  Button,
  Container,
  Hero,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** The call to action for landlords, over the cartoon city. */
function Landlords() {
  return (
    <Hero size="medium" color="light">
      <Hero.Body className="p-b-30">
        <Container textAlign="centered">
          <SubTitle as="h2">For landlords &amp; property managers</SubTitle>
          <Title>Want to Decrease Time on Market?</Title>
          <p className="m-t-30">
            <Button
              as="a"
              href="https://github.com/aldi/awesome-bulma-templates"
              size="medium"
              color="primary"
              className="is-shadowy"
            >
              Learn more
            </Button>
          </p>
          <div className="m-t-60">
            <img
              className="m-t-50"
              src="/media/cartoon_city.png"
              alt="Find rentals"
            />
          </div>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Landlords;
