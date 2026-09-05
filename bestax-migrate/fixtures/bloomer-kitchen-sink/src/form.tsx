import React from "react";
import {
  Checkbox,
  Control,
  Field,
  FieldBody,
  FieldLabel,
  Help,
  Icon,
  Input,
  Label,
  Radio,
  Select,
  TextArea,
} from "bloomer";

export const FormControls = () => (
  <form>
    <Field isHorizontal>
      <FieldLabel isNormal>
        <Label isSize="small">Name</Label>
      </FieldLabel>
      <FieldBody>
        <Field isGrouped="right" hasAddons>
          <Control hasIcons="left" isExpanded isLoading>
            <Input isColor="danger" isSize="medium" isFocused placeholder="Name" />
            <Icon isAlign="left" className="fas fa-user" isSize="small" />
          </Control>
          <Control hasIcons={["left", "right"]}>
            <Input type="email" isHovered />
          </Control>
          <Control hasIcons>
            <TextArea isSize="large" isHovered rows={3} />
          </Control>
        </Field>
        <Help isColor="danger">Required</Help>
      </FieldBody>
    </Field>
    <Field isGrouped>
      <Control>
        <Select isColor="primary" isLoading isFullWidth>
          <option>A</option>
        </Select>
      </Control>
      <Control>
        <Checkbox name="remember"> Remember me</Checkbox>
        <Radio name="answer" value="y"> Yes</Radio>
      </Control>
    </Field>
  </form>
);
