import { ANCHOR_ONLY_ATTRS, omitAttrs } from '../anchorAttrs';

describe('ANCHOR_ONLY_ATTRS', () => {
  it('names exactly what an <a> adds over any element', () => {
    // Keyed off `AnchorOnlyAttributes`, so a React addition breaks the
    // declaration until it is named — this pins the other direction, that
    // nothing has crept in that every element already has.
    expect(Object.keys(ANCHOR_ONLY_ATTRS).sort()).toEqual([
      'download',
      'href',
      'hrefLang',
      'media',
      'ping',
      'referrerPolicy',
      'target',
      'type',
    ]);
  });

  it('omits `rel`, which React declares on every element', () => {
    expect('rel' in ANCHOR_ONLY_ATTRS).toBe(false);
  });
});

describe('omitAttrs', () => {
  it('drops only the keys named', () => {
    expect(omitAttrs({ href: '/x', title: 't' }, { href: true })).toEqual({
      title: 't',
    });
  });

  it('keeps props that collide with Object.prototype', () => {
    // `key in strip` walked the prototype chain, so these four were dropped
    // although no caller named them. React props are arbitrary strings and a
    // consumer may legitimately pass any of them through a spread.
    const props = {
      toString: 1,
      valueOf: 2,
      constructor: 3,
      hasOwnProperty: 4,
      href: '/x',
    };
    expect(Object.keys(omitAttrs(props, { href: true })).sort()).toEqual([
      'constructor',
      'hasOwnProperty',
      'toString',
      'valueOf',
    ]);
  });

  it('is unaffected by writes to Object.prototype', () => {
    // The amplified form of the same bug: anything polluting the prototype
    // would have started deleting props sharing its keys, in every component.
    const proto = Object.prototype as unknown as Record<string, unknown>;
    proto.id = true;
    try {
      expect(omitAttrs({ id: 'keep-me' }, { href: true })).toEqual({
        id: 'keep-me',
      });
    } finally {
      delete proto.id;
    }
  });

  it('keeps symbol-keyed props', () => {
    // Menu filtered by rest-destructuring before #682, which kept them; an
    // `Object.entries` copy would drop them. React ignores symbols either way, so
    // this is about the refactor moving no output for ANY input rather than about
    // anything rendering.
    const tag = Symbol('tag');
    const out = omitAttrs({ [tag]: 'keep', href: '/x' }, { href: true });
    expect((out as Record<symbol, unknown>)[tag]).toBe('keep');
  });

  it('drops non-enumerable own props, as a spread does', () => {
    // The other half of reading keys through `Reflect.ownKeys`: it reports
    // non-enumerable own props, which rest-destructuring and `Object.entries`
    // both skipped. Copying one out would add a prop the old filters dropped AND
    // publish it as enumerable, so "moves no output" has to hold here too.
    const props = { keep: 1 };
    Object.defineProperty(props, 'hidden', { value: 2, enumerable: false });
    const out = omitAttrs(props, { href: true });
    expect(out).toEqual({ keep: 1 });
    expect(Object.prototype.hasOwnProperty.call(out, 'hidden')).toBe(false);
  });

  it('leaves an empty strip set untouched', () => {
    expect(omitAttrs({ a: 1, b: 2 }, {})).toEqual({ a: 1, b: 2 });
  });
});
