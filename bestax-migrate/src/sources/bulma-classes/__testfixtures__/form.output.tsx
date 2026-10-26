import { Button, Control, Field, InputBase, SelectBase, TextAreaBase } from "@allxsmith/bestax-bulma";
export function SignUp() {
  // TODO(bestax-migrate): bestax `Icon` renders `aria-hidden="true"` when the element does not set it; add it here if that is what you want, then re-run, and this converts to `Icon` with `name="user"`; or, since the `.control` around it has `has-icons-left`, drop this `.icon` and give that `Control` `iconLeft={{ name: "user", size: "small" }}`, which it renders after its children as a `.icon.is-left` around the glyph's <i>, hidden the way `Icon` hides it
  // TODO(bestax-migrate): `.checkbox` stays as markup: bestax `Checkbox` renders its own styled markup, not Bulma's. Write it by hand in place of the element that carries `.checkbox`, Bulma's `<label>` or a bare `<input>`, with the `<input>`'s attributes on it: `id`, `name`, `aria-label` and the rest reach its `<input>`, and a `<label>`'s text is its children. Drive it with `checked` and `onChange`, and add `indeterminate` for a select-all box. Its `className` goes on its `<label>`, which declares the `--bulma-checkbox-*` variables, so set the page's colors with those in a rule for your class beside `.styled-checkbox`. Where the page put `.checkbox` on a bare `<input>`, drop its own rules for that box, since bestax draws its own and `.checkbox` is on its `<label>` now
  return (
    <form>
      <Field>
        <label className="label">Name</label>
        <Control>
          <InputBase type="text" placeholder="Text input" />
        </Control>
      </Field>
      <Field>
        <label className="label">Username</label>
        <Control hasIconsLeft>
          <InputBase
            className="is-success"
            type="text"
            placeholder="Text input"
            defaultValue="bulma"
          />
          <span className="icon is-small is-left">
            <i className="fas fa-user"></i>
          </span>
        </Control>
        <p className="help is-success">This username is available</p>
      </Field>
      <Field>
        <label className="label">Subject</label>
        <Control>
          <SelectBase>
            <option>Select dropdown</option>
          </SelectBase>
        </Control>
      </Field>
      <Field>
        <label className="label">Message</label>
        <Control>
          <TextAreaBase size="small" placeholder="Textarea"></TextAreaBase>
        </Control>
      </Field>
      <Field>
        <Control>
          <label className="checkbox">
            <input type="checkbox" /> I agree
          </label>
        </Control>
      </Field>
      <Field horizontal>
        <Field.Label size="normal">
          <label className="label">From</label>
        </Field.Label>
        <Field.Body>
          <Field>
            <Control as="p" isExpanded>
              <InputBase type="text" placeholder="Name" />
            </Control>
          </Field>
        </Field.Body>
      </Field>
      <Field grouped>
        <Control>
          <Button color="link">Submit</Button>
        </Control>
        <Control>
          <Button color="link" isLight>Cancel</Button>
        </Control>
      </Field>
      <Field hasAddons="centered">
        <Control>
          <InputBase type="email" placeholder="Email" />
        </Control>
        <Control>
          <Button color="info">Notify me</Button>
        </Control>
      </Field>
      <Field grouped="multiline">
        <Control>
          <Button>One</Button>
        </Control>
        <Control>
          <Button>Two</Button>
        </Control>
      </Field>
      <Field className="is-grouped-right">
        <Control>
          <Button>Alone</Button>
        </Control>
      </Field>
    </form>
  );
}
