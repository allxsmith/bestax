import {
  jsxAttributes,
  type HtmlNote,
  type JsxAttribute,
} from '../attributes.js';
import { defaultTreeAdapter } from 'parse5';
import { isElement, NS, parseHtml, type HtmlElement } from '../parse.js';

/** The first element in a partial whose tag is `tag`. */
function find(source: string, tag: string): HtmlElement {
  const walk = (nodes: readonly object[]): HtmlElement | undefined => {
    for (const node of nodes as HtmlElement[]) {
      if (!isElement(node)) continue;
      if (node.tagName === tag) return node;
      const inner = walk(node.childNodes);
      if (inner) return inner;
    }
    return undefined;
  };
  return walk(parseHtml(source, 'fragment').body.childNodes)!;
}

/** The props and notes for the first `tag` in a partial. */
function props(
  source: string,
  tag = /^<([\w-]+)/.exec(source)![1]
): { props: Record<string, JsxAttribute['value']>; notes: HtmlNote[] } {
  const notes: HtmlNote[] = [];
  const attributes = jsxAttributes(find(source, tag), note => notes.push(note));
  return {
    props: Object.fromEntries(
      attributes.map(attribute => [attribute.name, attribute.value])
    ),
    notes,
  };
}

const string = (value: string) => ({ kind: 'string', value });
const number = (value: number) => ({ kind: 'number', value });
const TRUE = { kind: 'true' };

/** The reason and text of each note. */
const notesOf = (source: string, tag?: string) =>
  props(source, tag).notes.map(note => [note.reason, note.text]);

describe('jsxAttributes', () => {
  it('names each prop the way property-information and React do', () => {
    expect(
      props(
        '<label for="a" class="  x\n y " accesskey="k" data-test-id="t" aria-label="L" role="note" itemprop="name" foo="bar">'
      ).props
    ).toEqual({
      htmlFor: string('a'),
      className: string('x y'),
      accessKey: string('k'),
      'data-test-id': string('t'),
      'aria-label': string('L'),
      role: string('note'),
      itemProp: string('name'),
      foo: string('bar'),
    });
  });

  it('takes a name it knows only by its exact spelling', () => {
    // `htmlfor` matches the property `htmlFor`, but it is not `for`.
    expect(props('<label htmlfor="a">').props).toEqual({
      htmlfor: string('a'),
    });
  });

  it('writes a boolean bare, whatever its value', () => {
    expect(
      props('<input disabled required="false" readonly="readonly">').props
    ).toEqual({ disabled: TRUE, required: TRUE, readOnly: TRUE });
  });

  it('writes an attribute that is a boolean or a value as either', () => {
    expect(props('<a download>').props).toEqual({ download: TRUE });
    expect(props('<a download="Download">').props).toEqual({ download: TRUE });
    expect(props('<a download="cv.pdf">').props).toEqual({
      download: string('cv.pdf'),
    });
  });

  it('writes a number as one only when React writes it back the same', () => {
    expect(
      props(
        '<table><tr><td colspan="2" rowspan="-1" tabindex="00" width="50%"></td></tr></table>',
        'td'
      ).props
    ).toEqual({
      colSpan: number(2),
      rowSpan: number(-1),
      tabIndex: string('00'),
      width: string('50%'),
    });
    expect(props('<input maxlength="">').props).toEqual({
      maxLength: string(''),
    });
  });

  it('keeps a booleanish attribute as the string written', () => {
    expect(
      props('<div draggable="true" spellcheck="false" contenteditable="">')
        .props
    ).toEqual({
      draggable: string('true'),
      spellCheck: string('false'),
      contentEditable: string(''),
    });
  });

  it("keeps SVG's casing and spells its namespaced attributes React's way", () => {
    expect(
      props(
        '<svg viewbox="0 0 1 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="i"><use xlink:href="#a" stroke-width="2" stroke-linecap="round"></use></svg>'
      ).props
    ).toEqual({
      viewBox: string('0 0 1 1'),
      xmlns: string('http://www.w3.org/2000/svg'),
      xmlnsXlink: string('http://www.w3.org/1999/xlink'),
      className: string('i'),
    });
    expect(
      props(
        '<svg><use xlink:href="#a" stroke-width="2" stroke-linecap="round"></use></svg>',
        'use'
      ).props
    ).toEqual({
      xlinkHref: string('#a'),
      strokeWidth: string('2'),
      strokeLinecap: string('round'),
    });
  });

  it('gives a custom element its attributes as written, but for its class', () => {
    expect(
      props('<my-card class="c" for="x" tabindex="0" some-flag="">').props
    ).toEqual({
      className: string('c'),
      for: string('x'),
      tabindex: string('0'),
      'some-flag': string(''),
    });
  });

  it('writes a style as an object, and reports what it cannot carry', () => {
    const { props: found, notes } = props(
      '<p style="margin-top: 2px; color: red !important; nonsense; color: blue; -ms-transform: none; color: green">'
    );
    expect(found).toEqual({
      style: {
        kind: 'style',
        entries: [
          ['marginTop', '2px'],
          ['color', 'green'],
          ['msTransform', 'none'],
        ],
      },
    });
    expect(notes.map(note => [note.reason, note.text])).toEqual([
      ['style-invalid', 'nonsense'],
      ['style-important', 'color: red !important'],
      ['style-repeated', 'color: blue'],
    ]);
  });

  it('leaves out a style with nothing it can carry', () => {
    expect(props('<p style="">').props).toEqual({});
    expect(props('<p style="color: red !important">').props).toEqual({});
  });

  it("starts a form control's state with defaultValue and defaultChecked", () => {
    expect(props('<input value="a" checked>').props).toEqual({
      defaultValue: string('a'),
      defaultChecked: TRUE,
    });
    expect(props('<input type="EMAIL" value="a">').props).toEqual({
      type: string('EMAIL'),
      defaultValue: string('a'),
    });
  });

  it.each([
    'button',
    'checkbox',
    'hidden',
    'image',
    'radio',
    'reset',
    'submit',
  ])('keeps the value of a %s input, which the user does not type', type => {
    expect(props(`<input type="${type}" value="v">`).props).toEqual({
      type: string(type),
      value: string('v'),
    });
  });

  it('gives a select the value of its last selected option', () => {
    const source =
      '<select name="s"><option selected>  First\n one </option><optgroup label="g"><option value="2" selected>Two</option></optgroup><option>Three</option></select>';
    expect(props(source).props).toEqual({
      name: string('s'),
      defaultValue: string('2'),
    });
    expect(props(source, 'option').props).toEqual({});
  });

  it('gives a multiple select every selected value', () => {
    expect(
      props(
        '<select multiple><option selected>  First\n one </option><option value="2" selected>Two</option><option>3</option></select>'
      ).props
    ).toEqual({
      multiple: TRUE,
      defaultValue: { kind: 'strings', values: ['First one', '2'] },
    });
  });

  it("reads an option's value from its text alone, past anything else in the select", () => {
    expect(
      props(
        '<select><script></script><option selected>a<!-- note -->b</option></select>'
      ).props
    ).toEqual({ defaultValue: string('ab') });
  });

  it('keeps `selected` on an option outside a select', () => {
    expect(
      props(
        '<datalist><option selected value="a"></option></datalist>',
        'option'
      ).props
    ).toEqual({ selected: TRUE, value: string('a') });
    expect(props('<select><option>a</option></select>').props).toEqual({});
  });

  it('gives a textarea its text as its defaultValue', () => {
    expect(props('<textarea rows="2">\n  a\n b </textarea>').props).toEqual({
      rows: number(2),
      defaultValue: string('  a\n b '),
    });
    expect(props('<textarea></textarea>').props).toEqual({});
  });

  it('leaves out what React cannot carry, with a note on each', () => {
    expect(
      notesOf(
        '<a onclick="go()" ONMOUSEOVER="x" href="javascript:void(0)" @click="y" :class="z" x-on:click="w" key="k" ref="r" children="c" title="kept">'
      )
    ).toEqual([
      ['event-handler', 'onclick="go()"'],
      ['event-handler', 'onmouseover="x"'],
      ['javascript-url', 'href="javascript:void(0)"'],
      ['attribute-name', '@click="y"'],
      ['attribute-name', ':class="z"'],
      ['attribute-name', 'x-on:click="w"'],
      ['reserved-name', 'key="k"'],
      ['reserved-name', 'ref="r"'],
      ['reserved-name', 'children="c"'],
    ]);
    expect(props('<textarea value="v">x</textarea>').notes[0].reason).toBe(
      'reserved-name'
    );
    expect(props('<select value="v"></select>').notes[0].reason).toBe(
      'reserved-name'
    );
  });

  it('reads a javascript: URL the way React does', () => {
    const blocked = (url: string) =>
      notesOf(`<a href="${url}">`).map(([reason]) => reason);
    expect(blocked(' \tJaVa\nScRiPt:alert(1)')).toEqual(['javascript-url']);
    expect(blocked('&#1;javascript:x')).toEqual(['javascript-url']);
    expect(blocked('/javascript:x')).toEqual([]);
    expect(blocked('https://x/?javascript:')).toEqual([]);
    expect(
      notesOf(
        '<form action="javascript:x"><button formaction="javascript:y">',
        'button'
      )
    ).toEqual([['javascript-url', 'formaction="javascript:y"']]);
  });

  it('gives each note the line of the attribute it is about', () => {
    const notes = props('<a\n  title="x"\n  onclick="go()">').notes;
    expect(notes.map(note => note.line)).toEqual([3]);
    expect(notes[0].element.tagName).toBe('a');
  });

  it('gives no line for an element built rather than parsed', () => {
    const notes: HtmlNote[] = [];
    jsxAttributes(
      defaultTreeAdapter.createElement('a', NS.HTML, [
        { name: 'onclick', value: 'go()' },
      ]),
      note => notes.push(note)
    );
    expect(notes.map(note => [note.reason, note.line])).toEqual([
      ['event-handler', undefined],
    ]);
  });
});
