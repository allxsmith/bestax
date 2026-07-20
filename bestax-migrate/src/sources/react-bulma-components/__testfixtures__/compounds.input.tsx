import { Card, Heading, Hero, Level, Media, Image, Content } from 'react-bulma-components';

export const Profile = () => (
  <Hero color="primary" size="fullheight" hasNavbar>
    <Hero.Header>
      <Heading size={1} weight="semibold" spaced>
        Profile
      </Heading>
      <Heading subtitle size={4}>
        Who you are
      </Heading>
      <Heading heading>Stats</Heading>
    </Hero.Header>
    <Hero.Body>
      <Card>
        <Card.Image size="4by3" src="/cover.png" alt="Cover" />
        <Card.Header>
          <Card.Header.Title>Jane</Card.Header.Title>
          <Card.Header.Icon>▼</Card.Header.Icon>
        </Card.Header>
        <Card.Content>
          <Media>
            <Media.Item align="left">
              <Image size={64} rounded src="/avatar.png" alt="Avatar" />
            </Media.Item>
            <Media.Item>
              <Content>Body text</Content>
            </Media.Item>
            <Media.Item align="right">right rail</Media.Item>
          </Media>
        </Card.Content>
        <Card.Footer>
          <Card.Footer.Item renderAs="a" href="#follow">
            Follow
          </Card.Footer.Item>
        </Card.Footer>
      </Card>
      <Level breakpoint="mobile">
        <Level.Side align="left">
          <Level.Item>Tweets</Level.Item>
        </Level.Side>
        <Level.Side align="right">
          <Level.Item>Following</Level.Item>
        </Level.Side>
      </Level>
    </Hero.Body>
    <Hero.Footer>fin</Hero.Footer>
  </Hero>
);
