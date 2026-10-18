import {
  Box,
  Button,
  Checkbox,
  Control,
  Field,
  Input,
  Title,
} from '@allxsmith/bestax-bulma';
import SocialLogin from './SocialLogin.tsx';

/** The frosted box: the sign-in form and the social login row. */
function LoginForm() {
  return (
    <Box p="6" mb="0" className="glass">
      <Title mb="5" textAlign="centered" textWeight="semibold" textSize="4">
        Please log in to proceed
      </Title>
      {/* The original posts to `#`, which a static host answers with an
          error page. Submitting stays on the page instead, after the
          browser's own checks; send the sign-in from here. */}
      <form onSubmit={event => event.preventDefault()}>
        <Input
          id="email"
          name="email"
          label="Email"
          labelProps={{ className: 'is-sr-only' }}
          size="medium"
          type="email"
          placeholder="Email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          required
          iconLeft={{ name: 'envelope', size: 'medium' }}
        />
        <Input
          id="password"
          name="password"
          label="Password"
          labelProps={{ className: 'is-sr-only' }}
          size="medium"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          iconLeft={{ name: 'lock', size: 'small' }}
        />
        <Field mb="4">
          <Checkbox
            id="remember"
            name="remember"
            color="link"
            textWeight="medium"
          >
            Remember me
          </Checkbox>
        </Field>
        <Field>
          <Control>
            <Button
              type="submit"
              color="info"
              size="medium"
              isFullwidth
              textWeight="normal"
            >
              Login
            </Button>
          </Control>
        </Field>
        <SocialLogin />
      </form>
    </Box>
  );
}

export default LoginForm;
