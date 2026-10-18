import {
  Column,
  Columns,
  Container,
  Figure,
  Hero,
  Link,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import RentalCard from './RentalCard.tsx';

const listings = [
  {
    title: 'Rental Rates and Rental Prices in Phoenix, AZ',
    summary:
      'Phoenix has a total population of 1,626,078 and 52.70% of the population own their home. 47.30% of the occupied housing units are renters within the P...',
  },
  {
    title: 'Rental Rates in Simi Valley and Rental Prices',
    summary:
      'View average rental rates and prices in Simi Valley CA for 1 bed, 2 bed, 3 bed and all rental size properties.',
  },
  {
    title: 'Rental Rates in Detroit',
    summary:
      'The average rental rate for all rental properties within Detroit is $987. The rental rates by bedrooms is as follows: a studio is $759, a one bedroom...',
  },
  {
    title: 'Rentals Near Johns Hopkins University',
    summary:
      'Johns Hopkins University is ranked number 17 in best education schools by US News and World Report.',
  },
  {
    title: 'Rental Properties Near University of Colorado Boulder',
    summary:
      'The University of Colorado in Boulder, CO has over 33,000 students of which a vast amount of them live off-campus close to the university.',
  },
  {
    title: 'Privately Owned Homes For Rent',
    summary:
      'The United States has a total population of 325,719,178 and 63.60% of the population own their home. 36.40% of the occupied housing units are renters...',
  },
  {
    title: 'Cheap San Antonio Apartments For Rent',
    summary:
      'San Antonio is home to many affordable apartments that fall below $800 a month in rent. San Antonio has a total population of 1,511,946 and 54.10% of...',
  },
  {
    title: 'Craigslist Sarasota Rental Data',
    summary:
      'Craigslist is by far the most popular classified site in the world. Specifically for rentals, they havesignificantly more renter leads to property man...',
  },
  {
    title: 'Houses for Rent Near Ohio State Campus',
    summary:
      'The Ohio State University campus currently has over 66,000 students. Many of these students live near or on campus and others commute from home outsid...',
  },
];

/** "Rental listings updated daily": the city guides, three to a row. */
function RentalListings() {
  return (
    <Hero size="medium" textAlign="centered">
      <Hero.Body>
        <Container>
          <SubTitle as="h2">
            Find rentals in all of the major US cities.
          </SubTitle>
          <Title mb="6">Rental listings updated daily.</Title>
          <Columns isCentered>
            <Column size="10">
              <Columns isMultiline>
                {listings.map(listing => (
                  <Column key={listing.title} size="one-third">
                    <RentalCard alt={listing.title}>
                      {/* The ellipsis classes clamp each line, from index.css. */}
                      <Title
                        as="h3"
                        textSize="6"
                        className="ellipsis is-ellipsis-1"
                      >
                        <Link href="#" textColor="dark">
                          {listing.title}
                        </Link>
                      </Title>
                      <SubTitle
                        as="h4"
                        textSize="7"
                        className="ellipsis is-ellipsis-2"
                      >
                        {listing.summary}
                      </SubTitle>
                    </RentalCard>
                  </Column>
                ))}
              </Columns>
            </Column>
          </Columns>
          <Figure mt="6">
            <img src="/media/city_clipart.png" alt="Rental listings" />
          </Figure>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default RentalListings;
