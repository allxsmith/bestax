import {
  Button,
  Control,
  Field,
  Icon,
  InputBase,
} from '@allxsmith/bestax-bulma';

/** The email field and its button, joined as addons. */
function SignupForm() {
  return (
    // The original posts to `/subscribe`, which a static host answers with an
    // error page. Submitting stays on the page instead, after the browser's
    // own checks; send the address to your mailing list from here.
    <form onSubmit={event => event.preventDefault()}>
      {/* A label inside the addons row would sit in it beside the controls,
          so the outer Field holds it, hidden as the original's is. */}
      <Field
        label="Email address"
        labelProps={{ htmlFor: 'email', className: 'is-sr-only' }}
      >
        <Field hasAddons="centered">
          <Control hasIconsLeft iconLeft={{ name: 'envelope', size: 'medium' }}>
            <InputBase
              id="email"
              name="email"
              size="medium"
              type="email"
              placeholder="Email"
              autoComplete="email"
              spellCheck={false}
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
      </Field>
    </form>
  );
}

export default SignupForm;
