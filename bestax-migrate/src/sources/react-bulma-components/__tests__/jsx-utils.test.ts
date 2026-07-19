import jscodeshift from 'jscodeshift';
import {
  attributesOf,
  buildJsxName,
  findAttr,
  jsxNameParts,
  literalValueOf,
  makeAttr,
  plainElement,
  removeAttr,
} from '../jsx-utils.js';

const j = jscodeshift.withParser('tsx');

function firstElement(source: string) {
  const root = j(source);
  return root.find(j.JSXElement).paths()[0].node;
}

describe('jsxNameParts / buildJsxName', () => {
  it('flattens identifiers and member chains', () => {
    expect(
      jsxNameParts(firstElement('<Button />;').openingElement.name)
    ).toEqual(['Button']);
    expect(
      jsxNameParts(firstElement('<Card.Footer.Item />;').openingElement.name)
    ).toEqual(['Card', 'Footer', 'Item']);
  });

  it('returns null for namespaced names', () => {
    expect(
      jsxNameParts(firstElement('<svg:rect />;').openingElement.name)
    ).toBeNull();
  });

  it('round-trips through buildJsxName', () => {
    const name = buildJsxName(j, 'Modal.Card.Head');
    expect(jsxNameParts(name)).toEqual(['Modal', 'Card', 'Head']);
  });
});

describe('attribute helpers', () => {
  it('reads literal attribute values of each kind', () => {
    const el = firstElement('<X a="s" b={4} c={true} d={cond} e />;');
    expect(literalValueOf(findAttr(el, 'a'))).toEqual({
      kind: 'string',
      value: 's',
    });
    expect(literalValueOf(findAttr(el, 'b'))).toEqual({
      kind: 'number',
      value: 4,
    });
    expect(literalValueOf(findAttr(el, 'c'))).toEqual({
      kind: 'boolean',
      value: true,
    });
    expect(literalValueOf(findAttr(el, 'd'))).toEqual({ kind: 'expression' });
    expect(literalValueOf(findAttr(el, 'e'))).toEqual({
      kind: 'boolean',
      value: true,
    });
  });

  it('treats string-in-braces as a string literal', () => {
    const el = firstElement('<X a={"s"} />;');
    expect(literalValueOf(findAttr(el, 'a'))).toEqual({
      kind: 'string',
      value: 's',
    });
  });

  it('ignores spread attributes and removes named ones', () => {
    const el = firstElement('<X {...rest} a="1" />;');
    expect(attributesOf(el)).toHaveLength(1);
    removeAttr(el, findAttr(el, 'a'));
    expect(findAttr(el, 'a')).toBeUndefined();
  });
});

describe('plainElement / makeAttr', () => {
  it('builds a self-closing element with a className', () => {
    const el = plainElement(
      j,
      'p',
      'help is-danger',
      [makeAttr(j, 'id', 'x')],
      [],
      true
    );
    const printed = j(j.expressionStatement(el)).toSource();
    expect(printed).toContain('<p className="help is-danger" id="x" />');
  });

  it('builds a wrapping element around children', () => {
    const child = firstElement('<a href="/">x</a>;');
    const el = plainElement(j, 'li', 'is-active', [], [child]);
    const printed = j(j.expressionStatement(el)).toSource();
    expect(printed).toContain(
      '<li className="is-active"><a href="/">x</a></li>'
    );
  });
});
