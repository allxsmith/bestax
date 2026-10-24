import {
  Button,
  Buttons,
  Column,
  Columns,
  Container,
  Image,
  Section,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

const fruits = [
  { name: 'Best Fresh Orange', image: '/images/orange.webp', alt: 'Oranges' },
  { name: 'Best Fresh Grapes', image: '/images/gauva.webp', alt: 'Guavas' },
  { name: 'Best Fresh Grapes', image: '/images/orange.webp', alt: 'Oranges' },
  { name: 'Best Fresh Orange', image: '/images/gauva.webp', alt: 'Guavas' },
  { name: 'Best Fresh Grapes', image: '/images/gauva.webp', alt: 'Guavas' },
];

/** "Fresh Fruits": a row per fruit, on the home page and the fruits page. */
function FreshFruitsSection() {
  return (
    <Section>
      <Container>
        <div className="has-text-centered pb-6">
          <Title size="1">Fresh Fruits</Title>
          <SubTitle as="h3">
            There are many variations of passages of Lorem Ipsum available, but
            the majority have
          </SubTitle>
        </div>
        {fruits.map((fruit, index) => (
          <Columns key={index}>
            <Column
              size="three-quarters"
              display="flex"
              justifyContent="center"
              flexDirection="column"
            >
              <Title size="3">{fruit.name}</Title>
              <p>
                but the majority have suffered alteration in some form, by
                injected humour, or randomised words which don't look even
                slightly believable. If you are going to use a passage of Lorem
                Ipsum, you need to be
              </p>
              <br />
              <Buttons>
                <Button size="medium" color="black" isLight>
                  Buy Now
                </Button>
              </Buttons>
            </Column>
            <Column>
              <Image as="figure" src={fruit.image} alt={fruit.alt} />
            </Column>
          </Columns>
        ))}
      </Container>
    </Section>
  );
}

export default FreshFruitsSection;
