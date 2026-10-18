/**
 * Rule ids for what the HTML input reports: the parts of a page a component
 * can't carry, and what the converter couldn't write as it was.
 *
 * A page is the app's own text, as its class strings are, so an id carries
 * only fixed names, never a URL, a title, a class of the app's or a line of
 * its code: `kind:token`, the token from a closed vocabulary per kind (a tag
 * the HTML spec names, an event attribute from `property-information`'s
 * table, one of parse5's error codes, one of the names here). A token outside
 * it is dropped and the id is the bare kind, as `ruleId` does, so a gap costs
 * detail and never a telemetry event: the worker takes an id of up to 64
 * characters, and an id that would be longer is the bare kind too.
 *
 * Apart from `rules.ts` because none of it is about a Bulma class: the
 * planner's vocabulary is the class map's, and this one is the page's.
 */

import { ErrorCodes } from 'parse5';
import { html } from 'property-information';

/** The classes Bulma reads on `<html>` or `<body>` to pad for a navbar. */
export const NAVBAR_FIXED_CLASSES: readonly string[] = [
  'has-navbar-fixed-top',
  'has-navbar-fixed-top-desktop',
  'has-navbar-fixed-top-touch',
  'has-navbar-fixed-bottom',
  'has-navbar-fixed-bottom-desktop',
  'has-navbar-fixed-bottom-touch',
  'has-spaced-navbar-fixed-top',
  'has-spaced-navbar-fixed-bottom',
];

/** Bulma's classes that set a light or dark scheme on what they're on. */
export const THEME_CLASSES: readonly string[] = ['theme-dark', 'theme-light'];

/** The patterns an inline script is checked for, each with its own recipe. */
export const SCRIPT_PATTERNS: readonly string[] = [
  'burger',
  'carousel',
  'dismiss',
  'json-ld',
  'modal',
  'theme',
];

/** Every HTML event-handler attribute, as written (`onclick`). */
const EVENT_ATTRIBUTES: readonly string[] = Object.values(html.property)
  .map(info => info.attribute)
  .filter(attribute => /^on[a-z]+$/.test(attribute));

const VOCABULARY: Readonly<Record<string, ReadonlySet<string>>> = {
  'html-head': new Set(['title', 'meta', 'link', 'style', 'base']),
  // Reported at the kind level until the asset vocabulary lands.
  'html-asset': new Set(),
  'html-script': new Set(SCRIPT_PATTERNS),
  'html-document': new Set([
    ...NAVBAR_FIXED_CLASSES,
    ...THEME_CLASSES,
    'class',
    'data-theme',
    'dir',
    'id',
    'lang',
    'style',
  ]),
  'html-event': new Set(EVENT_ATTRIBUTES),
  'html-element': new Set([
    'conditional-comment',
    'custom',
    'name',
    'obsolete',
    'template',
    'unknown',
  ]),
  'html-url': new Set(['javascript', 'missing', 'relative']),
  'html-attr': new Set(['important', 'name', 'style', 'unknown']),
  'html-parse': new Set(Object.values(ErrorCodes)),
  'html-file': new Set(['exists', 'not-included', 'template-syntax']),
};

export const HTML_KINDS: ReadonlySet<string> = new Set(Object.keys(VOCABULARY));

/** The longest rule id the telemetry worker takes. */
const MAX_RULE_LENGTH = 64;

/** Whether a token is one an id of this kind may carry. */
export function inHtmlVocabulary(kind: string, token: string): boolean {
  return VOCABULARY[kind]?.has(token) ?? false;
}

export function htmlRuleId(kind: string, token?: string): string {
  if (!HTML_KINDS.has(kind)) {
    throw new Error(`not an HTML rule kind: ${kind}`);
  }
  if (token === undefined || !inHtmlVocabulary(kind, token)) return kind;
  const id = `${kind}:${token}`;
  return id.length <= MAX_RULE_LENGTH ? id : kind;
}
