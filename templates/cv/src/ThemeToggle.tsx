import { Button, Icon } from '@allxsmith/bestax-bulma';
import type { ColorMode } from './colorMode.ts';

interface ThemeToggleProps {
  mode: ColorMode;
  onToggle: () => void;
}

/**
 * The light and dark switch in the corner. It keeps one name, "Dark mode",
 * and says whether dark mode is on through `aria-pressed`; the moon and the
 * sun are decoration, so `Icon` hides them.
 */
function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
  const dark = mode === 'dark';
  return (
    <Button
      color="ghost"
      isRounded
      className="theme-toggle-btn"
      aria-label="Dark mode"
      aria-pressed={dark}
      onClick={onToggle}
    >
      <Icon name={dark ? 'sun' : 'moon'} size="medium" features="fa-lg" />
    </Button>
  );
}

export default ThemeToggle;
