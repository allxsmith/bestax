// `color` reaching the wheels as a class says nothing about whether the class
// does anything, which is how it sat dead on them until #701. These compile
// the real partial and read the wheel's computed style, so a colour whose rule
// goes missing, or stops re-pointing the band, fails here.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { TimeInput } from '../TimeInput';

let styleEl: HTMLStyleElement;

beforeAll(() => {
  const result = sass.compile(
    path.resolve(__dirname, '../../scss/form/_timeinput.scss'),
    {
      loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  );
  styleEl = document.createElement('style');
  styleEl.textContent = result.css;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

const colors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

describe('TimeInput wheel colour styles', () => {
  it.each(colors)(
    'points the band and the selected value at %s on each wheel',
    color => {
      const { getAllByRole } = render(
        <TimeInput inline color={color} enableSeconds />
      );
      for (const wheel of getAllByRole('spinbutton')) {
        const style = getComputedStyle(wheel);
        expect(
          style.getPropertyValue('--bulma-timeinput-wheel-selected-bg').trim()
        ).toBe(`var(--bulma-${color})`);
        expect(
          style
            .getPropertyValue('--bulma-timeinput-wheel-selected-color')
            .trim()
        ).toBe(`var(--bulma-${color}-invert)`);
      }
    }
  );

  it('leaves an uncoloured wheel on the inherited default', () => {
    const { getAllByRole } = render(<TimeInput inline />);
    for (const wheel of getAllByRole('spinbutton')) {
      expect(
        getComputedStyle(wheel)
          .getPropertyValue('--bulma-timeinput-wheel-selected-bg')
          .trim()
      ).toBe('');
    }
  });
});
