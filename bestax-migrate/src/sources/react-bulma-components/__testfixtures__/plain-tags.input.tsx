// The components the codemod writes as plain markup take their element from
// a literal `renderAs`, and keep RBC's default beside one it can't read.
import {
  Breadcrumb,
  Form,
  Loader,
  Panel,
  Table,
  Tabs,
} from 'react-bulma-components';

export const Literal = () => (
  <div>
    <Form.Label renderAs="span">Name</Form.Label>
    <Form.Help renderAs="span" color="danger">
      Required
    </Form.Help>
    <Loader renderAs="span" />
    <Panel.Tabs>
      <Panel.Tabs.Tab renderAs="span" active>
        All
      </Panel.Tabs.Tab>
    </Panel.Tabs>
    <Breadcrumb>
      <Breadcrumb.Item renderAs="span" active>
        Home
      </Breadcrumb.Item>
    </Breadcrumb>
    <Table.Container renderAs="section">No rows</Table.Container>
    <Tabs>
      <Tabs.Tab renderAs="span">Music</Tabs.Tab>
    </Tabs>
  </div>
);

export const Dynamic = ({ tag }: { tag: 'span' }) => (
  <div>
    <Form.Label renderAs={tag}>Name</Form.Label>
    <Form.Help renderAs={tag}>Required</Form.Help>
    <Loader renderAs={tag} />
    <Panel.Tabs>
      <Panel.Tabs.Tab renderAs={tag}>All</Panel.Tabs.Tab>
    </Panel.Tabs>
    <Breadcrumb>
      <Breadcrumb.Item renderAs={tag}>Home</Breadcrumb.Item>
    </Breadcrumb>
    <Table.Container renderAs={tag}>No rows</Table.Container>
    <Tabs>
      <Tabs.Tab renderAs={tag}>Music</Tabs.Tab>
    </Tabs>
  </div>
);
