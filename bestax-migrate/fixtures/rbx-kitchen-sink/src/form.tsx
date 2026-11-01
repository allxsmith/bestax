import React from "react";
import {
  Checkbox,
  Control,
  Field,
  Fieldset,
  Help,
  Input,
  Label,
  Radio,
  Select,
  Textarea,
} from "rbx";

export const FormControls = () => (
  <>
    <Field horizontal>
      <Field.Label size="normal">
        <Label size="small">Email</Label>
      </Field.Label>
      <Field.Body>
        <Control expanded loading>
          <Input
            type="email"
            color="danger"
            size="small"
            rounded
            state="focused"
            readOnly
          />
        </Control>
        <Help color="danger">Required</Help>
      </Field.Body>
    </Field>
    <Field kind="addons">
      <Control>
        <Select.Container fullwidth rounded size="medium" state="loading">
          <Select>
            <Select.Option value="a">A</Select.Option>
            <Select.Option value="b">B</Select.Option>
          </Select>
        </Select.Container>
      </Control>
    </Field>
    <Field kind="group" multiline>
      <Control>
        <Textarea color="info" size="medium" fixedSize state="hovered" />
      </Control>
      <Control>
        <Checkbox />
        <Radio />
      </Control>
    </Field>
    <Fieldset disabled>
      <Field>
        <Control>
          <Input type="text" placeholder="Saving" />
        </Control>
      </Field>
    </Fieldset>
    <Field>
      <Fieldset disabled>
        <Input type="text" placeholder="Inside a field" />
      </Fieldset>
    </Field>
  </>
);
