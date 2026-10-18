import {
  Column,
  Columns,
  Container,
  Figure,
  Hero,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** "All marketplaces", beside the little house. */
function Marketplaces() {
  return (
    <Hero>
      <Hero.Body>
        <Container>
          <Columns isCentered>
            <Column size="7">
              <Columns>
                <Column>
                  <Title mt="6">All marketplaces</Title>
                  <SubTitle as="h2">
                    Bulma Rent provides you insights into all marketplaces.
                  </SubTitle>
                </Column>
                <Column textAlign="centered">
                  <Figure mt="6">
                    <img
                      src="/media/house_for_rent.png"
                      alt="Rental marketplaces"
                    />
                  </Figure>
                </Column>
              </Columns>
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Marketplaces;
