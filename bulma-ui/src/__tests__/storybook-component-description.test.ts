/**
 * A component's Storybook docs page shows its doc comment without the block
 * tags (#1642). Storybook's docgen hands over the whole comment, tags
 * included, so `.storybook/preview.ts` cuts it at the first tag, where
 * TypeScript ends the comment's text.
 */
import { readFileSync } from 'fs';
import { join, relative, resolve, sep } from 'path';
import * as ts from 'typescript';
import {
  componentDescription,
  docblockProse,
} from '../../.storybook/componentDescription';
import { sourceFiles } from './sourceFiles';

const SRC = join(__dirname, '..');

/**
 * The text Storybook's docgen (react-docgen) takes from a doc comment: the
 * comment with each line's leading `*` taken off.
 */
const docgenDescription = (comment: string) =>
  comment
    .slice(3, -2)
    .replace(/^[ \t]*\*[ \t]?/gm, '')
    .trim();

/**
 * Each top-level doc comment in `file` (absolute, or relative to `src`): the
 * statement it's on, its docgen text, and TypeScript's text for it.
 */
function docComments(file: string) {
  const sf = ts.createSourceFile(
    file,
    readFileSync(resolve(SRC, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  return sf.statements.flatMap(statement =>
    ts
      .getJSDocCommentsAndTags(statement)
      .filter(ts.isJSDoc)
      .map(doc => ({
        statement,
        docgen: docgenDescription(sf.text.slice(doc.getStart(sf), doc.end)),
        typescript: (ts.getTextOfJSDocComment(doc.comment) ?? '').trim(),
      }))
  );
}

/** The docgen text of the last doc comment on `const name` in `file`. */
function docgenOf(file: string, name: string) {
  const docs = docComments(file).filter(
    ({ statement }) =>
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        d => ts.isIdentifier(d.name) && d.name.text === name
      )
  );
  const doc = docs[docs.length - 1];
  if (!doc) throw new Error(`no doc comment on ${name} in ${file}`);
  return doc.docgen;
}

describe('docblockProse', () => {
  it('keeps the prose before the first tag', () => {
    expect(
      docblockProse(
        'Summary.\n\nMore prose.\n\n@function\n@param {P} props - Props.\n@see {@link https://bulma.io | Bulma}'
      )
    ).toBe('Summary.\n\nMore prose.');
  });

  it('is empty for a comment that is only tags, or empty', () => {
    expect(docblockProse('@function\n@returns {JSX.Element} It.')).toBe('');
    expect(docblockProse('  @internal')).toBe('');
    expect(docblockProse('')).toBe('');
  });

  it('starts a tag where TypeScript does: line start, or after a space', () => {
    expect(docblockProse('Text.\n  @see elsewhere')).toBe('Text.');
    expect(docblockProse('Text. @deprecated use Other')).toBe('Text.');
    expect(docblockProse('Text.\u00a0@see elsewhere')).toBe('Text.');
  });

  it('leaves an @ inside a word or an inline tag in the text', () => {
    expect(docblockProse('Mail me@example.com about it.')).toBe(
      'Mail me@example.com about it.'
    );
    expect(docblockProse('Like {@link Box}, but rounded.')).toBe(
      'Like {@link Box}, but rounded.'
    );
  });
});

describe('componentDescription', () => {
  it('reads the docgen description', () => {
    expect(
      componentDescription({
        __docgenInfo: { description: 'Summary.\n@function' },
      })
    ).toBe('Summary.');
  });

  it('is empty without a docgen description', () => {
    expect(componentDescription(undefined)).toBe('');
    expect(componentDescription(() => null)).toBe('');
    expect(componentDescription({ __docgenInfo: {} })).toBe('');
  });

  it.each([
    // Its tags include an @example of JSX.
    ['helpers/Theme.tsx', 'Theme'],
    // @see with an inline {@link}.
    ['elements/Box.tsx', 'Box'],
    // Two @example blocks and an @see. `Modal` attaches its parts to this.
    ['components/Modal.tsx', 'ModalRoot'],
  ])('shows the prose of %s and none of its tags', (file, name) => {
    const description = docgenOf(file, name);
    const shown = componentDescription({ __docgenInfo: { description } });
    expect(description).toMatch(/^@function$/m);
    expect(shown).not.toBe('');
    expect(shown).not.toMatch(/(^|\s)@\w/);
    expect(description.startsWith(shown)).toBe(true);
  });
});

describe('docblockProse on the library source', () => {
  it('gives the text TypeScript reads as each doc comment', () => {
    const mismatches: Record<string, { page: string; typescript: string }> = {};
    let tagged = 0;
    for (const file of sourceFiles(SRC)) {
      for (const { docgen, typescript } of docComments(file)) {
        if (/^@function$/m.test(docgen)) tagged++;
        const page = docblockProse(docgen);
        if (page !== typescript) {
          const where = relative(SRC, file).split(sep).join('/');
          mismatches[`${where}: ${typescript.slice(0, 40)}`] = {
            page,
            typescript,
          };
        }
      }
    }
    expect(tagged).toBeGreaterThan(0);
    expect(mismatches).toEqual({});
  });
});

describe('.storybook/preview.ts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gives the docs pages componentDescription', async () => {
    // The preview reads the color scheme as it loads, which jsdom can't answer.
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    // A path TypeScript doesn't follow: the preview's stylesheet imports have
    // no types, so `tsconfig.test.json` leaves it out.
    const path = '../../.storybook/preview';
    const preview = (await import(/* @vite-ignore */ path)).default;
    expect(preview.parameters.docs.extractComponentDescription).toBe(
      componentDescription
    );
  });
});
