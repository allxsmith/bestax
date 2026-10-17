/**
 * The display tables answer to Bulma's own stylesheet, the copy bestax-bulma
 * depends on, in both directions: every rule an element's own tag and
 * classes decide is in a table with the display it sets, and every entry is
 * such a rule. Every rule that reaches an element some other way is named
 * here with why the tables leave it out, so a Bulma release that adds one
 * fails this until someone decides what it means for the converter.
 */

import {
  COMPONENT_DISPLAY,
  HELPER_DISPLAY,
} from '../src/sources/bulma-classes/display.js';
import {
  bulmaStylesheet,
  stylesheetRules,
} from './support/bulma-stylesheet.js';

/** One element: a tag or none, its classes, and any it must not have. */
const ELEMENT = /^[a-z]*(?:\.[\w-]+)+(?::not\(\.[\w-]+\))*$/;

/**
 * Bulma's reset gives these tags the display the browser already gives
 * them, so a tag's own display holds on a Bulma page as well.
 */
const TAG_RULES: Record<string, string> = {
  article: 'block',
  aside: 'block',
  figure: 'block',
  footer: 'block',
  header: 'block',
  hgroup: 'block',
  section: 'block',
  hr: 'block',
};

/**
 * Rules that reach an element through an ancestor, or in a state
 * (`:hover`), neither of which its own tag and classes show.
 */
const BY_CONTEXT = [
  '.select select',
  '.content figure:not([class]) img',
  '.image img',
  '.file.has-name.is-empty .file-name',
  '.breadcrumb a',
  '.breadcrumb li',
  '.breadcrumb ul',
  '.breadcrumb ol',
  '.dropdown.is-active .dropdown-menu',
  '.dropdown.is-hoverable:hover .dropdown-menu',
  '.menu-list a',
  '.menu-list button',
  '.menu-list .menu-item',
  '.navbar > .container',
  '.navbar-burger span',
  '.navbar-brand .navbar-item',
  '.navbar-tabs .navbar-item',
  '.navbar-item.is-active .navbar-dropdown',
  '.navbar-item.is-hoverable:focus .navbar-dropdown',
  '.navbar-item.is-hoverable:focus-within .navbar-dropdown',
  '.navbar-item.is-hoverable:hover .navbar-dropdown',
  '.navbar.is-spaced .navbar-dropdown',
  '.tabs a',
  '.tabs li',
  '.tabs ul',
  '.hero.is-halfheight .hero-body',
  '.hero.is-fullheight .hero-body',
  '.hero.is-fullheight-with-navbar .hero-body',
  '.hero-buttons .button',
  '.level img',
  '.level.is-mobile .level-left',
  '.level.is-mobile .level-right',
  '.media .media',
];

/** A rule's `display`, the last one where it declares more than one. */
function declaredDisplay(
  body: string
): { value: string; important: boolean } | undefined {
  let declared: { value: string; important: boolean } | undefined;
  for (const declaration of body.split(';')) {
    const match = /^\s*display\s*:\s*(.*?)\s*(!important)?\s*$/.exec(
      declaration
    );
    if (match) declared = { value: match[1], important: !!match[2] };
  }
  return declared;
}

/** A selector list's selectors, split where no parenthesis is open. */
function selectorsOf(list: string): string[] {
  const selectors = [''];
  let depth = 0;
  for (const char of list) {
    if (char === ',' && depth === 0) {
      selectors.push('');
      continue;
    }
    if (char === '(') depth++;
    if (char === ')') depth--;
    selectors[selectors.length - 1] += char;
  }
  return selectors.map(selector => selector.trim().replace(/\s+/g, ' '));
}

interface Found {
  /** The display outside media queries, from the last rule to set one. */
  base?: string;
  /** The displays media queries give it. */
  readonly media: Set<string>;
}

function readStylesheet() {
  // Keyed by importance as well, since an `!important` rule and a plain one
  // for the same selector would belong in different tables.
  const elements = new Map<string, Found>();
  const tags = new Map<string, string>();
  const context = new Set<string>();
  for (const rule of stylesheetRules(bulmaStylesheet())) {
    const declared = declaredDisplay(rule.body);
    if (!declared) continue;
    for (const selector of selectorsOf(rule.selector)) {
      // A pseudo-element is no element of the page's.
      if (selector.includes('::')) continue;
      if (ELEMENT.test(selector)) {
        const key = `${declared.important ? '!' : ''}${selector}`;
        const found = elements.get(key) ?? { media: new Set<string>() };
        if (rule.conditional) found.media.add(declared.value);
        else found.base = declared.value;
        elements.set(key, found);
      } else if (/^[a-z]+$/.test(selector) && !rule.conditional) {
        tags.set(selector, declared.value);
      } else {
        context.add(selector);
      }
    }
  }
  return { elements, tags, context };
}

/** The table the stylesheet's element rules of one importance make. */
function expectedTable(
  elements: Map<string, Found>,
  important: boolean
): Record<string, unknown> {
  const table: Record<string, unknown> = {};
  for (const [key, { base, media }] of elements) {
    if (key.startsWith('!') !== important) continue;
    const changes = [...media].filter(value => value !== base);
    table[key.replace(/^!/, '')] =
      changes.length === 0
        ? base
        : {
            ...(base === undefined ? {} : { base }),
            // More than one is a shape the table can't hold yet, and fails.
            media: changes.length === 1 ? changes[0] : changes,
          };
  }
  return table;
}

describe("the display tables answer to Bulma's stylesheet", () => {
  const { elements, tags, context } = readStylesheet();

  it('finds the rules it reads', () => {
    expect(elements.get('.button')?.base).toBe('inline-flex');
    expect(elements.get('!.is-flex')?.base).toBe('flex');
  });

  it('holds every component rule an element decides by itself, and no other', () => {
    expect(COMPONENT_DISPLAY).toEqual(expectedTable(elements, false));
  });

  it('holds every display helper, at every viewport and at each one', () => {
    expect(HELPER_DISPLAY).toEqual(expectedTable(elements, true));
  });

  it("restates the browser's display wherever a rule names a tag alone", () => {
    expect(Object.fromEntries(tags)).toEqual(TAG_RULES);
  });

  it('names every rule that reaches an element some other way', () => {
    expect([...context].sort()).toEqual([...BY_CONTEXT].sort());
  });
});
