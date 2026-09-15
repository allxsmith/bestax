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
import { replacementFrom } from './gen-eslint-meta.mjs';

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

  it('reads a dotted replacement, for a compound sub-component', () => {
    assert.equal(replacementFrom('Use `Tabs.Tab` instead.'), 'Tabs.Tab');
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
