import {
  convertAttributes,
  isCustomElement,
  isNumberProp,
  numberLiteral,
  printProp,
} from '../attributes.js';
import {
  childrenOf,
  isElement,
  parseHtml,
  type Element,
  type ParentNode,
} from '../parse.js';

/** The first element with this tag, anywhere in the parsed source. */
function elementIn(source: string, tag: string): Element {
  const visit = (parent: ParentNode): Element | undefined => {
    for (const child of childrenOf(parent).filter(isElement)) {
      if (child.tagName === tag) return child;
      const found = visit(child);
      if (found) return found;
    }
    return undefined;
  };
  const found = visit(parseHtml(source).root);
  if (!found) throw new Error(`no <${tag}> in ${source}`);
  return found;
}

/** The props of an element's attributes, printed. */
function props(source: string, tag: string): string[] {
  return convertAttributes(elementIn(source, tag)).props.map(printProp);
}

function issues(source: string, tag: string) {
  return convertAttributes(elementIn(source, tag)).issues;
}

describe('convertAttributes', () => {
  it('renames attributes the way React spells them', () => {
    expect(
      props(
        '<label class="label" for="email" tabindex="0" accesskey="e" http-equiv="x" accept-charset="utf-8" maxlength="5">x</label>',
        'label'
      )
    ).toEqual([
      'className="label"',
      'htmlFor="email"',
      'tabIndex="0"',
      'accessKey="e"',
      'httpEquiv="x"',
      'acceptCharset="utf-8"',
      'maxLength="5"',
    ]);
  });

  it('keeps every number a string, for the planner to read', () => {
    expect(props('<td colspan="2" rowspan="03">x</td>', 'td')).toEqual([
      'colSpan="2"',
      'rowSpan="03"',
    ]);
  });

  it('writes a boolean attribute bare, whatever its value', () => {
    expect(
      props(
        '<input disabled readonly="readonly" required="false" autofocus="">',
        'input'
      )
    ).toEqual(['disabled', 'readOnly', 'required', 'autoFocus']);
  });

  it('writes a boolean that is also a string bare only when it is on', () => {
    expect(props('<a download href="x.pdf">x</a>', 'a')).toEqual([
      'download',
      'href="x.pdf"',
    ]);
    expect(props('<a download="report.pdf">x</a>', 'a')).toEqual([
      'download="report.pdf"',
    ]);
    expect(props('<div hidden="HIDDEN">x</div>', 'div')).toEqual(['hidden']);
    expect(props('<div hidden="until-found">x</div>', 'div')).toEqual([
      'hidden="until-found"',
    ]);
  });

  it('keeps a booleanish attribute the string it was', () => {
    expect(
      props(
        '<div draggable="true" contenteditable spellcheck="false">x</div>',
        'div'
      )
    ).toEqual(['draggable="true"', 'contentEditable=""', 'spellCheck="false"']);
  });

  it('keeps data-*, aria-* and role as written', () => {
    expect(
      props(
        '<a role="button" aria-label="menu" aria-expanded="false" data-target="navMenu" data-x-y="1">x</a>',
        'a'
      )
    ).toEqual([
      'role="button"',
      'aria-label="menu"',
      'aria-expanded="false"',
      'data-target="navMenu"',
      'data-x-y="1"',
    ]);
  });

  it('keeps an attribute neither table knows, and reports it when TypeScript would refuse it', () => {
    const div = '<div foo="bar" x-data="{ open: false }" vocab="v">x</div>';
    expect(props(div, 'div')).toEqual([
      'foo="bar"',
      'x-data="{ open: false }"',
      'vocab="v"',
    ]);
    expect(issues(div, 'div')).toEqual([
      { kind: 'unknown-attribute', token: 'foo', attribute: 'foo' },
      { kind: 'unknown-attribute', token: 'vocab', attribute: 'vocab' },
    ]);
  });

  it("writes a name React doesn't know with the attribute's own, as a string", () => {
    const td = '<td nowrap valign="top" bgcolor="#fff">x</td>';
    expect(props(`<table><tr>${td}</tr></table>`, 'td')).toEqual([
      'nowrap=""',
      'valign="top"',
      'bgcolor="#fff"',
    ]);
    expect(issues(`<table><tr>${td}</tr></table>`, 'td')).toEqual([
      { kind: 'unknown-attribute', token: 'nowrap', attribute: 'nowrap' },
      { kind: 'unknown-attribute', token: 'valign', attribute: 'valign' },
      { kind: 'unknown-attribute', token: 'bgcolor', attribute: 'bgcolor' },
    ]);
  });

  it('hands an event handler back instead of writing it', () => {
    const button =
      '<button onclick="toggle()" ONMOUSEOVER="x()" one="1">x</button>';
    expect(props(button, 'button')).toEqual([]);
    expect(issues(button, 'button')).toEqual([
      {
        kind: 'event-handler',
        token: 'onclick',
        attribute: 'onclick',
        detail: 'toggle()',
        prop: 'onClick',
      },
      {
        kind: 'event-handler',
        token: 'onmouseover',
        attribute: 'onmouseover',
        detail: 'x()',
        prop: 'onMouseOver',
      },
      {
        kind: 'event-handler',
        token: 'one',
        attribute: 'one',
        detail: '1',
        prop: 'one',
      },
    ]);
  });

  it("hands back a name JSX can't spell", () => {
    const div =
      '<div @click="go" :class="c" x-on:click="go" v-if="a" #ref>x</div>';
    expect(props(div, 'div')).toEqual(['v-if="a"']);
    expect(issues(div, 'div').map(issue => [issue.kind, issue.token])).toEqual([
      ['attribute-name', '@click'],
      ['attribute-name', ':class'],
      ['attribute-name', 'x-on:click'],
      ['attribute-name', '#ref'],
    ]);
  });

  it('hands back a second attribute that would be the same prop', () => {
    const div = '<div class="a" classname="b">x</div>';
    expect(props(div, 'div')).toEqual(['className="a"']);
    expect(issues(div, 'div')).toEqual([
      { kind: 'attribute-name', token: 'classname', attribute: 'classname' },
    ]);
  });

  it('reports a javascript: URL, which React replaces', () => {
    const a = '<a href=" JavaScript:void(0)" data-x="javascript:1">x</a>';
    expect(props(a, 'a')).toEqual([
      'href=" JavaScript:void(0)"',
      'data-x="javascript:1"',
    ]);
    expect(issues(a, 'a')).toEqual([
      { kind: 'javascript-url', token: 'href', attribute: 'href' },
    ]);
  });

  it('writes a style as an object, and reports what it changes', () => {
    const div = '<div style="margin-top: 1rem; color: red !important">x</div>';
    expect(props(div, 'div')).toEqual([
      'style={{ marginTop: "1rem", color: "red" }}',
    ]);
    expect(issues(div, 'div')).toEqual([
      {
        kind: 'style-important',
        token: 'color',
        attribute: 'style',
        detail: 'color: red !important',
      },
    ]);
    const hack = '<div style="display: none; *zoom: 1">x</div>';
    expect(props(hack, 'div')).toEqual(['style={{ display: "none" }}']);
    expect(issues(hack, 'div')).toEqual([
      { kind: 'style', token: 'style', attribute: 'style', detail: '*zoom: 1' },
    ]);
    expect(props('<div style="">x</div>', 'div')).toEqual([]);
  });

  it("gives a typed input's value and any input's checked as defaults", () => {
    expect(props('<input type="email" value="a@b.c">', 'input')).toEqual([
      'type="email"',
      'defaultValue="a@b.c"',
    ]);
    expect(props('<input value="x">', 'input')).toEqual(['defaultValue="x"']);
    expect(
      props('<input type="checkbox" value="yes" checked="checked">', 'input')
    ).toEqual(['type="checkbox"', 'value="yes"', 'defaultChecked']);
    for (const type of [
      'button',
      'submit',
      'reset',
      'hidden',
      'image',
      'radio',
    ]) {
      expect(
        props(`<input type="${type.toUpperCase()}" value="v">`, 'input')
      ).toEqual([`type="${type.toUpperCase()}"`, 'value="v"']);
    }
  });

  it('gives a select the value of its last selected option', () => {
    const select =
      '<select name="s"><option value="1" selected>One</option><optgroup label="g"><option selected>\n  Two  Three\n</option></optgroup></select>';
    expect(props(select, 'select')).toEqual([
      'name="s"',
      'defaultValue="Two Three"',
    ]);
    expect(props(select, 'option')).toEqual(['value="1"']);
  });

  it('gives a multiple select every selected value', () => {
    expect(
      props(
        '<select multiple><option selected>a</option><option>b</option><option value="c" selected>C</option></select>',
        'select'
      )
    ).toEqual(['multiple', 'defaultValue={["a", "c"]}']);
  });

  it('gives a select with nothing selected no default', () => {
    expect(props('<select><option>a</option></select>', 'select')).toEqual([]);
  });

  it('converts a built-in extended with is as the built-in', () => {
    expect(
      props(
        '<button is="fancy-button" class="a" disabled tabindex="0">x</button>',
        'button'
      )
    ).toEqual([
      'is="fancy-button"',
      'className="a"',
      'disabled',
      'tabIndex="0"',
    ]);
    expect(props('<textarea is="x-area">Hello</textarea>', 'textarea')).toEqual(
      ['is="x-area"', 'defaultValue="Hello"']
    );
    expect(props('<input is="x-input" value="v">', 'input')).toEqual([
      'is="x-input"',
      'defaultValue="v"',
    ]);
  });

  it('moves selected onto the select that lists the option, is or not', () => {
    const select =
      '<select is="x-select"><option is="x-option" selected>a</option><option>b</option></select>';
    expect(props(select, 'select')).toEqual([
      'is="x-select"',
      'defaultValue="a"',
    ]);
    expect(props(select, 'option')).toEqual(['is="x-option"']);
  });

  it('keeps selected on an option outside a select', () => {
    expect(
      props(
        '<datalist><option selected value="a"></option></datalist>',
        'option'
      )
    ).toEqual(['selected', 'value="a"']);
  });

  it('gives a textarea its text as its default', () => {
    expect(
      props(
        '<textarea rows="3">\nfirst\n  &lt;second&gt;</textarea>',
        'textarea'
      )
    ).toEqual(['rows="3"', 'defaultValue={"first\\n  <second>"}']);
    expect(props('<textarea></textarea>', 'textarea')).toEqual([]);
  });

  it("keeps a custom element's attributes as written, but for class", () => {
    const element =
      '<my-widget class="x" some-prop="1" tabindex="0" disabled for="y" style="color: red" onclick="f()"></my-widget>';
    expect(props(element, 'my-widget')).toEqual([
      'className="x"',
      'some-prop="1"',
      'tabindex="0"',
      'disabled=""',
      'for="y"',
      'style={{ color: "red" }}',
    ]);
    expect(issues(element, 'my-widget').map(issue => issue.kind)).toEqual([
      'event-handler',
    ]);
  });

  it('reads SVG attributes with their SVG names', () => {
    expect(
      props(
        '<svg viewbox="0 0 1 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon" focusable="false"><use xlink:href="#a"></use></svg>',
        'svg'
      )
    ).toEqual([
      'viewBox="0 0 1 1"',
      'xmlns="http://www.w3.org/2000/svg"',
      'xmlnsXlink="http://www.w3.org/1999/xlink"',
      'className="icon"',
      'focusable="false"',
    ]);
    expect(props('<svg><use xlink:href="#a"></use></svg>', 'use')).toEqual([
      'xlinkHref="#a"',
    ]);
    expect(
      props(
        '<svg><path stroke-width="2" stroke-linecap="round" fill-rule="evenodd" stroke-dasharray="1 2" xml:space="preserve"></path></svg>',
        'path'
      )
    ).toEqual([
      'strokeWidth="2"',
      'strokeLinecap="round"',
      'fillRule="evenodd"',
      'strokeDasharray="1 2"',
      'xmlSpace="preserve"',
    ]);
  });

  it("doesn't report MathML's attributes as unknown", () => {
    expect(issues('<math><mi mathvariant="bold">x</mi></math>', 'mi')).toEqual(
      []
    );
  });
});

describe('printProp', () => {
  it('writes each kind of value', () => {
    expect(
      printProp({ name: 'disabled', value: true, attribute: 'disabled' })
    ).toBe('disabled');
    expect(
      printProp({ name: 'title', value: 'say "hi"', attribute: 'title' })
    ).toBe('title={"say \\"hi\\""}');
    expect(
      printProp({
        name: 'style',
        value: { expression: '{ a: "b" }' },
        attribute: 'style',
      })
    ).toBe('style={{ a: "b" }}');
  });
});

describe('isCustomElement', () => {
  it('is an HTML tag with a dash, and not a built-in extended with is', () => {
    expect(isCustomElement(elementIn('<my-el></my-el>', 'my-el'))).toBe(true);
    expect(
      isCustomElement(
        elementIn('<button is="fancy-button"></button>', 'button')
      )
    ).toBe(false);
    expect(isCustomElement(elementIn('<button></button>', 'button'))).toBe(
      false
    );
    expect(
      isCustomElement(
        elementIn('<svg><font-face></font-face></svg>', 'font-face')
      )
    ).toBe(false);
  });
});

describe('isNumberProp and numberLiteral', () => {
  it('knows which props take a number', () => {
    expect(isNumberProp('tabIndex')).toBe(true);
    expect(isNumberProp('colSpan')).toBe(true);
    expect(isNumberProp('aria-valuenow')).toBe(true);
    expect(isNumberProp('className')).toBe(false);
    expect(isNumberProp('strokeMiterlimit', 'svg')).toBe(true);
    expect(isNumberProp('width', 'svg')).toBe(false);
  });

  it('writes a number only when it is spelled the way it renders', () => {
    expect(numberLiteral('0')).toBe('0');
    expect(numberLiteral('-1')).toBe('-1');
    expect(numberLiteral('1.5')).toBe('1.5');
    for (const value of [
      '040',
      '1.50',
      ' 4',
      '4 ',
      '-0',
      '1e3',
      '.5',
      '',
      'x',
    ]) {
      expect(numberLiteral(value)).toBeNull();
    }
  });
});
