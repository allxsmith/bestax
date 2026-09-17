/**
 * Tests the prose parsing in gen-eslint-meta.mjs, which nothing else reaches.
 *
 * `replacementFrom` turns the library's own deprecation note into the ESLint
 * autofix, so a note it reads wrongly becomes a wrong edit to someone's
 * source. It sits outside jest's `roots` and its output file is excluded from
 * coverage, which is exactly why it needs a sibling test here.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { guardViolations, replacementFrom } from './gen-eslint-meta.mjs';

describe('replacementFrom', () => {
  it('reads the single-replacement form the renames use', () => {
    assert.equal(
      replacementFrom(
        'Use `isFullwidth` instead — `isFullwidth` wins if both are set.'
      ),
      'isFullwidth'
    );
    assert.equal(replacementFrom('Use `name` instead.'), 'name');
    assert.equal(
      replacementFrom(
        'Use `gapMobile` instead — `gapMobile` wins if both are set.'
      ),
      'gapMobile'
    );
  });

  it('declines a dotted name, which no prop can be called', () => {
    // This was pinned the other way round, as if a compound path were a valid
    // replacement. It is the one shape that can never be a legal JSX
    // attribute name, so writing it produces a file that does not parse:
    // `--fix` on `<Tabs tab='a' />` emitted `<Tabs Tabs.Tab='a' />`.
    // The library really does carry such a note, on Tabs.Item, and it escaped
    // only because "with an" sits between the backtick and "instead".
    assert.equal(replacementFrom('Use `Tabs.Tab` instead.'), null);
    assert.equal(
      replacementFrom('Use `Tabs.Tab` with an `index` prop instead.'),
      null
    );
  });

  it('declines a note naming more than one replacement', () => {
    // Icon.libraryFeatures. There is no single prop to rewrite to, so no fix
    // can be offered — but the rule must still call it a deprecation rather
    // than a prop that was retired for never having worked.
    assert.equal(
      replacementFrom('Use `variant` and `features` instead.'),
      null
    );
  });

  it('declines a note that does not open with the rename form', () => {
    assert.equal(
      replacementFrom(
        'No `.tabs.is-<color>` CSS exists; the prop renders unstyled and will be removed in the next major version.'
      ),
      null
    );
    assert.equal(
      replacementFrom(
        "Bulma's `.tags` wraps by default — this prop has never had a visual effect."
      ),
      null
    );
    // Prose that merely mentions a prop later must not be mistaken for it.
    assert.equal(
      replacementFrom('Deprecated; prefer `isFullwidth` going forward.'),
      null
    );
  });

  it('is total over the inputs a missing or malformed note can take', () => {
    assert.equal(replacementFrom(undefined), null);
    assert.equal(replacementFrom(null), null);
    assert.equal(replacementFrom(''), null);
    assert.equal(replacementFrom('Use `` instead.'), null);
  });
});

describe('guardViolations', () => {
  // Synthetic input on purpose. `collect()` reads the real library, so on the
  // happy path every one of these guards is unreachable — which is how each
  // could have been deleted with the generator, its staleness gate, `pnpm all`
  // and this suite all staying green.
  const ok = () => ({
    deprecated: new Map([
      ['Button', new Map([['isFullWidth', { replacement: 'isFullwidth' }]])],
    ]),
    textAlias: new Set(['Box', 'Card', 'Content']),
    knownProps: new Map([
      ['Button', new Set(['isFullWidth', 'isFullwidth'])],
      ['Box', new Set(['color', 'textColor'])],
      ['Card', new Set(['color', 'textColor'])],
      ['Content', new Set(['color', 'textColor'])],
    ]),
  });

  it('passes a well-formed table', () => {
    assert.deepEqual(guardViolations(ok()), []);
  });

  it('refuses an empty deprecation table', () => {
    const c = ok();
    c.deprecated = new Map();
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /no deprecated props found/);
  });

  it('refuses an empty text-alias set, and names the anchors too', () => {
    const c = ok();
    c.textAlias = new Set();
    const v = guardViolations(c);
    // Both the emptiness guard and the anchor guard fire, which is why they
    // are collected rather than thrown one at a time.
    assert.equal(v.length, 2);
    assert.match(v.join('\n'), /no text-alias color props found/);
    assert.match(v.join('\n'), /Box, Card, Content no longer match/);
  });

  it('refuses a replacement the element does not declare', () => {
    const c = ok();
    c.knownProps.set('Button', new Set(['isFullWidth']));
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Button\.isFullWidth says its replacement/);
    assert.match(v[0], /would corrupt a consumer's source/);
  });

  it('allows a deprecation with no replacement', () => {
    const c = ok();
    c.deprecated = new Map([
      ['Tags', new Map([['isMultiline', { replacement: null }]])],
    ]);
    c.knownProps.set('Tags', new Set(['isMultiline']));
    assert.deepEqual(guardViolations(c), []);
  });

  it('refuses a text-alias element that does not declare textColor', () => {
    const c = ok();
    c.knownProps.set('Card', new Set(['color']));
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Card is in the text-alias set/);
  });

  it('refuses a dropped anchor, and says matches for one', () => {
    const c = ok();
    c.textAlias = new Set(['Box', 'Card']);
    const v = guardViolations(c);
    assert.equal(v.length, 1);
    assert.match(v[0], /Content no longer matches/);
  });

  it('reports every violation at once rather than the first', () => {
    const c = ok();
    c.knownProps.set('Button', new Set(['isFullWidth']));
    c.knownProps.set('Box', new Set(['color']));
    assert.equal(guardViolations(c).length, 2);
  });
});
