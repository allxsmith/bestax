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
import { attributesOf, resolveElement, withImports } from '../lib/elements.js';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'disallow props the library has deprecated',
      url: 'https://bestax.io/docs/guides/getting-started/eslint-plugin#no-deprecated-props',
    },
    schema: [],
    messages: {
      renamed: '`{{prop}}` is deprecated on `{{element}}`. {{note}}',
      retired: '`{{prop}}` is deprecated on `{{element}}`. {{note}}',
    },
  },
  create(context) {
    const { imports, visitor } = withImports();
    return {
      ...visitor,
      JSXOpeningElement(node: unknown) {
        const opening = node as { name: unknown; attributes: unknown[] };
        const element = resolveElement(opening.name, imports);
        if (element === null) return;
        const deprecations = DEPRECATED_PROPS[element];
        if (!deprecations) return;

        const present = new Set(
          attributesOf(opening).map(
            (a: { name: { name: string } }) => a.name.name
          )
        );
        for (const attr of attributesOf(opening)) {
          const prop: string = attr.name.name;
          const info = deprecations[prop];
          if (!info) continue;
          const { replacement, note } = info;
          context.report({
            node: attr.name,
            messageId: replacement ? 'renamed' : 'retired',
            data: { prop, element, note: note ?? '' },
            // Renaming onto a prop the element already sets would silently
            // drop one of the two values, and the library documents which one
            // wins. Leave that for a human.
            fix:
              replacement && !present.has(replacement)
                ? fixer => fixer.replaceText(attr.name, replacement)
                : null,
          });
        }
      },
    };
  },
};

export default rule;
