/**
 * Unit-tests the import resolver on the shapes the rule fixtures cannot
 * reach: a default import, a namespaced tag, and attribute values that are
 * not readable strings.
 *
 * Getting this wrong in either direction is bad — a missed import means the
 * rules go quiet on real code, and a false match means linting somebody
 * else's `<Box>` against Bulma's rules.
 */
import { describe, expect, it } from '@jest/globals';
import {
  collectImport,
  emptyImports,
  literalValue,
  resolveElement,
} from '../lib/elements.js';

const jsxId = (name: string) => ({ type: 'JSXIdentifier', name });
const member = (object: unknown, property: string) => ({
  type: 'JSXMemberExpression',
  object,
  property: jsxId(property),
});

describe('collectImport', () => {
  it('ignores imports from any other package', () => {
    const imports = emptyImports();
    collectImport(
      {
        source: { value: 'react' },
        specifiers: [
          {
            type: 'ImportSpecifier',
            local: jsxId('Box'),
            imported: jsxId('Box'),
          },
        ],
      },
      imports
    );
    expect(imports.named.size).toBe(0);
  });

  it('ignores a default specifier, which this package does not have', () => {
    const imports = emptyImports();
    collectImport(
      {
        source: { value: '@allxsmith/bestax-bulma' },
        specifiers: [{ type: 'ImportDefaultSpecifier', local: jsxId('Lib') }],
      },
      imports
    );
    expect(imports.named.size).toBe(0);
    expect(imports.namespaces.size).toBe(0);
  });
});

describe('resolveElement', () => {
  const imports = emptyImports();
  collectImport(
    {
      source: { value: '@allxsmith/bestax-bulma' },
      specifiers: [
        {
          type: 'ImportSpecifier',
          local: jsxId('Box'),
          imported: jsxId('Box'),
        },
        {
          type: 'ImportSpecifier',
          local: jsxId('Surface'),
          imported: jsxId('Card'),
        },
        { type: 'ImportNamespaceSpecifier', local: jsxId('B') },
      ],
    },
    imports
  );

  it('resolves a plain, an aliased and a namespaced element', () => {
    expect(resolveElement(jsxId('Box'), imports)).toBe('Box');
    expect(resolveElement(jsxId('Surface'), imports)).toBe('Card');
    expect(resolveElement(member(jsxId('B'), 'Box'), imports)).toBe('Box');
  });

  it('keeps the compound path, through a namespace too', () => {
    expect(resolveElement(member(jsxId('Box'), 'Header'), imports)).toBe(
      'Box.Header'
    );
    expect(
      resolveElement(member(member(jsxId('B'), 'Navbar'), 'Brand'), imports)
    ).toBe('Navbar.Brand');
  });

  it('returns null for anything it did not see imported', () => {
    expect(resolveElement(jsxId('div'), imports)).toBeNull();
    expect(resolveElement(member(jsxId('Other'), 'Part'), imports)).toBeNull();
    expect(
      resolveElement(
        { type: 'JSXNamespacedName', name: jsxId('rect') },
        imports
      )
    ).toBeNull();
    expect(resolveElement(undefined, imports)).toBeNull();
  });

  it('returns null when a member expression has no readable property', () => {
    expect(
      resolveElement(
        { type: 'JSXMemberExpression', object: jsxId('Box') },
        imports
      )
    ).toBeNull();
  });
});

describe('literalValue', () => {
  it('reads a string literal and a single-part template', () => {
    expect(literalValue({ value: { type: 'Literal', value: 'flex' } })).toBe(
      'flex'
    );
    expect(
      literalValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Literal', value: 'flex' },
        },
      })
    ).toBe('flex');
    expect(
      literalValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'TemplateLiteral',
            quasis: [{ value: { cooked: 'flex' } }],
          },
        },
      })
    ).toBe('flex');
  });

  it('returns null for everything it cannot read as a string', () => {
    // Boolean shorthand: `<Box isFullwidth />`
    expect(literalValue({ value: null })).toBeNull();
    // A number, not a string.
    expect(literalValue({ value: { type: 'Literal', value: 4 } })).toBeNull();
    // An identifier.
    expect(
      literalValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Identifier', name: 'mode' },
        },
      })
    ).toBeNull();
    // A template with an interpolation.
    expect(
      literalValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'TemplateLiteral',
            quasis: [{ value: { cooked: 'a' } }, { value: { cooked: 'b' } }],
          },
        },
      })
    ).toBeNull();
  });
});
