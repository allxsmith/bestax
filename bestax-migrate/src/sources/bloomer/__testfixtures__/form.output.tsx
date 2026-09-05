import React from "react";
import { Checkbox, Control, Field, Icon, InputBase, Radio, SelectBase, TextAreaBase } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): `hasAddons="fullwidth"` — bestax `Field.hasAddons` takes `true`, "centered" or "right"; Bulma v1 keeps `has-addons-fullwidth`, so use `hasAddons` plus className="has-addons-fullwidth"
// TODO(bestax-migrate): kept the Font Awesome 4 classes on an <i> child, as bloomer rendered them; bestax's optional Font Awesome peer is 6.7+, where many v4 names changed (brand icons moved to `variant="brands"`) — keep FA4 loaded, or switch to `name`/`library`/`variant` (`<Icon name="home" library="fa" variant="solid" />`)
// TODO(bestax-migrate): `isActive` — bestax `Input` has no prop for Bulma's `is-active`; add className="is-active"
export const Form = ({ err }: { err?: string }) => (
  <form>
    <Field horizontal>
      <Field.Label size="normal">
        <label className="label is-small">Name</label>
      </Field.Label>
      <Field.Body>
        <Field grouped="right" hasAddons="fullwidth">
          <Control isExpanded isLoading hasIconsLeft>
            <InputBase color="danger" size="medium" isFocused placeholder="Name" />
            <Icon size="small" className="is-left"><i className="fa fa-user" aria-hidden="true" /></Icon>
          </Control>
          <Control hasIconsLeft hasIconsRight>
            <InputBase type="email" isActive />
          </Control>
          <Control hasIconsLeft hasIconsRight>
            <TextAreaBase size="large" isHovered rows={3} />
          </Control>
        </Field>
        <span className="help is-danger">
          {err}
        </span>
      </Field.Body>
    </Field>
    <Field grouped>
      <Control>
        <SelectBase color="primary" isLoading isFullWidth>
          <option>A</option>
        </SelectBase>
      </Control>
      <Control>
        <Checkbox name="remember"> Remember me</Checkbox>
        <Radio name="answer" value="y"> Yes</Radio>
      </Control>
    </Field>
  </form>
);
