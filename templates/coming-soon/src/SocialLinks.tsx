import { Button, Buttons, Icon } from '@allxsmith/bestax-bulma';

/**
 * The brand colors come from bulma-social (imported in main.tsx): its
 * `is-facebook`, `is-youtube`, `is-x` and `is-linkedin` modifiers style
 * Bulma's `.button`, which `Button` renders, so they go on it through
 * `className`. Point each `href` at your own page.
 */
const links = [
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

/** The round social buttons under the title. */
function SocialLinks() {
  return (
    <Buttons isCentered>
      {links.map(link => (
        <Button
          key={link.className}
          as="a"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          size="medium"
          className={link.className}
          aria-label={link.label}
        >
          <Icon name={link.icon} variant="brands" features="fa-lg" />
        </Button>
      ))}
    </Buttons>
  );
}

export default SocialLinks;
