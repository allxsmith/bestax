import { Card, Column, Columns } from "@allxsmith/bestax-bulma";
export function Cards() {
  // TODO(bestax-migrate): bestax `Card.FooterItem` renders `type="button"` when the element does not set it; add it here if that is what you want, then re-run
  return (
    <Columns>
      <Column>
        <Card bgColor="light">
          <Card.Header>
            <Card.Header.Title centered>Built from parts</Card.Header.Title>
            <Card.Header.Icon type="button" aria-label="more options">
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
          <Card.Header>
            <Card.Header.Title as="p">Bulma's own example</Card.Header.Title>
          </Card.Header>
          <Card.Content>The title and the links convert through as.</Card.Content>
          <Card.Footer>
            <Card.FooterItem href="#save" as="a">
              Save
            </Card.FooterItem>
            <Card.FooterItem type="button" as="button">
              Cancel
            </Card.FooterItem>
            <button className="card-footer-item">
              A button with no type would gain one
            </button>
          </Card.Footer>
        </Card>
      </Column>
      <Column>
        <Card />
      </Column>
    </Columns>
  );
}
