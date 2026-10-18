import { Button, Icon } from '@allxsmith/bestax-bulma';

interface ThemeToggleProps {
  /** Whether the dark scheme is on. */
  isDark: boolean;
  /** Switch to the other scheme. */
  onToggle: () => void;
}

/**
 * The light and dark switch in the page's corner: a moon while the page is
 * light, a sun while it is dark. Its name stays "Dark mode" and
 * `aria-pressed` says whether that is on, so a screen reader hears one
 * setting and its state.
 */
function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      color="ghost"
      isRounded
      className="theme-toggle-btn"
      aria-label="Dark mode"
      aria-pressed={isDark}
      onClick={onToggle}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size="medium" features="fa-lg" />
    </Button>
  );
}

export default ThemeToggle;
