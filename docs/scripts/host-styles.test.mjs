/**
 * The scheme rewrite the docs previews run over the library's stylesheets
 * (src/components/ShadowPreview/hostStyles.mjs): bestax.css in every preview,
 * and the prefixed build in a preview whose example imports it. Its patterns
 * match the shape Bulma's scheme variable blocks compile to, so a Bulma, Sass
 * or bestax.scss change that alters that shape would leave them matching
 * nothing, and every preview would follow the reader's OS scheme again with
 * nothing else failing. These cases run the rewrite over each built
 * stylesheet and check it still finds its blocks, and only those.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'vitest';
import { preprocessBulmaStyles } from '../src/components/ShadowPreview/hostStyles.mjs';

/**
 * A built stylesheet, resolved through the library's exports as the docs
 * build resolves it, or an actionable failure.
 */
function builtCss(file) {
  let path = null;
  try {
    path = createRequire(import.meta.url).resolve(
      `@allxsmith/bestax-bulma/dist/${file}`
    );
  } catch {
    // Left null: the assertion below says what to do.
  }
  assert.ok(
    path && existsSync(path),
    `bulma-ui/dist/${file} is absent, so the previews' scheme rewrite ` +
      'cannot be checked against it. Build first, or run `pnpm all`.'
  );
  return readFileSync(path, 'utf8');
}

/** How many times `needle` occurs in `text`. */
function count(text, needle) {
  return text.split(needle).length - 1;
}

describe.each([
  { file: 'bestax.css', prefix: '' },
  { file: 'versions/bestax-prefixed.css', prefix: 'bestax-' },
])("the previews' scheme rewrite over $file", ({ file, prefix }) => {
  const switchSchemeRule = new RegExp(
    `@media\\s*\\(prefers-color-scheme:\\s*light\\)\\s*\\{\\s*\\.${prefix}switch\\s*\\{`
  );

  it('leaves no scheme media query around a rule on the host', () => {
    const css = preprocessBulmaStyles(builtCss(file));
    assert.doesNotMatch(
      css,
      /@media[^{]*prefers-color-scheme[^{]*\{[^{}]*:host/,
      `a prefers-color-scheme block in ${file} still holds a :host rule ` +
        "after the rewrite, so the previews' palette follows the reader's " +
        "OS there. The block's compiled shape no longer matches the " +
        'patterns in hostStyles.mjs.'
    );
  });

  it("moves one block of Bulma's scheme variables per scheme", () => {
    const css = preprocessBulmaStyles(builtCss(file));
    for (const scheme of ['dark', 'light']) {
      assert.equal(
        count(css, `:host(.${scheme})`),
        1,
        `expected exactly one :host(.${scheme}) block after the rewrite`
      );
      assert.match(
        css,
        new RegExp(`:host\\(\\.${scheme}\\) \\{ :host\\s*\\{\\s*--bulma-`),
        `the :host(.${scheme}) block should hold Bulma's scheme variables`
      );
    }
  });

  it("keeps the media query on Switch's light-scheme rule", () => {
    const raw = builtCss(file);
    assert.match(
      raw,
      switchSchemeRule,
      `${file} has no light-scheme .${prefix}switch rule, so this case ` +
        "checks nothing. Point it at another scheme rule of the extras' own."
    );
    assert.match(
      preprocessBulmaStyles(raw),
      switchSchemeRule,
      "the rewrite moved Switch's light-scheme rule onto the host's class, " +
        'so that rule follows the preview rather than the OS, unlike in an app'
    );
  });
});
