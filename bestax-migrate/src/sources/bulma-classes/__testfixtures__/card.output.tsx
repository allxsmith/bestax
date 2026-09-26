import { Card, Column, Columns } from "@allxsmith/bestax-bulma";
export function Cards() {
  // TODO(bestax-migrate): bestax `Card.Header` renders its children inside a `.card-header-title` of its own unless one of them is a `Card.Header.Title`, so this element stays markup
  // TODO(bestax-migrate): bestax `Card.Header.Title` renders only <div>, not a <p>; keep the markup, or change the tag and re-run
  // TODO(bestax-migrate): bestax `Card.FooterItem` renders only <span>, not a <a>; keep the markup, or change the tag and re-run
  return (
    <Columns>
      <Column>
        <Card bgColor="light">
          <Card.Header>
            <Card.Header.Title centered>Built from parts</Card.Header.Title>
            <Card.Header.Icon aria-label="more options">
              More
            </Card.Header.Icon>
          </Card.Header>
          <Card.Image>
            <img src="/cover.png" alt="Cover" />
          </Card.Image>
          <Card.Content className="content">Every element converts.</Card.Content>
          <Card.Footer>
            <Card.FooterItem>Saved</Card.FooterItem>
          </Card.Footer>
        </Card>
      </Column>
      <Column>
        <Card>
          <header className="card-header">
            <p className="card-header-title">Bulma's own example</p>
          </header>
          <Card.Content>The title and the links stay.</Card.Content>
          <Card.Footer>
            <a href="#save" className="card-footer-item">
              Save
            </a>
          </Card.Footer>
        </Card>
      </Column>
      <Column>
        <Card />
      </Column>
    </Columns>
  );
}
