import React from "react";
import { Button, Control, Field, Fieldset, Input, Label } from "rbx";

export const Profile = ({ saving }: { saving: boolean }) => (
  <form>
    <Fieldset disabled={saving}>
      <Field>
        <Label>Name</Label>
        <Control>
          <Input type="text" />
        </Control>
      </Field>
    </Fieldset>
    <Fieldset disabled textAlign="centered">
      <Button>Save</Button>
    </Fieldset>
    <Fieldset>
      <Field>
        <Control>
          <Input type="email" />
        </Control>
      </Field>
    </Fieldset>
  </form>
);
