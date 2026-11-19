import React from "react";
import { Button, Control, Field, Fieldset, Input } from "@allxsmith/bestax-bulma";

export const Profile = ({ saving }: { saving: boolean }) => (
  <form>
    <Fieldset disabled={saving} variant="unstyled">
      <Field>
        <label className="label">Name</label>
        <Control>
          <Input type="text" />
        </Control>
      </Field>
    </Fieldset>
    <Fieldset disabled textAlign="centered" variant="unstyled">
      <Button>Save</Button>
    </Fieldset>
    <Fieldset variant="unstyled">
      <Field>
        <Control>
          <Input type="email" />
        </Control>
      </Field>
    </Fieldset>
  </form>
);
