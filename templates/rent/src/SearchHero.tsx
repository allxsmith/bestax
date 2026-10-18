import {
  Button,
  Column,
  Columns,
  Container,
  Control,
  Field,
  Figure,
  Hero,
  Input,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import SiteNavbar from './SiteNavbar.tsx';

/** The first screen: the top bar, the search box and the house. */
function SearchHero() {
  return (
    <Hero size="fullheight" color="light">
      <Hero.Head>
        <SiteNavbar />
      </Hero.Head>
      <Hero.Body pb="5">
        <Container>
          <SubTitle as="h2" textAlign="centered">
            Search hundreds of thousands of apartments, condos and houses for
            rent.
          </SubTitle>
          <Title textSize="2" textAlign="centered">
            Find A Place You’ll Love.
          </Title>
          <Columns isCentered>
            <Column size="7">
              {/* Searching stays on the page; run the search from here. */}
              <form onSubmit={event => event.preventDefault()}>
                <Field hasAddons className="has-shadow-field">
                  <Control
                    isExpanded
                    iconLeft={{ name: 'magnifying-glass', size: 'small' }}
                  >
                    <Input
                      id="mainSearch"
                      name="location"
                      type="text"
                      size="large"
                      placeholder="Find rentals in..."
                      aria-label="Find rentals in"
                    />
                  </Control>
                  <Control>
                    <Button
                      type="submit"
                      size="large"
                      color="primary"
                      textWeight="semibold"
                    >
                      Go!
                    </Button>
                  </Control>
                </Field>
              </form>
            </Column>
          </Columns>
          <Figure textAlign="centered" mt="6">
            <img src="/media/property_image.png" alt="Find rentals" />
          </Figure>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default SearchHero;
