import { useState } from 'react';
import { Button, Form } from 'react-bulma-components';

const { Input, Field, Control, Label, Textarea, Select, Checkbox, Radio, Help, InputFile } = Form;

export function SignupForm() {
  const [fileName, setFileName] = useState('');
  return (
    <form>
      <Field>
        <Label size="small">Username</Label>
        <Control fullwidth loading>
          <Input color="danger" size="small" rounded placeholder="Username" />
        </Control>
        <Help color="danger">This username is taken</Help>
      </Field>
      <Field kind="addons" align="center">
        <Control>
          <Input placeholder="Find a repository" />
        </Control>
        <Control>
          <Button color="info">Search</Button>
        </Control>
      </Field>
      <Field kind="group" multiline>
        <Control>
          <Textarea fixedSize placeholder="Bio" />
        </Control>
      </Field>
      <Form.Field horizontal>
        <Form.Field.Label size="normal">From</Form.Field.Label>
        <Form.Field.Body>
          <Field>
            <Control>
              <Select multiple loading fullwidth defaultValue={[]}>
                <option>Select dropdown</option>
              </Select>
            </Control>
          </Field>
        </Form.Field.Body>
      </Form.Field>
      <Field>
        <Control>
          <Checkbox>I agree to the terms</Checkbox>
          <Radio name="question">Yes</Radio>
        </Control>
      </Field>
      <Field>
        <InputFile
          boxed
          fullwidth
          align="center"
          filename={fileName}
          label="Choose a file"
          onChange={event => setFileName(event.target.files?.[0]?.name ?? '')}
        />
      </Field>
    </form>
  );
}
