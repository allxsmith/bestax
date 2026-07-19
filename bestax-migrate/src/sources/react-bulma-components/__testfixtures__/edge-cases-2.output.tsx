import {
  Block,
  Breadcrumb,
  Button,
  Card,
  Control,
  Field,
  File,
  Icon,
  Image,
  Input,
  Level,
  Navbar,
  Table,
  Tabs,
} from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): Whatever has no bestax-bulma equivalent yet — migrate and remove this import
import { Whatever } from 'react-bulma-components';

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
  // TODO(bestax-migrate): `Whatever` is not a known react-bulma-components v4 export; migrate it by hand
  // TODO(bestax-migrate): `state` has a dynamic value; map it to the matching bestax boolean prop by hand
  // TODO(bestax-migrate): `display="hidden"` — use visibility='hidden' (already a separate bestax prop)
  // TODO(bestax-migrate): `display="relative"` — use the boolean `relative` prop
  // TODO(bestax-migrate): dynamic Field kind/align; map to the bestax `grouped` / `hasAddons` props by hand
  // TODO(bestax-migrate): dynamic Form.Label size; add an is-* class by hand
  // TODO(bestax-migrate): dynamic Form.Help color; consider the bestax Field `message`/`messageColor` props instead
  // TODO(bestax-migrate): `multiline` only combines with kind='group' in Bulma; dropped from this addons Field
  // TODO(bestax-migrate): bestax `grouped` takes one value; choose between multiline and right
  // TODO(bestax-migrate): bestax Icon renders from a `name` prop, not children; convert this icon markup by hand
  // TODO(bestax-migrate): dynamic renderAs on a dropdown Navbar.Item; bestax Navbar.Dropdown always renders a div
  // TODO(bestax-migrate): dynamic Breadcrumb.Item active; set the li className={active ? 'is-active' : undefined} by hand
  // TODO(bestax-migrate): Table.Container became a plain element; the Bulma helper prop(s) `textAlign` were dropped — restyle with classes
  return (
    <div>
      <Whatever />
      <Button state={weird} display="hidden">
        Dynamic state
      </Button>
      <Block display="relative" mobile={{ ...JSON.parse(weird) }}>
        Spread responsive
      </Block>
      <p className="heading">Labelled
              </p>
      <Level>
        <Level.Left>
          <Level.Item>Fallback side</Level.Item>
        </Level.Left>
      </Level>
      <Card>
        <Card.Image><Image isRounded size="96x96" src="/img.png" alt="pic" /></Card.Image>
        <Card.Image>
          <Image size="3by2" src="/inner.png" alt="wrapped" />
        </Card.Image>
        <Card.Image />
      </Card>
      <Image src="/no-size.png" alt="plain" />
      <Field>
        <label className="label">Dynamic label</label>
        <p className="help">Dynamic help</p>
      </Field>
      <Field hasAddons>
        <Control>
          <Input />
        </Control>
      </Field>
      <Field grouped="multiline">
        <Control>
          <File buttonLabel="Pick" />
        </Control>
      </Field>
      <Icon name="star" />
      <Icon>
        <i className="mdi" />
      </Icon>
      <Navbar>
        <Navbar.Dropdown hoverable>
          <Navbar.Link>Menu</Navbar.Link>
          <Navbar.DropdownMenu up>
            <Navbar.Item>Entry</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      </Navbar>
      <Breadcrumb>
        <li><a href="/here">Here
                    </a></li>
      </Breadcrumb>
      <div className="table-container">
        <p>intro</p>
        <Table isBordered>
          <tbody />
        </Table>
      </div>
      <Tabs boxed />
    </div>
  );
}
