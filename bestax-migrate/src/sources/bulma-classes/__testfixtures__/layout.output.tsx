import {
  Box,
  Column,
  Columns,
  Container,
  Content,
  Footer,
  Hero,
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
      </Container>
      <Hero color="primary" size="small">
        <Hero.Body>Hero</Hero.Body>
      </Hero>
      <Footer textAlign="centered">Footer</Footer>
    </Section>
  );
}
