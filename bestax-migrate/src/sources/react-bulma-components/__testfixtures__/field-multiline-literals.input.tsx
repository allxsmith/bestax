import { Form } from 'react-bulma-components';

export function Fields({ isMultiline }: { isMultiline: boolean }) {
  return (
    <div>
      <Form.Field multiline={false} />
      <Form.Field kind="group" multiline={false} />
      <Form.Field kind="group" align="right" multiline={false} />
      <Form.Field kind="addons" multiline={false} />
      <Form.Field multiline={isMultiline} />
      <Form.Field kind="group" multiline={isMultiline} />
      <Form.Field kind="addons" multiline={isMultiline} />
    </div>
  );
}
