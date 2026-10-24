import {
  Button,
  Column,
  Columns,
  Container,
  Control,
  Field,
  Hero,
  InputBase,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import SiteNavbar from './SiteNavbar.tsx';

/** The first screen: the navbar, the search box and the house. */
function SearchHero() {
  return (
    <Hero size="fullheight" color="light">
      <Hero.Head>
        <SiteNavbar />
      </Hero.Head>
      <Hero.Body className="p-b-30">
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
              {/* The original's form reloads the page when Enter is pressed
                  in the box. It stays on the page instead; run the search
                  from here. */}
              <form onSubmit={event => event.preventDefault()}>
                <Field hasAddons className="has-shadow-field">
                  <Control
                    hasIconsLeft
                    isExpanded
                    iconLeft={{ name: 'magnifying-glass', size: 'small' }}
                  >
                    <InputBase
                      type="text"
                      id="mainSearch"
                      aria-label="Find rentals in"
                      placeholder="Find rentals in..."
                      size="large"
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
          <div className="has-text-centered">
            <img
              className="m-t-50"
              src="/media/property_image.png"
              alt="Find rentals"
            />
          </div>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default SearchHero;
