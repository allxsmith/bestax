import {
  Block,
  Column,
  Columns,
  Container,
  Hero,
  Link,
  SubTitle,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';
import RentalCard from './RentalCard.tsx';

/** Two rows of four: what each card says, and its photo's description. */
const states = [
  [
    { kind: 'Houses', city: 'Dallas, TX', alt: 'Dallas houses for rent' },
    {
      kind: 'Apartments',
      city: 'San Antonio, TX',
      alt: 'San Antonio apartments for rent',
    },
    { kind: 'Houses', city: 'Phoenix, AZ', alt: 'Phoenix houses for rent' },
    { kind: 'Apartments', city: 'Denver, CO', alt: 'Denver houses for rent' },
  ],
  [
    { kind: 'Houses', city: 'Houston, TX', alt: 'Houston houses for rent' },
    {
      kind: 'Apartments',
      city: 'San Francisco, CA',
      alt: 'San Francisco apartments for rent',
    },
    {
      kind: 'Houses',
      city: 'San Diego, CA',
      alt: 'San Diego houses for rent',
    },
    {
      kind: 'Apartments',
      city: 'Austin, TX',
      alt: 'Austin apartments for rent',
    },
  ],
];

const regions = [
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

const neighborhoods = [
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
function BrowseRentals() {
  return (
    <Hero size="medium">
      <Hero.Body>
        <Container>
          <Columns isCentered>
            <Column size="10">
              <Block mb="6">
                <Title as="h3" textSize="4">
                  Find rentals in all States
                </Title>
                <SubTitle as="h4" textSize="6">
                  Whether you are looking for apartments or single family homes
                  we got &apos;em all.
                </SubTitle>
                {states.map((row, index) => (
                  <Columns key={index}>
                    {row.map(state => (
                      <Column key={state.city}>
                        <RentalCard alt={state.alt}>
                          <Title as="h2" textSize="6">
                            <Link href="#">
                              {state.kind} for rent in
                              <br />
                              {state.city}
                            </Link>
                          </Title>
                        </RentalCard>
                      </Column>
                    ))}
                  </Columns>
                ))}
              </Block>
              <Block mb="6">
                <Columns>
                  {regions.map(region => (
                    <Column key={region.name}>
                      <Title as="h4" textSize="6" textTransform="uppercase">
                        {region.name}
                      </Title>
                      <UnorderedList className="city-links">
                        {region.cities.map(city => (
                          <UnorderedList.Item key={city}>
                            <Link href="#">Rentals in {city}</Link>
                          </UnorderedList.Item>
                        ))}
                      </UnorderedList>
                    </Column>
                  ))}
                </Columns>
              </Block>
              <Block mb="6">
                <Title as="h3" textSize="4">
                  Browse by popular neighborhoods
                </Title>
                <Columns>
                  {neighborhoods.map(neighborhood => (
                    <Column key={neighborhood.name}>
                      <RentalCard alt={neighborhood.alt}>
                        <Title as="h3" textSize="7">
                          <Link href="#">{neighborhood.name}</Link>
                        </Title>
                      </RentalCard>
                    </Column>
                  ))}
                </Columns>
              </Block>
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default BrowseRentals;
