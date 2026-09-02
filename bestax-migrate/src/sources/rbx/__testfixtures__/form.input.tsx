import React from "react";
import { Field, Control, Input, Label, Help, Select, Textarea, Checkbox, Radio, Icon, Image, PageLoader, Loader, Divider, Delete } from "rbx";

export const Form = () => (
  <>
    <Field horizontal>
      <Field.Label size="normal">
        <Label size="small">Name</Label>
      </Field.Label>
      <Field.Body>
        <Control expanded iconLeft loading>
          <Input type="text" color="danger" size="small" rounded state="focused" />
          <Icon size="small" align="left">
            <i className="fas fa-user" />
          </Icon>
        </Control>
        <Help color="danger">Required</Help>
      </Field.Body>
    </Field>
    <Field kind="group" multiline>
      <Control>
        <Select.Container fullwidth rounded state="loading" size="medium">
          <Select>
            <Select.Option value="a">A</Select.Option>
          </Select>
        </Select.Container>
      </Control>
    </Field>
    <Textarea color="info" size="medium" fixedSize state="hovered" />
    <Checkbox />
    <Radio />
    <Image.Container size={64}>
      <Image src="/a.png" rounded />
    </Image.Container>
    <PageLoader active color="info" direction="right-to-left" />
    <Loader />
    <Divider color="primary" vertical>OR</Divider>
    <Delete size="small" />
  </>
);
