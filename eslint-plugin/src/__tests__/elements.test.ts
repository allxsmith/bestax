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
  collectRequire,
  emptyImports,
  isKnownNonNullish,
  isTrueValue,
  isUnreadableValue,
  literalValue,
  namedAttr,
  numericValue,
  patternBinds,
  resolveElement,
} from '../lib/elements.js';

const jsxId = (name: string) => ({ type: 'JSXIdentifier', name });
const member = (object: unknown, property: string) => ({
  type: 'JSXMemberExpression',
  object,
  property: jsxId(property),
});

describe('collectRequire', () => {
  // A destructuring pattern binds plain Identifiers, not JSXIdentifiers.
  const id = (name: string) => ({ type: 'Identifier', name });
  const req = (target: unknown, arg = '@allxsmith/bestax-bulma') => ({
    id: target,
    init: {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'require' },
      arguments: [{ type: 'Literal', value: arg }],
    },
  });

  it('reads the destructured, aliased and namespace forms', () => {
    const imports = emptyImports();
    collectRequire(
      req({
        type: 'ObjectPattern',
        properties: [
          { type: 'Property', key: id('Box'), value: id('Box') },
          { type: 'Property', key: id('Card'), value: id('Surface') },
        ],
      }),
      imports
    );
    collectRequire(req(id('B')), imports);
    expect(imports.named.get('Box')).toBe('Box');
    expect(imports.named.get('Surface')).toBe('Card');
    expect(imports.namespaces.has('B')).toBe(true);
  });

  it('ignores a require of anything else, and a rest element', () => {
    const imports = emptyImports();
    collectRequire(req(id('x'), 'react'), imports);
    collectRequire(
      req({
        type: 'ObjectPattern',
        properties: [{ type: 'RestElement', argument: id('rest') }],
      }),
      imports
    );
    expect(imports.named.size).toBe(0);
    expect(imports.namespaces.size).toBe(0);
  });

  it('ignores a declarator that is not a require call at all', () => {
    const imports = emptyImports();
    collectRequire(
      { id: id('x'), init: { type: 'Literal', value: 1 } },
      imports
    );
    collectRequire({ id: id('x') }, imports);
    expect(imports.named.size + imports.namespaces.size).toBe(0);
  });
});

describe('patternBinds', () => {
  const id = (name: string) => ({ type: 'Identifier', name });

  it('finds the name through every destructuring shape', () => {
    expect(patternBinds(id('require'), 'require')).toBe(true);
    expect(
      patternBinds(
        {
          type: 'ObjectPattern',
          properties: [{ type: 'Property', value: id('require') }],
        },
        'require'
      )
    ).toBe(true);
    expect(
      patternBinds(
        { type: 'ArrayPattern', elements: [id('require')] },
        'require'
      )
    ).toBe(true);
    expect(
      patternBinds(
        { type: 'AssignmentPattern', left: id('require') },
        'require'
      )
    ).toBe(true);
    expect(
      patternBinds(
        {
          type: 'ObjectPattern',
          properties: [{ type: 'RestElement', argument: id('require') }],
        },
        'require'
      )
    ).toBe(true);
  });

  it('says no for anything that does not bind it', () => {
    expect(patternBinds(id('other'), 'require')).toBe(false);
    expect(
      patternBinds({ type: 'ObjectPattern', properties: [] }, 'require')
    ).toBe(false);
    expect(patternBinds({ type: 'ArrayPattern' }, 'require')).toBe(false);
    expect(patternBinds({ type: 'Literal', value: 1 }, 'require')).toBe(false);
    expect(patternBinds(null, 'require')).toBe(false);
  });
});

describe('namedAttr', () => {
  const attr = (name: string, v: string) => ({
    name: { name },
    value: { type: 'Literal', value: v },
  });

  it('returns the LAST match, the way JSX resolves duplicates', () => {
    const attrs = [attr('color', 'primary'), attr('color', 'danger')];
    expect(literalValue(namedAttr(attrs, 'color'))).toBe('danger');
    expect(namedAttr(attrs, 'absent')).toBeUndefined();
    expect(namedAttr([], 'color')).toBeUndefined();
  });
});

describe('isUnreadableValue', () => {
  it('separates genuinely unknown from readable but wrong', () => {
    // Readable: a bare attribute, and every literal type.
    expect(isUnreadableValue({ value: null })).toBe(false);
    expect(isUnreadableValue({ value: { type: 'Literal', value: '4' } })).toBe(
      false
    );
    for (const v of [true, false, 2, null]) {
      expect(
        isUnreadableValue({
          value: {
            type: 'JSXExpressionContainer',
            expression: { type: 'Literal', value: v },
          },
        })
      ).toBe(false);
    }
    // Unknown: an identifier, an interpolated template, and an attribute
    // whose value is a JSX element rather than a container — legal JSX, and
    // the one input that reaches the predicate's final return.
    expect(
      isUnreadableValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Identifier', name: 'mode' },
        },
      })
    ).toBe(true);
    expect(
      isUnreadableValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'TemplateLiteral',
            quasis: [{ value: { cooked: 'a' } }, { value: { cooked: 'b' } }],
          },
        },
      })
    ).toBe(true);
    expect(isUnreadableValue({ value: { type: 'JSXElement' } })).toBe(true);
  });
});

describe('isKnownNonNullish', () => {
  const inContainer = (value: unknown) => ({
    value: {
      type: 'JSXExpressionContainer',
      expression: { type: 'Literal', value },
    },
  });

  it('is the predicate a guard in front of a `??` needs', () => {
    // `color: textColor ?? color` — only a non-nullish textColor wins.
    expect(isKnownNonNullish({ value: null })).toBe(true);
    expect(isKnownNonNullish({ value: { type: 'Literal', value: 'x' } })).toBe(
      true
    );
    expect(isKnownNonNullish(inContainer(true))).toBe(true);
    expect(isKnownNonNullish(inContainer(0))).toBe(true);
    // A readable null is readable and still nullish, which is the whole point.
    expect(isKnownNonNullish(inContainer(null))).toBe(false);
    // Unreadable is not knowably anything.
    expect(
      isKnownNonNullish({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Identifier', name: 'undefined' },
        },
      })
    ).toBe(false);
  });
});

describe('isTrueValue', () => {
  it('accepts both spellings of true and nothing else', () => {
    expect(isTrueValue({ value: null })).toBe(true);
    expect(isTrueValue({})).toBe(true);
    expect(
      isTrueValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Literal', value: true },
        },
      })
    ).toBe(true);
    expect(
      isTrueValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Literal', value: false },
        },
      })
    ).toBe(false);
    expect(isTrueValue({ value: { type: 'Literal', value: '4' } })).toBe(false);
    expect(
      isTrueValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Identifier', name: 'flag' },
        },
      })
    ).toBe(false);
  });
});

describe('numericValue', () => {
  it('reads a number in an expression container, and nothing else', () => {
    expect(
      numericValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Literal', value: 2 },
        },
      })
    ).toBe(2);
    // A string literal is literalValue's job, not this one.
    expect(numericValue({ value: { type: 'Literal', value: '2' } })).toBeNull();
    expect(
      numericValue({
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Identifier', name: 'n' },
        },
      })
    ).toBeNull();
    expect(numericValue({ value: null })).toBeNull();
  });
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
