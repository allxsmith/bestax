/**
 * `keepBaseDisplay`: a base `display` a source wrote beside a per-viewport one
 * becomes the class it stood for, since bestax leaves the base `display`'s
 * class out beside a per-viewport display prop. Driven directly, on the props
 * a source has already written, so each branch has a case.
 */

import jscodeshift from 'jscodeshift';
import { keepBaseDisplay } from '../display.js';
import type { TransformContext } from '../jsx-utils.js';

const j = jscodeshift.withParser('tsx');

function run(attrs: string) {
  const root = j(`export const A = (p: any) => <Box ${attrs}>x</Box>;`);
  const rules: string[] = [];
  const ctx = {
    j,
    file: 'case.tsx',
    collector: { add: (entry: { rule: string }) => rules.push(entry.rule) },
    dirty: false,
  } as unknown as TransformContext;
  root.find(j.JSXElement).forEach(path => {
    keepBaseDisplay(ctx, path, path.node);
  });
  const out = root.toSource();
  return { out, rules, dirty: (ctx as { dirty: boolean }).dirty };
}

/** The element's attributes, as written, on one line. */
const attrs = (out: string) =>
  out.slice(out.indexOf('<Box'), out.indexOf('>x')).replace(/\s+/g, ' ').trim();

describe('keepBaseDisplay', () => {
  it('turns a base display beside a per-viewport one into its class, in its place', () => {
    const { out, rules, dirty } = run(
      'display="inline-block" displayDesktop="flex"'
    );
    expect(attrs(out)).toBe(
      '<Box className="is-inline-block" displayDesktop="flex"'
    );
    expect(rules).toEqual([]);
    expect(dirty).toBe(true);
  });

  it('writes none as is-hidden', () => {
    const { out } = run('display="none" displayTablet="block"');
    expect(attrs(out)).toBe('<Box className="is-hidden" displayTablet="block"');
  });

  it('puts the class ahead of a className written as a string, once', () => {
    expect(
      attrs(run('className="card" display="block" displayMobile="flex"').out)
    ).toBe('<Box className="is-block card" displayMobile="flex"');
    expect(
      attrs(
        run('className="is-flex box" display="flex" displayMobile="flex"').out
      )
    ).toBe('<Box className="is-flex box" displayMobile="flex"');
  });

  it('keeps a spread before a className it merges into in the same order', () => {
    expect(
      attrs(
        run('{...p} className="card" display="block" displayMobile="flex"').out
      )
    ).toBe('<Box {...p} className="is-block card" displayMobile="flex"');
  });

  it('moves the flex container props with a flex base when no per-viewport display is flex', () => {
    const { out, rules } = run(
      'display="flex" justifyContent="center" alignItems="end" flexDirection="column" flexWrap="wrap" alignContent="start" alignSelf="center" displayMobile="block"'
    );
    expect(attrs(out)).toBe(
      '<Box className="is-flex is-flex-direction-column is-flex-wrap-wrap is-justify-content-center is-align-content-start is-align-items-end" alignSelf="center" displayMobile="block"'
    );
    expect(rules).toEqual([]);
  });

  it('leaves the container props to a per-viewport flex display', () => {
    const { out } = run(
      'display="flex" justifyContent="center" displayTablet="inline-flex"'
    );
    expect(attrs(out)).toBe(
      '<Box className="is-flex" justifyContent="center" displayTablet="inline-flex"'
    );
  });

  it.each([
    [
      'a dynamic per-viewport display',
      'display="flex" justifyContent="center" displayTablet={p.d}',
    ],
    [
      'a dynamic className',
      'className={p.c} display="flex" justifyContent="center" displayMobile="block"',
    ],
    [
      'a dynamic container prop it would move',
      'display="flex" justifyContent={p.j} displayMobile="block"',
    ],
    [
      'a spread and no className',
      '{...p} display="block" displayMobile="flex"',
    ],
  ])('changes nothing and leaves a TODO for %s', (_, written) => {
    const { out, rules } = run(written);
    expect(attrs(out)).toBe(`<Box ${written}`);
    expect(rules).toEqual(['prop:display']);
    expect(out).toContain('TODO(bestax-migrate): bestax leaves `display` out');
  });

  it('names every prop to remove when the className is dynamic', () => {
    const { out } = run(
      'className={p.c} display="flex" justifyContent="center" displayMobile="block"'
    );
    expect(out).toContain(
      'add `is-flex is-justify-content-center` to the dynamic `className` and remove `display`, `justifyContent` by hand'
    );
  });

  it.each([
    ['no per-viewport display', 'display="flex" justifyContent="center"'],
    ['no base display', 'displayMobile="flex"'],
    [
      'a dynamic base display, which its source flags',
      'display={p.d} displayMobile="flex"',
    ],
    [
      'a base value bestax does not take',
      'display="relative" displayMobile="flex"',
    ],
  ])('changes nothing with %s', (_, written) => {
    const { out, rules, dirty } = run(written);
    expect(attrs(out)).toBe(`<Box ${written}`);
    expect(rules).toEqual([]);
    expect(dirty).toBe(false);
  });
});
