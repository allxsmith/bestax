import { Button, Icon } from '@allxsmith/bestax-bulma';
import type { ColorMode } from './colorMode.ts';

interface ThemeToggleProps {
  mode: ColorMode;
  onChange: (mode: ColorMode) => void;
}

/**
 * The round button in the corner that switches between the light and dark
 * schemes. Its name stays "Dark mode" and `aria-pressed` says whether it is
 * on, while the icon shows a moon in light mode and a sun in dark mode.
 */
function ThemeToggle({ mode, onChange }: ThemeToggleProps) {
  const dark = mode === 'dark';
  return (
    <Button
      color="ghost"
      isRounded
      className="theme-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      onClick={() => onChange(dark ? 'light' : 'dark')}
    >
      <Icon size="medium" name={dark ? 'sun' : 'moon'} features="fa-lg" />
    </Button>
  );
}

export default ThemeToggle;
