// The footer's time row is small text on the panel, and on a row that takes a
// faint fill on hover and focus. axe measured `text-weak` below 4.5:1 on that
// fill in both schemes, and plain `primary` well below it on a dark panel
// (#976). Which token each part reads is the choice that holds the contrast,
// so these compile the real SCSS and check that choice.
import * as sass from 'sass';
import path from 'path';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimeInput } from '../DateTimeInput';

const compile = (file: string) =>
  sass.compile(path.resolve(__dirname, '../../scss', file), {
    loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

let styleEl: HTMLStyleElement;
let sheet: CSSStyleSheet;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = compile('form/_datetimeinput.scss');
  document.head.appendChild(styleEl);
  sheet = styleEl.sheet as CSSStyleSheet;
});

afterAll(() => {
  styleEl.remove();
});

/** The footer's time row: its label, then the pill showing the time. */
function timeRow() {
  render(<DateTimeInput inline defaultValue={new Date(2026, 0, 1, 9, 30)} />);
  const row = screen.getByRole('button', { name: /^Time/ });
  const [label, pill] = Array.from(row.children) as HTMLElement[];
  return { row, label, pill };
}

describe('DateTimeInput footer time row colours', () => {
  it('gives the label `text`, which holds 4.5:1 on the hover and focus fill', () => {
    const { label } = timeRow();
    expect(label).toHaveTextContent('Time');
    expect(getComputedStyle(label).color).toBe('var(--bulma-text)');
  });

  it('gives the pill at rest `primary-on-scheme`, which Bulma fits to the scheme', () => {
    const { pill } = timeRow();
    expect(getComputedStyle(pill).color).toBe('var(--bulma-primary-on-scheme)');
  });

  // jsdom's getComputedStyle can't match :hover or :focus-visible, so this
  // reads the rule itself. The tokens above were chosen against this fill: a
  // darker one can take `text-weak` back under 4.5:1, so a change here means
  // measuring them again.
  it('keeps the hover and focus fill the tokens were measured against', () => {
    const fills = Array.from(sheet.cssRules).filter(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule &&
        /\.datetimeinput-footer-time:(hover|focus-visible)/.test(
          rule.selectorText
        )
    );
    expect(fills.map(rule => rule.selectorText)).toEqual([
      '.datetimeinput-footer-time:hover:not(:disabled), .datetimeinput-footer-time:focus-visible',
    ]);
    expect(fills[0].style.getPropertyValue('background-color')).toBe(
      'hsla(0, 0%, 50%, 0.08)'
    );
  });

  it('keeps the open pill on its primary fill with the matching invert', () => {
    const { row, pill } = timeRow();
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    const style = getComputedStyle(pill);
    expect(style.backgroundColor).toBe('var(--bulma-primary)');
    expect(style.color).toBe('var(--bulma-primary-invert)');
  });
});
