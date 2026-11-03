import { moveFocusOut } from '../moveFocusOut';

/** A part that's hiding with a link in it, a target and a fallback. */
function setUp() {
  document.body.innerHTML = `
    <nav id="fallback">
      <a id="target" href="#t">Target</a>
      <span id="plain">No link</span>
      <ul id="part"><li><a id="inside" href="#i">Inside</a></li></ul>
    </nav>
    <a id="outside" href="#o">Outside</a>`;
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  return {
    part: $('part'),
    inside: $('inside'),
    target: $('target'),
    plain: $('plain'),
    fallback: $('fallback'),
    outside: $('outside'),
  };
}

describe('moveFocusOut', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('moves focus from a hiding part to the target', () => {
    const { part, inside, target, fallback } = setUp();
    inside.focus();
    moveFocusOut([part], target, fallback);
    expect(target).toHaveFocus();
    expect(fallback).not.toHaveAttribute('tabindex');
  });

  it('leaves focus that isn’t in a hiding part alone', () => {
    const { part, target, fallback, outside } = setUp();
    outside.focus();
    moveFocusOut([part], target, fallback);
    expect(outside).toHaveFocus();
  });

  it('falls back when the target can’t take focus, with a tabindex until focus leaves', () => {
    const { part, inside, plain, fallback, outside } = setUp();
    inside.focus();
    moveFocusOut([part], plain, fallback);
    expect(fallback).toHaveFocus();
    expect(fallback).toHaveAttribute('tabindex', '-1');
    outside.focus();
    expect(fallback).not.toHaveAttribute('tabindex');
  });

  it('keeps a fallback’s own tabindex', () => {
    const { part, inside, fallback, outside } = setUp();
    fallback.setAttribute('tabindex', '0');
    inside.focus();
    moveFocusOut([part], null, fallback);
    expect(fallback).toHaveFocus();
    outside.focus();
    expect(fallback).toHaveAttribute('tabindex', '0');
  });

  it('does nothing more with no fallback', () => {
    const { part, inside, plain } = setUp();
    inside.focus();
    moveFocusOut([part], plain, null);
    expect(inside).toHaveFocus();
  });
});
