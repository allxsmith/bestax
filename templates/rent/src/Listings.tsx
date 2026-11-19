import {
  Column,
  Columns,
  Container,
  Hero,
  Link,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import ListingCard from './ListingCard.tsx';

const LISTINGS = [
  {
    title: 'Rental Rates and Rental Prices in Phoenix, AZ',
    text: 'Phoenix has a total population of 1,626,078 and 52.70% of the population own their home. 47.30% of the occupied housing units are renters within the P...',
  },
  {
    title: 'Rental Rates in Simi Valley and Rental Prices',
    text: 'View average rental rates and prices in Simi Valley CA for 1 bed, 2 bed, 3 bed and all rental size properties.',
  },
  {
    title: 'Rental Rates in Detroit',
    text: 'The average rental rate for all rental properties within Detroit is $987. The rental rates by bedrooms is as follows: a studio is $759, a one bedroom...',
  },
  {
    title: 'Rentals Near Johns Hopkins University',
    text: 'Johns Hopkins University is ranked number 17 in best education schools by US News and World Report.',
  },
  {
    title: 'Rental Properties Near University of Colorado Boulder',
    text: 'The University of Colorado in Boulder, CO has over 33,000 students of which a vast amount of them live off-campus close to the university.',
  },
  {
    title: 'Privately Owned Homes For Rent',
    text: 'The United States has a total population of 325,719,178 and 63.60% of the population own their home. 36.40% of the occupied housing units are renters...',
  },
  {
    title: 'Cheap San Antonio Apartments For Rent',
    text: 'San Antonio is home to many affordable apartments that fall below $800 a month in rent. San Antonio has a total population of 1,511,946 and 54.10% of...',
  },
  {
    title: 'Craigslist Sarasota Rental Data',
    text: 'Craigslist is by far the most popular classified site in the world. Specifically for rentals, they havesignificantly more renter leads to property man...',
  },
  {
    title: 'Houses for Rent Near Ohio State Campus',
    text: 'The Ohio State University campus currently has over 66,000 students. Many of these students live near or on campus and others commute from home outsid...',
  },
];

/** "Rental listings updated daily": a grid of listing cards. */
function Listings() {
  return (
    <Hero size="medium" textAlign="centered">
      <Hero.Body>
        <Container>
          <SubTitle as="h2">
            Find rentals in all of the major US cities.
          </SubTitle>
          <Title>Rental listings updated daily.</Title>
          <br />
          <Columns isCentered>
            <Column size="10">
              <Columns isMultiline>
                {LISTINGS.map(listing => (
                  <Column key={listing.title} size="one-third">
                    <ListingCard alt={listing.title}>
                      <Title
                        as="h3"
                        textSize="6"
                        className="ellipsis is-ellipsis-1"
                      >
                        {/* The original linked pages it never shipped. */}
                        <Link textColor="dark" href="#">
                          {listing.title}
                        </Link>
                      </Title>
                      <SubTitle
                        as="h4"
                        textSize="7"
                        className="ellipsis is-ellipsis-2"
                      >
                        {listing.text}
                      </SubTitle>
                    </ListingCard>
                  </Column>
                ))}
              </Columns>
            </Column>
          </Columns>
          <img
            className="m-t-50"
            src="/media/city-day.svg"
            alt="Rental listings"
          />
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Listings;
