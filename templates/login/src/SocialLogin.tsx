import { Button, Buttons, Icon, SubTitle } from '@allxsmith/bestax-bulma';

/**
 * The brand colors come from bulma-social (imported in main.tsx): its
 * `is-facebook`, `is-twitter` and `is-github` modifiers style Bulma's
 * `.button`, which `Button` renders, so they go on it through `className`.
 */
const providers = [
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

function SocialLogin() {
  return (
    <>
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
        {providers.map(provider => (
          <Button
            key={provider.name}
            as="a"
            size="medium"
            className={provider.className}
            href={provider.href}
            aria-label={`Login with ${provider.name}`}
          >
            <Icon name={provider.icon} variant="brands" features="fa-lg" />
          </Button>
        ))}
      </Buttons>
    </>
  );
}

export default SocialLogin;
