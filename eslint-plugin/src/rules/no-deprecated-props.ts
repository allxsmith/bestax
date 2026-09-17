/**
 * Report props the library marks `@deprecated`, and fix the renames.
 *
 * The table is generated from the library's own TSDoc, so a rename lands here
 * with the next `pnpm gen` rather than needing to be noticed. Two shapes come
 * out of it: a rename, which carries the replacement in its note and is
 * autofixable, and a prop that was retired outright (it emits a class no
 * shipped CSS matches, or never had an effect), which is reported with the
 * library's reason and no fix.
 */
import type { Rule } from 'eslint';
import { DEPRECATED_PROPS } from '../generated/metadata.js';
import type { Deprecation } from '../generated/metadata.js';
import {
  winningAttributes,
  elementOf,
  hasSpread,
  withImports,
} from '../lib/elements.js';

/**
 * Renames whose fix is withheld because the two props do not share a value
 * grammar, so swapping the name silently changes what renders.
 *
 * `icon` is the case: the library space-splits it and keeps only the LAST
 * segment as the glyph ("Only its last segment is read", its own TSDoc says),
 * while `name` is never split. So `icon="material-symbols-outlined home"`
 * renders the `home` ligature and `name="material-symbols-outlined home"`
 * renders that string as literal text. The deprecation is still reported; only
 * the edit is left to a human.
 *
 * Declared rather than inferred: nothing in the generated note says whether
 * two props read their value the same way.
 */
const VALUE_GRAMMAR_DIFFERS = new Set(['icon']);

/**
 * Own-property reads only. The keys come from the user's source, so a plain
 * `table[name]` resolves `Object.prototype` members: `<Icon valueOf="x" />`
 * found `Object.prototype.valueOf`, passed the truthiness check, and reported
 * a deprecation with an empty note.
 */
const own = <T>(
  obj: Readonly<Record<string, T>>,
  key: string
): T | undefined => (Object.hasOwn(obj, key) ? obj[key] : undefined);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'disallow props the library has deprecated',
      url: 'https://bestax.io/docs/guides/getting-started/eslint-plugin#no-deprecated-props',
    },
    schema: [],
    // One message, because there was only ever one. `renamed` and `retired`
    // carried identical text, and the split mislabelled anything whose note
    // names more than one replacement: `Icon.libraryFeatures` says "Use
    // `variant` and `features` instead", which parses to no single
    // replacement and so was reported as retired — documented as meaning the
    // prop never had an effect, which is false for it. Whether a fix is
    // offered is the only real difference, and that is visible in the fix.
    messages: {
      deprecated: '`{{prop}}` is deprecated on `{{element}}`. {{note}}',
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const opening = node as { name: unknown; attributes: unknown[] };
        const element = elementOf(context, opening, imports);
        if (element === null) return;
        const deprecations = own(DEPRECATED_PROPS, element);
        if (!deprecations) return;

        const attrs = winningAttributes(opening);
        const written = new Set(
          attrs.map((a: { name: { name: string } }) => a.name.name)
        );
        // Two deprecated props on one element can rename to the same target,
        // and the library picks between them in a fixed order: Tabs resolves
        // `isFullwidth ?? isFullWidth ?? fullwidth`. Renaming the one that
        // happens to come first in the source promotes it past the one that
        // was winning, so `<Tabs fullwidth isFullWidth={false} />` (not
        // fullwidth) became `<Tabs isFullwidth isFullWidth={false} />`
        // (fullwidth). Whichever way it is resolved, the author has to decide,
        // so no fix is offered to any of them.
        const contested = new Set<string>();
        const seen = new Set<string>();
        for (const a of attrs) {
          const target = own(deprecations, a.name.name)?.replacement;
          if (!target) continue;
          if (seen.has(target)) contested.add(target);
          seen.add(target);
        }
        // A spread can hold the replacement, and renaming onto it would let
        // the explicit attribute shadow a value the author meant to keep.
        // Report, but leave the edit to a human.
        const spread = hasSpread(opening);
        // Two deprecated props on one element can rename to the SAME target:
        // Tabs deprecates both `isFullWidth` and `fullwidth` in favour of
        // `isFullwidth`. Fixing both produced `<Tabs isFullwidth isFullwidth>`,
        // which is a duplicate JSX attribute and does not compile.
        const claimed = new Set<string>();

        for (const attr of attrs) {
          const prop: string = attr.name.name;
          const info: Deprecation | undefined = own(deprecations, prop);
          if (!info) continue;
          const { replacement, note } = info;
          const fixable =
            replacement !== null &&
            !spread &&
            !written.has(replacement) &&
            !claimed.has(replacement) &&
            !contested.has(replacement) &&
            !VALUE_GRAMMAR_DIFFERS.has(prop);
          if (fixable) claimed.add(replacement);
          context.report({
            node: attr.name,
            messageId: 'deprecated',
            data: { prop, element, note: note ?? '' },
            fix: fixable
              ? fixer => fixer.replaceText(attr.name, replacement)
              : null,
          });
        }
      },
    };
  },
};

export default rule;
