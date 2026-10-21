import { Button, Control, Field, InputBase, SelectBase, TextAreaBase } from "@allxsmith/bestax-bulma";

export default function FormsPage() {
  // TODO(bestax-migrate): `.checkbox` stays as markup: bestax `Checkbox` renders its own styled markup, not Bulma's (forms.html:27)
  return (
    <form action="/contact" method="post">
      <Field>
        <label className="label" htmlFor="name">Name</label>
        <Control>
          <InputBase
            id="name"
            name="name"
            type="text"
            defaultValue="Jane"
            maxLength={40}
            required />
        </Control>
      </Field>
      <Field>
        <label className="label" htmlFor="topic">Topic</label>
        <Control>
          <SelectBase id="topic" name="topic" defaultValue="Support">
            <option>Sales</option>
            <option>Support</option>
          </SelectBase>
        </Control>
      </Field>
      <Field>
        <label className="label" htmlFor="message">Message</label>
        <Control>
          <TextAreaBase
            id="message"
            name="message"
            rows={4}
            placeholder="Say hello"
            defaultValue="Hi there" />
        </Control>
      </Field>
      <Field>
        <Control>
          <label className="checkbox"><input type="checkbox" name="terms" defaultChecked /> I agree</label>
        </Control>
      </Field>
      <Field grouped>
        <Control>
          <Button color="link" type="submit">Send</Button>
        </Control>
        <Control>
          <Button color="link" isLight type="reset">Cancel</Button>
        </Control>
      </Field>
    </form>
  );
}
