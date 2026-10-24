import {
  Column,
  Columns,
  Container,
  Hero,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** "All marketplaces", beside a small house. */
function Marketplaces() {
  return (
    <Hero>
      <Hero.Body>
        <Container>
          <Columns isCentered>
            <Column size="7">
              <Columns>
                <Column>
                  <Title className="m-t-60">All marketplaces</Title>
                  <SubTitle as="h2">
                    Bulma Rent provides you insights into all marketplaces.
                  </SubTitle>
                </Column>
                <Column textAlign="centered">
                  <img
                    className="m-t-50"
                    src="/media/rental-house.svg"
                    alt="Rental marketplaces"
                  />
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
