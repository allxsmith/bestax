import { Content, Hero, Image, Level, Media } from 'react-bulma-components';

export function Layout() {
  return (
    <Hero color="primary" size="fullheight" hasNavbar>
      <Hero.Header>Site header</Hero.Header>
      <Hero.Body>
        <Media>
          <Media.Item align="left">
            <Image size={64} rounded src="/avatar.png" alt="Avatar" />
          </Media.Item>
          <Media.Item>
            <Content>Media body text</Content>
          </Media.Item>
          <Media.Item align="right">right rail</Media.Item>
        </Media>
        <Level breakpoint="mobile">
          <Level.Side align="left">
            <Level.Item>Tweets</Level.Item>
          </Level.Side>
          <Level.Side align="right">
            <Level.Item>Following</Level.Item>
          </Level.Side>
        </Level>
      </Hero.Body>
      <Hero.Footer>Site footer</Hero.Footer>
    </Hero>
  );
}
