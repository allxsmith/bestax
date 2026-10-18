import {
  Box,
  Column,
  Columns,
  Container,
  Content,
  Footer,
  Hero,
  Image,
  Level,
  Media,
  Paragraph,
  Section,
  Span,
  SubTitle,
  Title,
  UnorderedList,
} from "@allxsmith/bestax-bulma";

export function Landing() {
  // TODO(bestax-migrate): `.box` is bestax `Box`'s class too, and an element converts to one component: `Columns` here, since the codemod ranks `.columns` first, putting layout and parts ahead of surfaces, so `.box` stays in its `className`, which renders the same; to use `Box`, give it an element of its own around or inside this one and drop the class, then check the layout, since two elements space differently from one
  // TODO(bestax-migrate): `.container` is bestax `Container`'s class too, and an element converts to one component: `Image` here, since `Container` renders only <div>, not a <figure>, so `.container` stays in its `className`, which renders the same; where it is there to center this element, `mx="auto"` does that, and otherwise wrap the element in a `Container`; either way drop the class, then check the layout
  return (
    <Section size="medium">
      <Container breakpoint="desktop" isMax>
        <Title size="1" textAlign="centered">Ship faster</Title>
        <SubTitle as="p" size="4">A subtitle on a paragraph</SubTitle>
        <SubTitle as="h3">A smaller heading, no size class</SubTitle>
        <Columns isMultiline className="pricing-grid">
          <Column size="4" offset="2" isNarrowMobile>
            <Box bgColor="light" p="5">
              <Paragraph textWeight="semibold" textSize="5" mb="2">Fast</Paragraph>
              <Span textColor="grey" textTransform="italic">and quiet</Span>
            </Box>
          </Column>
          <Column sizeTablet="half" sizeDesktop="4">
            <Content size="small">
              <UnorderedList mt="2">
                <li>One</li>
              </UnorderedList>
            </Content>
          </Column>
        </Columns>
        <Level isMobile>
          <Level.Left>
            <Level.Item>Left</Level.Item>
          </Level.Left>
          <Level.Right>
            <Level.Item as="p">Right</Level.Item>
          </Level.Right>
        </Level>
        <Media>
          <Media.Left>Avatar</Media.Left>
          <Media.Content>Body</Media.Content>
        </Media>
        <Columns className="box">
          <Column>In a box</Column>
        </Columns>
        <Image
          as="figure"
          size="128x128"
          className="container"
          src="/avatar.png"
          alt="Centered" />
      </Container>
      <Hero color="primary" size="small">
        <Hero.Body>Hero</Hero.Body>
      </Hero>
      <Footer textAlign="centered">Footer</Footer>
    </Section>
  );
}
