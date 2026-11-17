// Bulma draws a modal card with no border, and forced colors (Windows' contrast
// themes) paints its backgrounds and the backdrop in the system's Canvas, so
// the card loses its edge there. `_modal.scss` draws it an outline in
// CanvasText inside `@media (forced-colors: active)`, and `_dialog.scss` does
// the same for a Dialog's box (#1891). jsdom evaluates no media query, so
// these compile the partials, with no prefix and under one, read the
// forced-colors rules off the sheet, and check their selectors land on what
// Modal and Dialog render. They also read Bulma's own modal module, to check
// one class outranks it wherever the two stylesheets load.
import * as sass from 'sass';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { Modal } from '../Modal';
import { Dialog } from '../Dialog';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string, partial: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use '${partial}';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const FORCED = '@media (forced-colors: active)';

/**
 * Every style rule in `css`, each with the at-rules around it, outermost
 * first, as their heads read.
 */
function rulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: { rule: CSSStyleRule; within: string }[] = [];
  const walk = (list: CSSRuleList, heads: string[]) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        out.push({ rule, within: heads.join(' ') });
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, [
          ...heads,
          rule.cssText.split('{')[0].trim(),
        ]);
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules, []);
  } finally {
    sheet.remove();
  }
  return out;
}

/** The value `selector`'s rules in `within` give `property`, the last winning. */
const valueOf = (
  css: string,
  selector: string,
  property: string,
  within = ''
) =>
  rulesOf(css)
    .filter(r => r.within === within && r.rule.selectorText === selector)
    .map(r => r.rule.style.getPropertyValue(property).trim().toLowerCase())
    .filter(Boolean)
    .pop();

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the forced-colors edge with %s', (_label, prefix) => {
  const card = `.${prefix}modal-card`;
  const box = `.${prefix}dialog`;

  describe('a modal card', () => {
    const css = compile(prefix, 'components/modal');

    it('draws the card an outline in the system’s text color, in forced colors only', () => {
      expect(valueOf(css, card, 'outline', FORCED)).toBe(
        '1px solid canvastext'
      );
      expect(rulesOf(css).filter(r => r.within !== FORCED)).toEqual([]);
    });

    it('needs no more than one class, since Bulma sets no outline on the card', () => {
      const bulma = compile(prefix, 'bulma/sass/components/modal');
      const outlined = rulesOf(bulma).filter(
        r =>
          r.rule.selectorText.split(',').some(part => part.trim() === card) &&
          r.rule.style.getPropertyValue('outline') !== ''
      );
      expect(outlined).toEqual([]);
    });

    it.each([
      [
        'the props form',
        <Modal key="props" active modalCardTitle="Edit profile">
          Body
        </Modal>,
      ],
      [
        'the compound form',
        <Modal key="parts" active aria-label="Edit profile">
          <Modal.Card>
            <Modal.Card.Body>Body</Modal.Card.Body>
          </Modal.Card>
        </Modal>,
      ],
    ])('lands on the card %s renders', (_form, modal) => {
      render(<ConfigProvider classPrefix={prefix}>{modal}</ConfigProvider>);
      const dialog = screen.getByRole('dialog', { name: 'Edit profile' });
      expect(dialog.querySelector(card)).not.toBeNull();
    });
  });

  describe('a Dialog', () => {
    const css = compile(prefix, 'components/dialog');

    it('draws the box an outline in the system’s text color inside it, in place of its own none', () => {
      expect(valueOf(css, box, 'outline')).toBe('none');
      expect(valueOf(css, box, 'outline', FORCED)).toBe('1px solid canvastext');
      expect(valueOf(css, box, 'outline-offset', FORCED)).toBe('-1px');
      // The forced-colors rule comes after the one that turns it off, so it
      // wins in the same sheet.
      const order = rulesOf(css)
        .filter(r => r.rule.selectorText === box)
        .filter(r => r.rule.style.getPropertyValue('outline') !== '')
        .map(r => r.within);
      expect(order).toEqual(['', FORCED]);
    });

    it('lands on the alertdialog a Dialog renders', () => {
      render(
        <ConfigProvider classPrefix={prefix}>
          <Dialog isOpen title="Delete file?" message="Gone for good." />
        </ConfigProvider>
      );
      expect(
        screen.getByRole('alertdialog', { name: 'Delete file?' }).matches(box)
      ).toBe(true);
    });
  });
});
