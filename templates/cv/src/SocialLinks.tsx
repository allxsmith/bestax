import { Button, Buttons, Icon } from '@allxsmith/bestax-bulma';

/**
 * The brand colors come from bulma-social (imported in main.tsx): its
 * `is-x`, `is-linkedin` and `is-github` modifiers style Bulma's `.button`,
 * which `Button` renders, so they go on it through `className`. Each link's
 * `aria-label` names it, so its icon is decoration. The addresses are
 * placeholders: point each at your own profile.
 */
const profiles = [
  {
    label: 'Follow on X',
    className: 'is-x',
    href: 'https://x.com/your-handle',
    icon: 'x-twitter',
  },
  {
    label: 'Connect on LinkedIn',
    className: 'is-linkedin',
    href: 'https://www.linkedin.com/in/your-profile',
    icon: 'linkedin-in',
  },
  {
    label: 'My GitHub profile',
    className: 'is-github',
    href: 'https://github.com/your-username',
    icon: 'github',
  },
];

function SocialLinks() {
  return (
    <Buttons>
      {profiles.map(profile => (
        <Button
          key={profile.href}
          as="a"
          size="medium"
          className={`${profile.className} social-button`}
          href={profile.href}
          aria-label={profile.label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name={profile.icon} variant="brands" features="fa-lg" />
        </Button>
      ))}
    </Buttons>
  );
}

export default SocialLinks;
