// The components the codemod writes as plain markup take their element from
// a literal `as`, and keep rbx's default beside one it can't read.
import {
  Breadcrumb,
  Field,
  Fieldset,
  Help,
  Label,
  Loader,
  Panel,
} from 'rbx';

export const Literal = () => (
  <div>
    <Help as="span" color="danger">
      Required
    </Help>
    <Label as="span">Name</Label>
    <Loader as="span" />
    <Panel.Tab.Group>
      <Panel.Tab as="span" active>
        All
      </Panel.Tab>
    </Panel.Tab.Group>
    <Breadcrumb>
      <Breadcrumb.Item as="span" active>
        Home
      </Breadcrumb.Item>
    </Breadcrumb>
    <Field>
      <Fieldset as="div">Fields</Fieldset>
    </Field>
  </div>
);

export const Dynamic = ({ tag }: { tag: 'span' }) => (
  <div>
    <Help as={tag}>Required</Help>
    <Label as={tag}>Name</Label>
    <Loader as={tag} />
    <Panel.Tab.Group>
      <Panel.Tab as={tag}>All</Panel.Tab>
    </Panel.Tab.Group>
    <Breadcrumb>
      <Breadcrumb.Item as={tag}>Home</Breadcrumb.Item>
    </Breadcrumb>
    <Field>
      <Fieldset as={tag}>Fields</Fieldset>
    </Field>
  </div>
);
