import {
  Button,
  Column,
  Columns,
  Container,
  Content,
  Hero,
  Title,
} from '@allxsmith/bestax-bulma';

/** The reception's lines; each one's button shows on phones only. */
const reception = [
  {
    label: 'Phone Number',
    icon: 'fa-phone-flip',
    href: 'tel:+302109999999',
    text: '+30 210 9999999',
    action: 'Call',
  },
  {
    label: 'Reservation',
    icon: 'fa-phone-flip',
    href: 'tel:+302109999997',
    text: '+30 2109999997',
    action: 'Call',
  },
  {
    label: 'Email',
    icon: 'fa-envelope',
    href: 'mailto:reservations@bulmahotels.com',
    text: 'reservations@bulmahotels.com',
    action: 'Mail',
  },
];

function About() {
  return (
    <Hero id="about-us">
      <Hero.Body>
        <Container>
          <Content>
            <Title size="4" className="main_title">
              Explore Bulma Hotel
            </Title>
          </Content>
          {/* The original's element was both `.columns` and `.content`; the
              two components nest here, and their margins collapse to the same. */}
          <Content>
            <Columns>
              <Column>
                <p>
                  With unmatched hospitality, convenience &amp; comforts, Bulma
                  Hotel is an ideal choice for your stay. Whether business trip
                  or just a weekend leisure, we make an effort to bestow the
                  finest services, that will make your stay memorable.
                </p>
                <div className="reception">
                  <Title size="5" className="main_title">
                    Reception
                  </Title>
                  {reception.map(line => (
                    <div key={line.label} className="reception-item">
                      <div>
                        <div>
                          <i className={`fa ${line.icon}`} aria-hidden="true" />{' '}
                          <span>{line.label}</span>
                        </div>
                        <a href={line.href}>{line.text}</a>
                      </div>
                      <Button as="a" href={line.href} className="mobile-only">
                        <span>{line.action}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </Column>
              <Column className="reception-image">
                <img src="/media/reception.svg" alt="Bulma Hotels" />
              </Column>
            </Columns>
          </Content>
          <Content>
            <Title size="5" className="main_title">
              Location
            </Title>
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
