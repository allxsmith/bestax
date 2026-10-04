// Where a picker's panel sits comes from _picker-popover.scss, which jsdom
// never loads on its own, so className assertions cannot see it. These
// compile the real partial, plain and under a class prefix, and assert
// computed style instead (pattern: Popover.styles.test.tsx). jsdom leaves
// `var()` unresolved and does no layout, so values are compared as written.
import * as sass from 'sass';
import path from 'path';
import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { ConfigProvider } from '../../helpers/Config';
import type { PickerPosition } from '../_pickerInternals/pickerTypes';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');
const OPTIONS = {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
};

const sheets: HTMLStyleElement[] = [];

beforeAll(() => {
  for (const source of [
    `@use 'form/picker-popover';`,
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
     @use 'form/picker-popover';`,
  ]) {
    const el = document.createElement('style');
    el.textContent = sass.compileString(source, OPTIONS).css;
    document.head.appendChild(el);
    sheets.push(el);
  }
});

afterAll(() => {
  for (const el of sheets) el.remove();
});

type Corner = Exclude<PickerPosition, 'auto'>;
const corners: Corner[] = [
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
];

type PickerProps = { position: Corner; appendToBody: boolean };
const pickers: [string, (props: PickerProps) => ReactElement][] = [
  ['DateInput', props => <DateInput {...props} />],
  ['TimeInput', props => <TimeInput {...props} />],
  ['DateTimeInput', props => <DateTimeInput {...props} />],
];

const prefixes = ['', 'bestax-'];

/** Renders the picker under the prefix, opens it, and returns its panel. */
function openPanel(
  picker: (props: PickerProps) => ReactElement,
  prefix: string,
  props: PickerProps
) {
  render(<ConfigProvider classPrefix={prefix}>{picker(props)}</ConfigProvider>);
  fireEvent.click(screen.getByRole('combobox'));
  const panel = screen.getByRole('dialog');
  expect(panel).toHaveClass(
    `${prefix}picker-popover`,
    `${prefix}is-${props.position}`
  );
  return panel;
}

const offset = 'calc(100% + var(--bulma-picker-popover-offset))';

describe.each(pickers)('%s panel placement', (_name, picker) => {
  describe.each(prefixes)('with class prefix "%s"', prefix => {
    it.each(corners)(
      'places a portaled %s panel by its inline coordinates alone',
      position => {
        const panel = openPanel(picker, prefix, {
          position,
          appendToBody: true,
        });
        expect(panel).toHaveClass(`${prefix}is-portal`);
        expect(panel.parentElement).toBe(document.body);
        const style = getComputedStyle(panel);
        // The positioning hook sets these inline. A corner's own `right` or
        // `bottom` on top of them stretches or collapses the fixed box.
        expect(panel.style.top).not.toBe('');
        expect(panel.style.left).not.toBe('');
        expect({
          position: style.position,
          top: style.top,
          left: style.left,
          right: style.right,
          bottom: style.bottom,
        }).toEqual({
          position: 'fixed',
          top: panel.style.top,
          left: panel.style.left,
          right: 'auto',
          bottom: 'auto',
        });
      }
    );

    it.each<[Corner, string]>([
      ['bottom-left', 'var(--bulma-picker-popover-offset)'],
      ['bottom-right', 'var(--bulma-picker-popover-offset)'],
      ['top-left', 'calc(-1 * var(--bulma-picker-popover-offset))'],
      ['top-right', 'calc(-1 * var(--bulma-picker-popover-offset))'],
    ])(
      'takes the gap of a portaled %s panel from the offset variable',
      (position, marginTop) => {
        // The coordinates are the anchor's edge, so the gap is a margin on
        // the side facing it, negative above, as on Popover. Before, the
        // hook added a fixed 4px and the variable moved only an in-place
        // panel.
        const panel = openPanel(picker, prefix, {
          position,
          appendToBody: true,
        });
        expect(getComputedStyle(panel).marginTop).toBe(marginTop);
      }
    );

    it.each<[Corner, Record<string, string>]>([
      ['bottom-left', { top: offset, left: '0px' }],
      ['bottom-right', { top: offset, right: '0px' }],
      ['top-left', { bottom: offset, left: '0px' }],
      ['top-right', { bottom: offset, right: '0px' }],
    ])('keeps an in-place %s panel on its corner', (position, expected) => {
      const panel = openPanel(picker, prefix, {
        position,
        appendToBody: false,
      });
      expect(panel).not.toHaveClass(`${prefix}is-portal`);
      expect(panel.getAttribute('style') ?? '').toBe('');
      const style = getComputedStyle(panel);
      expect(style.position).toBe('absolute');
      for (const [property, value] of Object.entries(expected)) {
        expect([property, style.getPropertyValue(property)]).toEqual([
          property,
          value,
        ]);
      }
    });
  });
});
