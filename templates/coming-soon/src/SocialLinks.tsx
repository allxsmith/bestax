import { Button, Buttons, Icon } from '@allxsmith/bestax-bulma';

/**
 * The brand colors come from bulma-social (imported in main.tsx): its
 * `is-facebook`, `is-youtube`, `is-x` and `is-linkedin` modifiers style
 * Bulma's `.button`, which `Button` renders, so they go on it through
 * `className`. Point each link at your own page.
 */
const networks = [
  {
    label: 'Follow on Facebook',
    className: 'is-facebook',
    href: 'https://www.facebook.com/your-page',
    icon: 'facebook-f',
  },
  {
    label: 'Subscribe to YouTube',
    className: 'is-youtube',
    href: 'https://www.youtube.com/@your-channel',
    icon: 'youtube',
  },
  {
    label: 'Follow on X',
    className: 'is-x',
    href: 'https://x.com/your-handle',
    icon: 'x-twitter',
  },
  {
    label: 'Connect on LinkedIn',
    className: 'is-linkedin',
    href: 'https://www.linkedin.com/company/your-company',
    icon: 'linkedin-in',
  },
];

function SocialLinks() {
  return (
    <Buttons isCentered>
      {networks.map(network => (
        <Button
          key={network.className}
          as="a"
          size="medium"
          className={network.className}
          href={network.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={network.label}
        >
          <Icon name={network.icon} variant="brands" features="fa-lg" />
        </Button>
      ))}
    </Buttons>
  );
}

export default SocialLinks;
