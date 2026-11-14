import { extractComponentDescription } from 'storybook/internal/docs-tools';

/**
 * A doc comment's prose: the text before its first block tag (`@see`,
 * `@example`, `@param`, ...), which is the text TypeScript reads as the
 * comment.
 *
 * A tag starts where TypeScript starts one: an `@` at the start of a line, or
 * after a space within the line (a tab or a no-break space counts) and before
 * a non-space. An `@` inside a word (an email address) or right after a brace
 * (`{@link ...}`) stays in the text.
 */
export function docblockProse(docblock: string): string {
  const tag = docblock.search(/^[^\S\r\n]*@|[^\S\r\n]@(?=\S)/m);
  return (tag === -1 ? docblock : docblock.slice(0, tag)).trim();
}

/**
 * Storybook's `docs.extractComponentDescription`: the description its docgen
 * gives `component`, which is the whole doc comment, cut to its prose. The
 * docs page printed the tags as text otherwise. A story's own
 * `parameters.docs.description.component` still takes precedence over it.
 */
export function componentDescription(component: unknown): string {
  return docblockProse(extractComponentDescription(component));
}
