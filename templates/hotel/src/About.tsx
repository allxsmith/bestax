import {
  Button,
  Column,
  Columns,
  Container,
  Content,
  Hero,
  Icon,
  Title,
} from '@allxsmith/bestax-bulma';

const reception = [
  {
    label: 'Phone Number',
    icon: 'phone',
    href: 'tel:+302109999999',
    value: '+30 210 9999999',
    action: 'Call',
  },
  {
    label: 'Reservation',
    icon: 'phone',
    href: 'tel:+302109999997',
    value: '+30 2109999997',
    action: 'Call',
  },
  {
    label: 'Email',
    icon: 'envelope',
    href: 'mailto:reservations@bulmahotels.com',
    value: 'reservations@bulmahotels.com',
    action: 'Mail',
  },
];

/** About the hotel: the reception's numbers, a photo and the location. */
function About() {
  return (
    <Hero id="about-us">
      <Hero.Body>
        <Container>
          <Content>
            <Title size="4">Explore Bulma Hotel</Title>
          </Content>
          <Content>
            <Columns>
              <Column>
                <p>
                  With unmatched hospitality, convenience &amp; comforts, Bulma
                  Hotel is an ideal choice for your stay. Whether business trip
                  or just a weekend leisure, we make an effort to bestow the
                  finest services, that will make your stay memorable.
                </p>
                <Title size="5">Reception</Title>
                {reception.map(item => (
                  <div key={item.label} className="reception-item">
                    <div>
                      <div>
                        <Icon name={item.icon} /> <span>{item.label}</span>
                      </div>
                      <a href={item.href}>{item.value}</a>
                    </div>
                    {/* Shown on phones only, by .mobile-only in index.css. */}
                    <Button as="a" href={item.href} className="mobile-only">
                      {item.action}
                    </Button>
                  </div>
                ))}
              </Column>
              <Column className="reception-image">
                <img
                  src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=600&q=80"
                  alt="Bulma Hotels"
                />
              </Column>
            </Columns>
          </Content>
          <Content>
            <Title size="5">Location</Title>
            <p>
              Bulma Hotel is a business hotel with 45 air conditioned luxury
              rooms. The hotel is conveniently located in close proximity to
              Athens, Greece.
            </p>
            <ul>
              <li>3 kms from Kifisia bus station and railway station.</li>
              <li>25 kms from Athens International Airport.</li>
              <li>
                Less than 2 km from nearest shopping malls (The Mall Athens,
                &amp; Icon Mall).
              </li>
            </ul>
          </Content>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default About;
