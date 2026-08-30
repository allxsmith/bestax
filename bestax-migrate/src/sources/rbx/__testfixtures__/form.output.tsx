import React from "react";
import {
  Checkbox,
  Control,
  Delete,
  Divider,
  Field,
  Icon,
  Image,
  Input,
  Loading,
  Radio,
  Select,
  TextArea,
} from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): `direction` — bestax `Loading` has no directional variant; drop it or add a custom class
// TODO(bestax-migrate): `color` — bestax `Divider` takes only `bgColor`; set that or a custom class
// TODO(bestax-migrate): `vertical` — bestax `Divider` has no vertical variant; use a bordered Column or custom CSS
export const Form = () => (
  <>
    <Field horizontal>
      <Field.Label size="normal">
        <label className="label is-small">Name</label>
      </Field.Label>
      <Field.Body>
        <Control expanded loading hasIconsLeft>
          <Input type="text" color="danger" size="small" isRounded isFocused />
          <Icon size="small" align="left" name="user" library="fa" variant="solid" />
        </Control>
        <p className="help is-danger">Required</p>
      </Field.Body>
    </Field>
    <Field isGroupedMultiline isGrouped>
      <Control>
        <Select size="medium" isFullwidth isRounded isLoading>
          <option value="a">A</option>
        </Select>
      </Control>
    </Field>
    <TextArea color="info" size="medium" hasFixedSize isHovered />
    <Checkbox />
    <Radio />
    <Image src="/a.png" size="64x64" isRounded />
    <Loading active color="info" direction="right-to-left" isFullPage />
    <Loading />
    <Divider color="primary" vertical>OR</Divider>
    <Delete size="small" />
  </>
);
