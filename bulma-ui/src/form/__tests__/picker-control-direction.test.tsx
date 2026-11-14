// A picker's launcher sits inside its own root, which takes the picker's
// direction, while the calendar or clock icon and the loading spinner are
// Bulma's, placed against the Control around it. These hold the two to the
// same direction when the picker's differs from the page's, as a French
// picker in an Arabic section does.
import React from 'react';
import { render } from '@testing-library/react';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { DateRangeInput } from '../DateRangeInput';
import { LocaleProvider } from '../../helpers/LocaleProvider';

type Props = { locale?: string; dir?: string };
const pickers: [string, (props: Props) => React.ReactElement][] = [
  ['DateInput', p => <DateInput label="Date" mobileNative={false} {...p} />],
  ['TimeInput', p => <TimeInput label="Time" mobileNative={false} {...p} />],
  [
    'DateTimeInput',
    p => <DateTimeInput label="When" mobileNative={false} {...p} />,
  ],
  [
    'DateRangeInput',
    p => <DateRangeInput label="Stay" mobileNative={false} {...p} />,
  ],
];

/** The Control, its icon, and the launcher inside the picker's root. */
const parts = (container: HTMLElement) => ({
  control: container.querySelector('.control') as HTMLElement,
  icon: container.querySelector('.control > .icon.is-left') as HTMLElement,
  launcher: container.querySelector(
    '.dateinput-trigger, .timeinput-trigger, .datetimeinput-trigger'
  ) as HTMLElement,
});

describe.each(pickers)(
  '%s in a section of the other direction',
  (_, picker) => {
    it('puts its icon and its launcher in the direction of its own locale', () => {
      const { container } = render(
        <LocaleProvider locale="ar" dir="rtl">
          {picker({ locale: 'fr' })}
        </LocaleProvider>
      );
      const { control, icon, launcher } = parts(container);
      expect(control).toHaveAttribute('dir', 'ltr');
      // The icon's inline start and the launcher's inline end are then the
      // left and the right, as on a left-to-right page.
      expect(icon.matches(':dir(ltr)')).toBe(true);
      expect(launcher.matches(':dir(ltr)')).toBe(true);
    });

    it('follows a dir passed to it', () => {
      const { container } = render(
        <div dir="rtl">{picker({ dir: 'ltr' })}</div>
      );
      const { icon, launcher } = parts(container);
      expect(icon.matches(':dir(ltr)')).toBe(true);
      expect(launcher.matches(':dir(ltr)')).toBe(true);
    });

    it('leaves the Control to the page when the picker has no direction of its own', () => {
      const { container } = render(
        <LocaleProvider locale="ar" dir="rtl">
          {picker({})}
        </LocaleProvider>
      );
      const { control, icon, launcher } = parts(container);
      expect(control).not.toHaveAttribute('dir');
      expect(icon.matches(':dir(rtl)')).toBe(true);
      expect(launcher.matches(':dir(rtl)')).toBe(true);
    });
  }
);
