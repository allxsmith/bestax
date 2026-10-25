import {
  Box,
  Button,
  Buttons,
  Checkbox,
  Control,
  Field,
  Icon,
  Input,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

// bestax has no brand-colored buttons, so bulma-social's classes color them.
const socialLogins = [
  {
    name: 'Facebook',
    className: 'is-facebook',
    href: 'https://facebook.com',
    icon: 'facebook-f',
  },
  {
    name: 'Twitter',
    className: 'is-twitter',
    href: 'https://twitter.com',
    icon: 'twitter',
  },
  {
    name: 'GitHub',
    className: 'is-github',
    href: 'https://github.com/aldi',
    icon: 'github',
  },
];

function LoginForm() {
  return (
    <Box p="6" mb="0" className="glass">
      <Title textSize="4" mb="5" textAlign="centered" textWeight="semibold">
        Please log in to proceed
      </Title>
      {/* There is no server to post to: the browser checks the required
          fields, and the sign-in itself goes here. */}
      <form onSubmit={event => event.preventDefault()}>
        <Input
          id="email"
          name="email"
          type="email"
          size="medium"
          placeholder="Email"
          label="Email"
          labelProps={{ className: 'is-sr-only' }}
          iconLeftName="envelope"
          iconLeftSize="medium"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          size="medium"
          placeholder="Password"
          label="Password"
          labelProps={{ className: 'is-sr-only' }}
          iconLeftName="lock"
          iconLeftSize="small"
          autoComplete="current-password"
          required
        />
        <Field mb="4">
          <Checkbox id="remember" name="remember" textWeight="medium">
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
        <SubTitle
          as="p"
          size="6"
          mt="5"
          mb="3"
          textAlign="centered"
          textWeight="semibold"
        >
          Login using social media
        </SubTitle>
        <Buttons isCentered>
          {socialLogins.map(social => (
            <Button
              key={social.name}
              as="a"
              size="medium"
              className={social.className}
              href={social.href}
              aria-label={`Login with ${social.name}`}
            >
              <Icon name={social.icon} variant="brands" features="fa-lg" />
            </Button>
          ))}
        </Buttons>
      </form>
    </Box>
  );
}

export default LoginForm;
