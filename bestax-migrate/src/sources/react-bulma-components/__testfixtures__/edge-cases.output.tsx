import { Block, Button, Column, Columns, Icon, Level, Menu, Panel, Table } from "@allxsmith/bestax-bulma";

export function EdgeCases({
  dynamicAlign,
  isOutlined,
  size,
  align,
  active,
}: {
  dynamicAlign: 'left' | 'right';
  isOutlined: boolean;
  size: number;
  align: 'center' | 'right';
  active: boolean;
}) {
  // TODO(bestax-migrate): `color="grey-light"` — shade colors are not Button colors in bestax; use bgColor/textColor
  // TODO(bestax-migrate): `marginless` has a dynamic value; set `m="0"` conditionally by hand
  // TODO(bestax-migrate): `mobile` must be an inline object literal to flatten to bestax per-viewport props; convert it by hand
  // TODO(bestax-migrate): `textSize` takes a string in bestax-bulma ('textSize={4}' → 'textSize="4"'); convert the dynamic value
  // TODO(bestax-migrate): `textAlign` values differ in bestax-bulma ('center'→'centered', 'justify'→'justified'); convert the dynamic value
  // TODO(bestax-migrate): `tablet.only` (-only helper classes) has no bestax equivalent; use className
  // TODO(bestax-migrate): `mobile.flexWrap` could not be flattened to a bestax per-viewport prop
  // TODO(bestax-migrate): no bestax-bulma helper variants for the `touch` breakpoint; restyle with CSS or drop it
  // TODO(bestax-migrate): `align` has a dynamic value; pick between Level.Left / Level.Right by hand
  // TODO(bestax-migrate): dynamic Panel.Tabs.Tab active; set className={active ? 'is-active' : undefined} by hand
  // TODO(bestax-migrate): bestax Icon renders from a `name` prop, not children; convert this icon markup by hand
  return (
    <div>
      <Button color="grey-light" isOutlined={isOutlined} marginless={isOutlined}>
        Dynamic everything
      </Button>
      <Block textSize={size} textAlign={align} mobile={size ? { textSize: 3 } : undefined}>
        Dynamic helper values
      </Block>
      <Block tablet={{ only: true }} mobile={{ flexWrap: 'wrap' }} visibilityDesktop="hidden">
        Odd responsive keys
      </Block>
      <Columns touch={{ gap: 2 }} isMultiline gapTablet={3}>
        <Column isNarrowWidescreen>One</Column>
      </Columns>
      <Level>
        <Level.Left>
          <Level.Item>Dynamic side</Level.Item>
        </Level.Left>
      </Level>
      <Menu>
        <Menu.Label>{<strong>Bold title</strong>}</Menu.Label>
        <Menu.List>
          <Menu.Item>Entry</Menu.Item>
        </Menu.List>
      </Menu>
      <Panel>
        <Panel.Tabs>
          <a>Dynamic tab</a>
        </Panel.Tabs>
      </Panel>
      <Icon>
        <span className="custom-icon-font" />
      </Icon>
      <Icon name="home" library="mdi" />
      <div className="table-container">
        <p>Not just a table</p>
        <Table isNarrow>
          <tbody />
        </Table>
      </div>
    </div>
  );
}
