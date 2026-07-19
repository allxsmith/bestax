import {
  Block,
  Breadcrumb,
  Button,
  Card,
  Form,
  Heading,
  Icon,
  Image,
  Level,
  Navbar,
  Table,
  Tabs,
  Whatever,
} from 'react-bulma-components';

export function MoreEdgeCases({
  weird,
  labelSize,
  helpColor,
  isActive,
  As,
}: {
  weird: string;
  labelSize: 'small' | 'medium';
  helpColor: 'danger' | 'success';
  isActive: boolean;
  As: 'a' | 'div';
}) {
  return (
    <div>
      <Whatever />
      <Button state={weird} display="hidden">
        Dynamic state
      </Button>
      <Block display="relative" mobile={{ ...JSON.parse(weird) }}>
        Spread responsive
      </Block>
      <Heading heading className="extra">
        Labelled
      </Heading>
      <Level>
        <Level.Side align="center">
          <Level.Item>Fallback side</Level.Item>
        </Level.Side>
      </Level>
      <Card>
        <Card.Image rounded size={96} src="/img.png" alt="pic" />
        <Card.Image>
          <Image size="3by2" src="/inner.png" alt="wrapped" />
        </Card.Image>
        <Card.Image />
      </Card>
      <Image src="/no-size.png" alt="plain" />
      <Form.Field kind={weird}>
        <Form.Label size={labelSize}>Dynamic label</Form.Label>
        <Form.Help color={helpColor}>Dynamic help</Form.Help>
      </Form.Field>
      <Form.Field kind="addons" multiline>
        <Form.Control>
          <Form.Input />
        </Form.Control>
      </Form.Field>
      <Form.Field kind="group" align="right" multiline>
        <Form.Control>
          <Form.InputFile label="Pick" />
        </Form.Control>
      </Form.Field>
      <Icon icon="star">
        <i className="fas fa-star" />
      </Icon>
      <Icon>
        <i className="mdi" />
      </Icon>
      <Navbar>
        <Navbar.Item renderAs={As} hoverable>
          <Navbar.Link>Menu</Navbar.Link>
          <Navbar.Dropdown up>
            <Navbar.Item>Entry</Navbar.Item>
          </Navbar.Dropdown>
        </Navbar.Item>
      </Navbar>
      <Breadcrumb>
        <Breadcrumb.Item active={isActive} href="/here">
          Here
        </Breadcrumb.Item>
      </Breadcrumb>
      <Table.Container className="scroller" textAlign="center">
        <p>intro</p>
        <Table bordered>
          <tbody />
        </Table>
      </Table.Container>
      <Tabs type="boxed" />
    </div>
  );
}
