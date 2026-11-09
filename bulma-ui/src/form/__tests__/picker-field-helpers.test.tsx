// Bulma's `.input` sets its own background, font weight, alignment, case and
// family, so a background or text helper on the container around it styles
// nothing in the field (#1469). These hold where each kind of helper lands in
// every form these fields take: the background helpers on the field, the text
// helpers on the inputs and also on a container that something inside it
// takes them from, such as a popover, and the rest on the container, with
// `className`.
import React from 'react';
import { render } from '@testing-library/react';
import { DateInputBase } from '../DateInputBase';
import { TimeInputBase } from '../TimeInputBase';
import { DateTimeInputBase } from '../DateTimeInputBase';
import { DateRangeInputBase } from '../DateRangeInputBase';
import { ColorInputBase } from '../ColorInputBase';
import { PasswordInputBase } from '../PasswordInputBase';
import { ConfigProvider } from '../../helpers/Config';

type Props = Record<string, unknown>;
interface Case {
  render: (props: Props) => React.ReactElement;
  /** The container's own class. */
  container: string;
  /** Whether the container keeps the text helpers in the typed form. */
  rootText: boolean;
  /** Whether it has an inline form, with everything on the container. */
  inline: boolean;
  /** How its native mobile form places them, if it has one. */
  native?: 'all on the input' | 'as typed';
}

const textInputs = (root: Element) =>
  Array.from(root.querySelectorAll('input:not([type="hidden"])'));

const CASES: [string, Case][] = [
  [
    'DateInputBase',
    {
      render: p => <DateInputBase aria-label="Date" {...p} />,
      container: 'dateinput-container',
      rootText: true,
      inline: true,
      native: 'all on the input',
    },
  ],
  [
    'TimeInputBase',
    {
      render: p => <TimeInputBase aria-label="Time" {...p} />,
      container: 'timeinput-container',
      rootText: true,
      inline: true,
      native: 'all on the input',
    },
  ],
  [
    'DateTimeInputBase',
    {
      render: p => <DateTimeInputBase aria-label="When" {...p} />,
      container: 'datetimeinput-container',
      rootText: true,
      inline: true,
      native: 'all on the input',
    },
  ],
  [
    'DateRangeInputBase',
    {
      render: p => <DateRangeInputBase aria-label="Stay" {...p} />,
      container: 'daterangeinput',
      rootText: true,
      inline: true,
      native: 'as typed',
    },
  ],
  [
    'ColorInputBase',
    {
      render: p => <ColorInputBase aria-label="Color" {...p} />,
      container: 'colorinput',
      rootText: true,
      inline: false,
    },
  ],
  [
    'PasswordInputBase',
    {
      render: p => <PasswordInputBase aria-label="Password" {...p} />,
      container: 'password-input-container',
      rootText: false,
      inline: false,
    },
  ],
];

const HELPERS = {
  mt: '3',
  backgroundColor: 'danger',
  backgroundColorShade: '90',
  textWeight: 'bold',
  textSize: '4',
  textSizeMobile: '6',
  textAlign: 'right',
  textTransform: 'uppercase',
  fontFamily: 'monospace',
  viewport: 'desktop',
  displayMobile: 'block',
};
// A shade replaces the plain color's class.
const BACKGROUND = ['has-background-danger-90'];
const TEXT = [
  'has-text-weight-bold',
  'is-size-4-desktop',
  'is-size-6-mobile',
  'has-text-right-desktop',
  'is-uppercase',
  'is-family-monospace',
];
const OTHER = ['mt-3', 'is-block-mobile'];

describe.each(['', 'bestax-'])('with the class prefix "%s"', prefix => {
  const cls = (names: string[]) => names.map(name => prefix + name);
  const renderIn = (ui: React.ReactElement) =>
    render(<ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>);
  const lacks = (el: Element, names: string[]) => {
    for (const name of names) expect(el).not.toHaveClass(name);
  };

  /** Where the typed form, or a form placed as it is, puts each kind. */
  const expectTyped = (container: HTMLElement, c: Case) => {
    const root = container.querySelector(`.${prefix}${c.container}`)!;
    const field = root.querySelector(`.${prefix}input`)!;
    expect(field).toHaveClass(...cls(BACKGROUND));
    lacks(field, [...cls(OTHER), 'custom']);
    expect(textInputs(root).length).toBeGreaterThan(0);
    for (const input of textInputs(root)) {
      expect(input).toHaveClass(...cls(TEXT));
    }
    expect(root).toHaveClass(...cls(OTHER), 'custom');
    lacks(root, cls(BACKGROUND));
    for (const name of cls(TEXT)) {
      expect(root.classList.contains(name)).toBe(c.rootText);
    }
  };

  describe.each(CASES)('%s', (_, c) => {
    const typed = c.native ? { mobileNative: false } : {};

    it('puts the background helpers on the field and the text helpers on its inputs', () => {
      const { container } = renderIn(
        c.render({ ...HELPERS, ...typed, className: 'custom' })
      );
      expectTyped(container, c);
    });

    if (c.inline) {
      it('puts every helper on the container inline', () => {
        const { container } = renderIn(c.render({ ...HELPERS, inline: true }));
        const root = container.querySelector(`.${prefix}${c.container}`)!;
        expect(root).toHaveClass(
          ...cls(BACKGROUND),
          ...cls(TEXT),
          ...cls(OTHER)
        );
      });
    }

    if (c.native === 'all on the input') {
      it('puts every helper on the native input', () => {
        const { container } = renderIn(
          c.render({ ...HELPERS, mobileNative: true })
        );
        expect(container.querySelector('input')).toHaveClass(
          ...cls(BACKGROUND),
          ...cls(TEXT),
          ...cls(OTHER)
        );
      });
    }

    if (c.native === 'as typed') {
      it('places them around the native inputs as it does typed', () => {
        const { container } = renderIn(
          c.render({ ...HELPERS, mobileNative: true, className: 'custom' })
        );
        expect(container.querySelector('input[type="date"]')).not.toBeNull();
        expectTyped(container, c);
      });
    }
  });
});
