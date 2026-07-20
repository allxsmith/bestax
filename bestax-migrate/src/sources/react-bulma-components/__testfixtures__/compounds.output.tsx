import {
  Card,
  Content,
  Hero,
  Image,
  Level,
  Media,
  MediaContent,
  MediaLeft,
  MediaRight,
  SubTitle,
  Title,
} from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): `renderAs` — this bestax component has no `as` prop; restructure the element instead
export const Profile = () => (
  <Hero color="primary" size="fullheight" fullheightWithNavbar>
    <Hero.Head>
      <Title size="1" textWeight="semibold" isSpaced>
        Profile
      </Title>
      <SubTitle size="4">
        Who you are
      </SubTitle>
      <p className="heading">Stats</p>
    </Hero.Head>
    <Hero.Body>
      <Card>
        <Card.Image><Image size="4by3" src="/cover.png" alt="Cover" /></Card.Image>
        <Card.Header>
          <Card.Header.Title>Jane</Card.Header.Title>
          <Card.Header.Icon>▼</Card.Header.Icon>
        </Card.Header>
        <Card.Content>
          <Media>
            <MediaLeft>
              <Image size="64x64" src="/avatar.png" alt="Avatar" isRounded />
            </MediaLeft>
            <MediaContent>
              <Content>Body text</Content>
            </MediaContent>
            <MediaRight>right rail</MediaRight>
          </Media>
        </Card.Content>
        <Card.Footer>
          <Card.FooterItem renderAs="a" href="#follow">
            Follow
          </Card.FooterItem>
        </Card.Footer>
      </Card>
      <Level isMobile>
        <Level.Left>
          <Level.Item>Tweets</Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>Following</Level.Item>
        </Level.Right>
      </Level>
    </Hero.Body>
    <Hero.Foot>fin</Hero.Foot>
  </Hero>
);
