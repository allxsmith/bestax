import {
  Button,
  Control,
  Field,
  Icon,
  InputBase,
} from '@allxsmith/bestax-bulma';

/** The email signup: an input and its button, joined as Bulma addons. */
function NotifyForm() {
  return (
    // The original posts to `/subscribe`, which a static host answers with
    // an error page. Submitting stays on the page instead, after the
    // browser's own checks; send the address to your list from here.
    <form onSubmit={event => event.preventDefault()}>
      <Field hasAddons="centered">
        <Control iconLeft={{ name: 'envelope', size: 'medium' }}>
          <label htmlFor="emailInput" className="is-sr-only">
            Email address
          </label>
          <InputBase
            id="emailInput"
            size="medium"
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="Email"
            required
          />
        </Control>
        <Control>
          <Button type="submit" color="info" size="medium">
            <Icon name="bell" variant="regular" />
            <span>Notify me</span>
          </Button>
        </Control>
      </Field>
    </form>
  );
}

export default NotifyForm;
