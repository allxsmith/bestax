import { Button, Block, Columns, Icon, Level, Menu, Panel, Table } from 'react-bulma-components';

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
  return (
    <div>
      <Button color="grey-light" outlined={isOutlined} rounded={false} marginless={isOutlined}>
        Dynamic everything
      </Button>
      <Block textSize={size} textAlign={align} mobile={size ? { textSize: 3 } : undefined}>
        Dynamic helper values
      </Block>
      <Block tablet={{ only: true }} desktop={{ display: 'hidden' }} mobile={{ flexWrap: 'wrap' }}>
        Odd responsive keys
      </Block>
      <Columns tablet={{ gap: 3 }} touch={{ gap: 2 }}>
        <Columns.Column widescreen={{ narrow: true }}>One</Columns.Column>
      </Columns>
      <Level>
        <Level.Side align={dynamicAlign}>
          <Level.Item>Dynamic side</Level.Item>
        </Level.Side>
      </Level>
      <Menu>
        <Menu.List title={<strong>Bold title</strong>}>
          <Menu.List.Item>Entry</Menu.List.Item>
        </Menu.List>
      </Menu>
      <Panel>
        <Panel.Tabs>
          <Panel.Tabs.Tab active={active}>Dynamic tab</Panel.Tabs.Tab>
        </Panel.Tabs>
      </Panel>
      <Icon>
        <span className="custom-icon-font" />
      </Icon>
      <Icon>
        <i className="mdi mdi-home" />
      </Icon>
      <Table.Container>
        <p>Not just a table</p>
        <Table size="narrow">
          <tbody />
        </Table>
      </Table.Container>
    </div>
  );
}
