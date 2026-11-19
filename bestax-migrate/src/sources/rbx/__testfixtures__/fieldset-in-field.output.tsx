import React from "react";
import { Control, Field, Fieldset, Input } from "@allxsmith/bestax-bulma";

// bestax's Fieldset starts its own Field scope, so inside a Field or a
// Control it stays the plain <fieldset> rbx rendered. Around a Field, as in
// the last one, it converts.
export const Nested = ({ saving }: { saving: boolean }) => (
  <>
    <Field>
      <fieldset disabled={saving}>
        <Input type="text" />
      </fieldset>
    </Field>
    <Field horizontal>
      <Field.Body>
        <fieldset disabled>
          <Input type="email" />
        </fieldset>
      </Field.Body>
    </Field>
    <Control>
      <fieldset disabled>
        <Input type="password" />
      </fieldset>
    </Control>
    <Fieldset disabled variant="unstyled">
      <Field>
        <Input type="url" />
      </Field>
    </Fieldset>
  </>
);
