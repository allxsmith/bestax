import {
  Button,
  Buttons,
  Column,
  Columns,
  Container,
  Image,
  Paragraph,
  Section,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** The original's rows, names and photos as it pairs them. */
const fruits = [
  { name: 'Best Fresh Orange', photo: '/images/orange.webp' },
  { name: 'Best Fresh Grapes', photo: '/images/guava.webp' },
  { name: 'Best Fresh Grapes', photo: '/images/orange.webp' },
  { name: 'Best Fresh Orange', photo: '/images/guava.webp' },
  { name: 'Best Fresh Grapes', photo: '/images/guava.webp' },
];

/** "Fresh Fruits": on the home page and the Fruits page. */
function FreshFruits() {
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
              <Paragraph mb="5">
                but the majority have suffered alteration in some form, by
                injected humour, or randomised words which don&apos;t look even
                slightly believable. If you are going to use a passage of Lorem
                Ipsum, you need to be
              </Paragraph>
              <Buttons>
                <Button type="button" size="medium" color="black" isLight>
                  Buy Now
                </Button>
              </Buttons>
            </Column>
            <Column>
              <Image as="figure" src={fruit.photo} alt="" />
            </Column>
          </Columns>
        ))}
      </Container>
    </Section>
  );
}

export default FreshFruits;
