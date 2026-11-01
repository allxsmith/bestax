import React from "react";
import { Control, Field, Fieldset, Input } from "rbx";

// bestax's Fieldset starts its own Field scope, so inside a Field or a
// Control it stays the plain <fieldset> rbx rendered. Around a Field, as in
// the last one, it converts.
export const Nested = ({ saving }: { saving: boolean }) => (
  <>
    <Field>
      <Fieldset disabled={saving}>
        <Input type="text" />
      </Fieldset>
    </Field>
    <Field horizontal>
      <Field.Body>
        <Fieldset disabled>
          <Input type="email" />
        </Fieldset>
      </Field.Body>
    </Field>
    <Control>
      <Fieldset disabled>
        <Input type="password" />
      </Fieldset>
    </Control>
    <Fieldset disabled>
      <Field>
        <Input type="url" />
      </Field>
    </Fieldset>
  </>
);
