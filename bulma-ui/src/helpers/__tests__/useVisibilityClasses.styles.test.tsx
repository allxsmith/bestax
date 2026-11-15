// Bulma draws `is-sr-only` with no breakpoint form, and the viewport
// visibility props write `is-sr-only-<breakpoint>` for `'sr-only'`, so
// `scss/helpers/_visibility.scss` draws those. This compiles the partial
// beside Bulma's own visibility helpers and holds each breakpoint's class to
// Bulma's `is-sr-only` declarations, inside the query Bulma gives that
// breakpoint's `is-hidden` class, with and without a class prefix.
import * as sass from 'sass';
import path from 'path';
import { validViewports } from '../bulmaClassHelpers';
import { compileSheet } from '../../__tests__/compile-scss';

const LOAD_PATHS = [
  path.resolve(__dirname, '../../scss'),
  path.resolve(__dirname, '../../../../node_modules'),
];

/** The rules a stylesheet holds, read the way a browser reads it. */
function rulesOf(css: string): CSSRuleList {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const rules = style.sheet!.cssRules;
  style.remove();
  return rules;
}

/** Each declaration a style rule sets, with its priority. */
const declarations = (rule: CSSStyleRule) =>
  Array.from({ length: rule.style.length }, (_, i) => {
    const name = rule.style[i];
    return `${name}: ${rule.style.getPropertyValue(name)} ${rule.style.getPropertyPriority(name)}`;
  }).sort();

/** Whether a style rule's selector list holds `selector`. */
const holds = (rule: CSSRule, selector: string) =>
  rule instanceof CSSStyleRule &&
  rule.selectorText.split(',').some(part => part.trim() === selector);

/** The style rule for `selector`, and the media query it sits in. */
function find(rules: CSSRuleList, selector: string) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      const inner = Array.from(rule.cssRules).find(r => holds(r, selector));
      if (inner) {
        return { rule: inner as CSSStyleRule, media: rule.media.mediaText };
      }
    } else if (holds(rule, selector)) {
      return { rule: rule as CSSStyleRule, media: '' };
    }
  }
  return undefined;
}

describe.each(['', 'bestax-'])(
  'the breakpoint sr-only classes, with class prefix "%s"',
  prefix => {
    const configure = prefix
      ? `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');\n`
      : '';
    const rules = rulesOf(
      sass.compileString(
        `${configure}@use 'bulma/sass/helpers/visibility';\n@use 'helpers/visibility' as bestax-visibility;`,
        { loadPaths: LOAD_PATHS, quietDeps: true, logger: sass.Logger.silent }
      ).css
    );
    const bulmaSrOnly = find(rules, `.${prefix}is-sr-only`)!;

    it.each(validViewports)(
      'draws is-sr-only-%s as Bulma draws is-sr-only, in its breakpoint',
      viewport => {
        const ours = find(rules, `.${prefix}is-sr-only-${viewport}`);
        const hidden = find(rules, `.${prefix}is-hidden-${viewport}`)!;
        expect(ours).toBeDefined();
        expect(ours!.media).toBe(hidden.media);
        expect(ours!.media).not.toBe('');
        expect(declarations(ours!.rule)).toEqual(
          declarations(bulmaSrOnly.rule)
        );
      }
    );
  }
);

it('ships them in bestax.css, extras.css and the prefixed flavor, and not without helpers', () => {
  for (const sheet of ['bestax.scss', 'extras.scss']) {
    expect(
      find(rulesOf(compileSheet(sheet)), '.is-sr-only-tablet')
    ).toBeDefined();
  }
  expect(
    find(
      rulesOf(compileSheet('versions/bestax-prefixed.scss')),
      '.bestax-is-sr-only-tablet'
    )
  ).toBeDefined();
  expect(
    find(
      rulesOf(compileSheet('versions/bestax-no-helpers.scss')),
      '.is-sr-only-tablet'
    )
  ).toBeUndefined();
});
