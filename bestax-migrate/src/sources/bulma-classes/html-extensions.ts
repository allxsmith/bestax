/**
 * A Bulma extension's own markup on a page, which no component converts:
 * the elements bulma-carousel's script makes carousels of, and its
 * `is-covered` class. `html.ts` notes each under `html-extension:<name>`
 * (`EXTENSION_MARKUP` in `html-rules.ts`), beside the `html-asset` note for
 * the extension and the `html-script:carousel` note for its script.
 *
 * Pure. A script is read, never run, so an element is found only through a
 * selector the script writes out as a string, and only in the forms a page
 * names its carousel by: a tag, ids and classes, and a list of those. The
 * page's DOM is searched the way `querySelectorAll` does it, which is what
 * `bulmaCarousel.attach` calls: every element a selector matches becomes a
 * carousel, an id the page repeats included.
 */

import {
  attributeOf,
  classesOf,
  isElement,
  type Element,
  type ParentNode,
} from '../_shared/html/parse.js';

const HTML_NS = 'http://www.w3.org/1999/xhtml';

// ---- What the page's scripts attach bulma-carousel to ------------------------

/**
 * `bulmaCarousel.attach(` with its selector written as a string, the whole
 * argument, without an escape or a substitution, which would make it
 * something else to read.
 */
const ATTACH =
  /\bbulmaCarousel\s*\.\s*attach\s*\(\s*(?:'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\$]*)`)\s*[,)]/g;

/** The selectors a script attaches bulma-carousel to, once each, in order. */
export function carouselSelectors(code: string): string[] {
  const selectors = [...code.matchAll(ATTACH)].map(match =>
    (match[1] ?? match[2] ?? match[3]).trim()
  );
  return [...new Set(selectors.filter(Boolean))];
}

// ---- Matching a selector -----------------------------------------------------

/** A CSS identifier, as a tag, an id or a class writes it. */
const IDENT = String.raw`(?:--|-?[_a-zA-Z\u0080-\uffff])[-\w\u0080-\uffff]*`;

/** A tag (or `*`), then ids and classes, with nothing between them. */
const COMPOUND = new RegExp(String.raw`^(\*|${IDENT})?((?:[#.]${IDENT})*)$`);

interface Compound {
  /** Null for any tag. */
  tag: string | null;
  ids: string[];
  classes: string[];
}

/**
 * A selector list the codemod can match, or null for any other selector
 * (a combinator, an attribute, a pseudo-class), whose matches it can't know.
 */
export function readSelector(selector: string): Compound[] | null {
  const compounds: Compound[] = [];
  for (const part of selector.split(',').map(each => each.trim())) {
    const match = part === '' ? null : COMPOUND.exec(part);
    if (!match) return null;
    const simple = match[2].match(/[#.][^#.]+/g) ?? [];
    compounds.push({
      tag: match[1] === undefined || match[1] === '*' ? null : match[1],
      ids: simple.filter(each => each[0] === '#').map(each => each.slice(1)),
      classes: simple
        .filter(each => each[0] === '.')
        .map(each => each.slice(1)),
    });
  }
  return compounds;
}

/** ASCII letters in lower case, and nothing else changed. */
function asciiLower(text: string): string {
  return text.replace(/[A-Z]/g, letter => letter.toLowerCase());
}

function matches(
  element: Element,
  compound: Compound,
  quirks: boolean
): boolean {
  if (compound.tag !== null) {
    // An HTML element's tag matches in any case; a foreign one's as written.
    const html = element.namespaceURI === HTML_NS;
    const tag = html ? asciiLower(compound.tag) : compound.tag;
    if (element.tagName !== tag) return false;
  }
  // Quirks mode matches ids and classes in any ASCII case.
  const fold = quirks ? asciiLower : (text: string) => text;
  const id = attributeOf(element, 'id');
  if (compound.ids.some(each => id === undefined || fold(id) !== fold(each))) {
    return false;
  }
  const classes = classesOf(element).map(fold);
  return compound.classes.every(each => classes.includes(fold(each)));
}

/**
 * Every element in the content a selector matches, in the page's order, as
 * `querySelectorAll` finds them once the page's scripts run, or null for a
 * selector `readSelector` can't read. A `<template>`'s content isn't in the
 * document (parse5 keeps it apart from its children), and with scripts on a
 * `<noscript>` holds text, so neither is searched.
 */
export function selectAll(
  root: ParentNode,
  selector: string,
  quirks: boolean
): Element[] | null {
  const compounds = readSelector(selector);
  if (!compounds) return null;
  const found: Element[] = [];
  const visit = (parent: ParentNode) => {
    for (const child of parent.childNodes) {
      if (!isElement(child)) continue;
      if (compounds.some(compound => matches(child, compound, quirks))) {
        found.push(child);
      }
      if (child.tagName !== 'noscript') visit(child);
    }
  };
  visit(root);
  return found;
}

// ---- What the notes say ------------------------------------------------------

/** The class bulma-carousel's markup gives a carousel, and bestax `Carousel`'s. */
export const CAROUSEL_CLASS = 'carousel';

/** bulma-carousel's class for an image cropped to its frame. */
export const COVERED_CLASS = 'is-covered';

/** What bulma-carousel's stylesheet styles `is-covered` on: an `.image`. */
export const COVERED_SELECTOR = `.image.${COVERED_CLASS}`;

/** What bestax's stylesheet does with the `carousel` class on markup. */
const CAROUSEL_STYLED =
  "which `bestax.css` and `extras.css` style as its root (`position: relative`, `overflow: hidden`, `width: 100%`) until a `Carousel` takes the element's place";

/** What replaces a carousel, in the place of `where`. */
function renderCarousel(where: string): string {
  return `render bestax's \`Carousel\` in ${where}, with a \`CarouselItem\` for each slide, and carry the script's options over as the \`html-script:carousel\` recipe says`;
}

export interface DrivenFacts {
  /** The selector, as the script writes it. */
  selector: string;
  /** The script, as the TODO names it (`the page's script \`js/app.js\``). */
  script: string;
  /** How many elements the selector matches. */
  count: number;
  /** The id they all have, when several do. */
  sharedId?: string;
  /** Whether one of them has the `carousel` class. */
  carouselClass: boolean;
}

/**
 * The elements a page's script attaches bulma-carousel to: each one a
 * carousel, whose children become its slides, and none of it run by the
 * module.
 */
export function drivenMessage(facts: DrivenFacts): string {
  const { selector, script, count, sharedId, carouselClass } = facts;
  const which =
    count === 1
      ? `${script} attaches bulma-carousel to this element (\`${selector}\`)`
      : `${script} attaches bulma-carousel to \`${selector}\`, which selects these ${count} elements${
          sharedId === undefined
            ? ''
            : `, since the page gives each one \`id="${sharedId}"\``
        }, so each is a carousel`;
  return [
    `${which}: the script makes a slide of each of its children and builds the carousel around them, which the module doesn't do, so ${renderCarousel(count === 1 ? 'its place' : 'the place of each')}`,
    ...(carouselClass
      ? [
          `\`${CAROUSEL_CLASS}\` is bestax \`Carousel\`'s own class, ${CAROUSEL_STYLED}`,
        ]
      : []),
  ].join('; ');
}

/**
 * An element with the `carousel` class on a page that uses bulma-carousel,
 * where no selector the codemod read reaches it.
 */
export function carouselClassMessage(): string {
  return `\`${CAROUSEL_CLASS}\` is the class bulma-carousel's markup gives a carousel, and bestax \`Carousel\`'s own, ${CAROUSEL_STYLED}: if the page's carousel script drives this element, ${renderCarousel('its place')}, and otherwise drop the class or rename it`;
}

/** An `.image` with bulma-carousel's `is-covered`. */
export function coveredMessage(): string {
  return `\`${COVERED_CLASS}\` is bulma-carousel's class: inside one of the slides its script builds, its stylesheet makes the \`<img>\` in an \`.image\` fill the frame and crops the photo to fit (\`object-fit: cover\`); nothing in bestax reads the class (\`Image\` has no prop for it, and \`Carousel\`'s slides aren't bulma-carousel's), so in the app a ratio image stretches its photo instead: keep the class and give it the rule in the app's stylesheet (\`.image.is-covered img { width: 100%; height: 100%; object-fit: cover; }\`)`;
}
