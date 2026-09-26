import { Button, Control, Field, InputBase, TextAreaBase } from "@allxsmith/bestax-bulma";
export function SignUp() {
  // TODO(bestax-migrate): `.icon` stays as markup: bestax `Icon` renders its own `<i>` and adds an `aria-label`
  // TODO(bestax-migrate): `.select` stays as markup: bestax `Select` renders the `.select` wrapper and the `<select>` together
  // TODO(bestax-migrate): `.checkbox` stays as markup: bestax `Checkbox` renders its own styled markup, not Bulma's
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
          <div className="select">
            <select>
              <option>Select dropdown</option>
            </select>
          </div>
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
    </form>
  );
}
