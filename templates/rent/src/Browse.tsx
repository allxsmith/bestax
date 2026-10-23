import {
  Column,
  Columns,
  Container,
  Hero,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import ListingCard from './ListingCard.tsx';

/** Two rows of four, each a line break between the kind and the city. */
const STATES = [
  [
    { kind: 'Houses', city: 'Dallas, TX' },
    { kind: 'Apartments', city: 'San Antonio, TX' },
    { kind: 'Houses', city: 'Phoenix, AZ' },
    { kind: 'Apartments', city: 'Denver, CO' },
  ],
  [
    { kind: 'Houses', city: 'Houston, TX' },
    { kind: 'Apartments', city: 'San Francisco, CA' },
    { kind: 'Houses', city: 'San Diego, CA' },
    { kind: 'Apartments', city: 'Austin, TX' },
  ],
];

/** "Dallas houses for rent", from the card's own kind and city. */
const photoAlt = ({ kind, city }: { kind: string; city: string }) =>
  `${city.split(',')[0]} ${kind.toLowerCase()} for rent`;

const REGIONS = [
  {
    name: 'From the West',
    cities: ['Seattle', 'Las Vegas', 'Portland', 'San Jose', 'Mesa'],
  },
  {
    name: 'From the Midwest',
    cities: [
      'Indianapolis',
      'Kansas City',
      'Minneapolis',
      'Albuquerque',
      'Columbus',
    ],
  },
  {
    name: 'From the South',
    cities: ['Charlotte', 'Atlanta', 'Nashville', 'Jacksonville', 'Raleigh'],
  },
  {
    name: 'From the East',
    cities: ['Washington', 'New York', 'Baltimore', 'Brooklyn', 'Boston'],
  },
];

const NEIGHBORHOODS = [
  { name: 'Washington Park Denver, CO', alt: 'Washington park rentals' },
  { name: 'Upper West Side New York', alt: 'Upper West Side NYC rentals' },
  { name: 'Downtown Dallas, TX', alt: 'Downtown Dallas rentals' },
  { name: 'Lincoln Park Chicago, IL', alt: 'Lincoln Park Chicago rentals' },
  {
    name: 'Washington Sq. Philadelphia',
    alt: 'Washington Square West Philadelphia rentals',
  },
];

/** Rentals by state, by region and by neighborhood. */
function Browse() {
  return (
    <Hero size="medium">
      <Hero.Body>
        <Container>
          <Columns isCentered>
            <Column size="10">
              <div className="sub-section">
                <Title as="h3" textSize="4">
                  Find rentals in all States
                </Title>
                <SubTitle as="h4" textSize="6">
                  Whether you are looking for apartments or single family homes
                  we got &apos;em all.
                </SubTitle>
                {STATES.map((row, index) => (
                  <Columns key={index}>
                    {row.map(state => (
                      <Column key={state.city}>
                        <ListingCard alt={photoAlt(state)}>
                          <Title as="h2" textSize="6">
                            <a href="#">
                              {state.kind} for rent in
                              <br />
                              {state.city}
                            </a>
                          </Title>
                        </ListingCard>
                      </Column>
                    ))}
                  </Columns>
                ))}
              </div>
              <div className="sub-section">
                <Columns>
                  {REGIONS.map(region => (
                    <Column key={region.name}>
                      <Title as="h4" textSize="6" textTransform="uppercase">
                        {region.name}
                      </Title>
                      <ul className="city-list">
                        {region.cities.map(city => (
                          <li key={city}>
                            <a href="#">Rentals in {city}</a>
                          </li>
                        ))}
                      </ul>
                    </Column>
                  ))}
                </Columns>
              </div>
              <div className="sub-section">
                <Title as="h3" textSize="4">
                  Browse by popular neighborhoods
                </Title>
                <Columns>
                  {NEIGHBORHOODS.map(neighborhood => (
                    <Column key={neighborhood.name}>
                      <ListingCard alt={neighborhood.alt}>
                        <Title as="h3" textSize="7">
                          <a href="#">{neighborhood.name}</a>
                        </Title>
                      </ListingCard>
                    </Column>
                  ))}
                </Columns>
              </div>
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Browse;
