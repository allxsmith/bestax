import { Block, Box, Button, Buttons, Level, Span, Tag, Tags } from "@allxsmith/bestax-bulma";

export default function WhitespacePage() {
  // TODO(bestax-migrate): bestax `Content` renders only <div>, not a <p>; keep the markup, or change the tag and re-run (whitespace.html:5)
  return (
    <>
      <Buttons>
        <Button as="a" color="primary">One</Button>
        <Button as="a">Two</Button>
      </Buttons>
      <p className="content">
        A paragraph that wraps over
        several lines, with <em>inline</em> elements <strong>and</strong> <a href="#">links</a>.
      </p>
      <Level>
        <Level.Left>
          <Level.Item as="p"><strong>12</strong>posts</Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item as="p"><Button as="a" size="small">New</Button></Level.Item>
        </Level.Right>
      </Level>
      <Tags>
        <Tag>One</Tag>
        <Tag>Two</Tag>
      </Tags>
      <p>Before <Span visibilityMobile="hidden">wide</Span> after</p>
      <p>Opened <Button size="small">here</Button> today</p>
      <Box>
        Text <div className="is-sr-only">for readers</div>continues
      </Box>
      <Block>
        <Tag>Inline</Tag>{" "}
        <Tag>tags</Tag>
      </Block>
    </>
  );
}
