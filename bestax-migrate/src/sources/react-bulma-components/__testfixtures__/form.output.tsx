import { useState } from 'react';

import {
  Button,
  Checkbox,
  Control,
  Field,
  FieldBody,
  FieldLabel,
  File,
  Input,
  Radio,
  Select,
  TextArea,
} from "@allxsmith/bestax-bulma";

export function SignupForm() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <form>
      <Field>
        <label className="label is-small">Username</label>
        <Control isExpanded isLoading>
          <Input color="danger" size="small" placeholder="Username" isRounded isFocused />
        </Control>
        <p className="help is-danger">This username is taken</p>
      </Field>
      <Field hasAddons="centered">
        <Control>
          <Input placeholder="Find a repository" />
        </Control>
        <Control>
          <Button color="info">Search</Button>
        </Control>
      </Field>
      <Field grouped="multiline">
        <Control>
          <TextArea placeholder="Bio" hasFixedSize />
        </Control>
      </Field>
      <Field horizontal>
        <FieldLabel size="normal">From</FieldLabel>
        <FieldBody>
          <Field>
            <Control>
              <Select multiple isLoading isFullwidth>
                <option>Select dropdown</option>
              </Select>
            </Control>
          </Field>
        </FieldBody>
      </Field>
      <Field>
        <Control>
          <Checkbox>I agree to the terms</Checkbox>
          <Radio name="question">Yes</Radio>
        </Control>
      </Field>
      <Field>
        <File
          fileName={file?.name}
          buttonLabel="Choose a file"
          onChange={event => setFile(event.target.files?.[0] ?? null)}
          hasName
          isBoxed
          isFullwidth
          isCentered />
      </Field>
    </form>
  );
}
