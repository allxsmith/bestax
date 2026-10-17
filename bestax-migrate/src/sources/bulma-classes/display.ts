/**
 * The display Bulma's stylesheet gives an element, for the HTML input's
 * whitespace. A whitespace-only run beside a block, flex or grid box renders
 * nothing, so the converter can drop it, while one between inline boxes can
 * be a space the page shows. The tag's own display is the converter's to
 * know; this is what Bulma's classes make of it.
 *
 * Answered from the element's own tag and classes, so a rule that reaches it
 * through an ancestor (`.tabs li`) or a state (`:hover`) is out of reach, as
 * is the page's own CSS. `e2e/bulma-classes-display.test.ts` holds both
 * tables to `bulma.css`, in both directions.
 *
 * Apart from `class-map.ts` because nothing here converts anything, and the
 * MCP index and the ESLint plugin's metadata are generated from that table.
 */

import { VIEWPORT_SUFFIX } from '../_shared/viewports.js';

export type BulmaDisplay =
  | 'block'
  | 'flex'
  | 'grid'
  | 'inline'
  | 'inline-block'
  | 'inline-flex'
  | 'none';

/**
 * A selector a media query gives a display other than its own: `base` is the
 * one it has outside media queries, absent where it sets none (so the tag's
 * holds), and `media` the one some viewports give it instead.
 */
export interface VaryingDisplay {
  readonly base?: BulmaDisplay;
  readonly media: BulmaDisplay;
}

/**
 * Bulma's element and component rules that set a display, by selector: the
 * classes all on the one element, after a tag where the rule names one
 * (`div.icon-text`), with any class it must not have (`:not(.is-desktop)`).
 * A plain display holds at every viewport; a media rule that restates it
 * changes nothing.
 */
export const COMPONENT_DISPLAY: Readonly<
  Record<string, BulmaDisplay | VaryingDisplay>
> = {
  '.button': 'inline-flex',
  '.button.is-fullwidth': 'flex',
  '.buttons': 'flex',
  '.box': 'block',
  '.delete': 'inline-flex',
  '.modal-close': 'inline-flex',
  '.icon': 'inline-flex',
  '.icon-text': 'inline-flex',
  'div.icon-text': 'flex',
  '.image': 'block',
  '.loader': 'block',
  '.progress': 'block',
  '.tags': 'flex',
  '.tag': 'inline-flex',
  '.input': 'inline-flex',
  '.textarea': 'block',
  '.is-fullwidth.input': 'block',
  '.is-fullwidth.textarea': 'block',
  '.is-inline.input': 'inline',
  '.is-inline.textarea': 'inline',
  '.checkbox': 'inline-block',
  '.radio': 'inline-block',
  '.checkboxes': 'flex',
  '.radios': 'flex',
  '.select': 'inline-block',
  '.file': 'flex',
  '.file-label': 'flex',
  '.file-cta': 'inline-flex',
  '.file-name': 'block',
  '.file-icon': 'flex',
  '.label': 'block',
  '.help': 'block',
  '.field.has-addons': 'flex',
  '.field.is-grouped': 'flex',
  '.field.is-horizontal': { media: 'flex' },
  '.field-body': { media: 'flex' },
  '.card-header': 'flex',
  '.card-header-title': 'flex',
  '.card-header-icon': 'flex',
  '.card-image': 'block',
  '.card-footer': 'flex',
  '.card-footer-item': 'flex',
  '.dropdown': 'inline-flex',
  '.dropdown-menu': 'none',
  '.dropdown-item': 'block',
  '.dropdown-divider': 'block',
  '.message-header': 'flex',
  '.modal': 'none',
  '.modal.is-active': 'flex',
  '.modal-card': 'flex',
  '.modal-card-head': 'flex',
  '.modal-card-foot': 'flex',
  '.navbar': { media: 'flex' },
  '.navbar-brand': 'flex',
  '.navbar-tabs': 'flex',
  '.navbar-burger': { base: 'inline-flex', media: 'none' },
  '.navbar-menu': { base: 'none', media: 'flex' },
  '.navbar-menu.is-active': { media: 'block' },
  '.navbar-start': { media: 'flex' },
  '.navbar-end': { media: 'flex' },
  '.navbar-item': { base: 'block', media: 'flex' },
  '.navbar-link': { base: 'block', media: 'flex' },
  '.navbar-dropdown': { media: 'none' },
  '.navbar-dropdown.is-boxed': { media: 'block' },
  '.navbar-divider': { base: 'none', media: 'block' },
  '.pagination': 'flex',
  '.pagination-list': 'flex',
  '.pagination-previous': 'inline-flex',
  '.pagination-next': 'inline-flex',
  '.pagination-link': 'inline-flex',
  '.pagination-ellipsis': 'inline-flex',
  '.panel-tabs': 'flex',
  '.panel-block': 'flex',
  '.panel-icon': 'inline-block',
  '.tabs': 'flex',
  '.column': 'block',
  '.columns.is-mobile': 'flex',
  '.columns:not(.is-desktop)': { media: 'flex' },
  '.columns.is-desktop': { media: 'flex' },
  '.grid': 'grid',
  '.hero': 'flex',
  '.hero-video': { media: 'none' },
  '.hero-buttons': { media: 'flex' },
  '.level': 'flex',
  '.level.is-mobile': 'flex',
  '.level-item': 'flex',
  '.level-left': 'flex',
  '.level-right': 'flex',
  '.media': 'flex',
  '.skeleton-lines': 'flex',
};

/** The display helpers, each under both of Bulma's spellings. */
const HELPERS: Readonly<Record<string, BulmaDisplay>> = {
  'is-display-none': 'none',
  'is-hidden': 'none',
  'is-display-block': 'block',
  'is-block': 'block',
  'is-display-flex': 'flex',
  'is-flex': 'flex',
  'is-display-inline': 'inline',
  'is-inline': 'inline',
  'is-display-inline-block': 'inline-block',
  'is-inline-block': 'inline-block',
  'is-display-inline-flex': 'inline-flex',
  'is-inline-flex': 'inline-flex',
  'is-display-grid': 'grid',
  'is-grid': 'grid',
};

/**
 * The display helpers' rules, which are `!important`: each helper at every
 * viewport, and its variant for each viewport (`is-flex-tablet`) at that one
 * only.
 */
export const HELPER_DISPLAY: Readonly<
  Record<string, BulmaDisplay | VaryingDisplay>
> = Object.fromEntries(
  Object.entries(HELPERS).flatMap(([name, display]) => [
    [`.${name}`, display],
    ...Object.keys(VIEWPORT_SUFFIX).map(viewport => [
      `.${name}-${viewport}`,
      { media: display },
    ]),
  ])
);

interface Rule {
  readonly tag: string | undefined;
  readonly classes: readonly string[];
  readonly without: readonly string[];
  readonly display: BulmaDisplay;
  readonly media: boolean;
  /** `!important`, then classes, then a tag, as the cascade weighs them. */
  readonly weight: number;
}

function rulesOf(
  table: Readonly<Record<string, BulmaDisplay | VaryingDisplay>>,
  important: boolean
): Rule[] {
  return Object.entries(table).flatMap(([selector, entry]) => {
    const tag = /^[a-z]+/.exec(selector)?.[0];
    const without = [...selector.matchAll(/:not\(\.([\w-]+)\)/g)].map(
      match => match[1]
    );
    const classes = [
      ...selector.replace(/:not\([^)]*\)/g, '').matchAll(/\.([\w-]+)/g),
    ].map(match => match[1]);
    const rule = {
      tag,
      classes,
      without,
      weight:
        (important ? 1000 : 0) +
        10 * (classes.length + without.length) +
        (tag ? 1 : 0),
    };
    if (typeof entry === 'string') {
      return [{ ...rule, display: entry, media: false }];
    }
    return [
      ...(entry.base ? [{ ...rule, display: entry.base, media: false }] : []),
      { ...rule, display: entry.media, media: true },
    ];
  });
}

const RULES: readonly Rule[] = [
  ...rulesOf(COMPONENT_DISPLAY, false),
  ...rulesOf(HELPER_DISPLAY, true),
];

/**
 * Every display Bulma's rules can give an element across viewports, or
 * undefined when no rule sets one, so the tag's own holds. A set of one holds
 * at every viewport. An `undefined` in the set stands for the tag's own at
 * the viewports no rule reaches: `.columns` is the tag's on mobile and flex
 * from tablet up.
 *
 * Weighed as the cascade weighs these selectors: an `!important` helper
 * beats any component rule (`button is-block` is block), then the selector
 * with more classes (`button is-fullwidth` is flex), then the one naming a
 * tag. A media rule as weighty as the winner or more adds its display. Two
 * equally weighty rules that disagree (`is-hidden is-flex`) both count,
 * since only the stylesheet's order would settle them, and the tables don't
 * keep it. So the set can hold a display the element never takes, but never
 * misses one its own tag and classes give it, and whitespace beside the
 * element can go when every display in the set drops it.
 *
 * `none` is no box at all (`.modal` until it is active), so a run beside one
 * is beside whatever is past it. And these are displays alone: a box a rule
 * also takes out of the flow (`.modal`'s `position: fixed`) still reads as
 * its display here, though a run beside it is beside its neighbours.
 */
export function bulmaDisplay(
  tag: string,
  classes: Iterable<string>
): ReadonlySet<BulmaDisplay | undefined> | undefined {
  const own = new Set(classes);
  const name = tag.toLowerCase();
  const matching = RULES.filter(
    rule =>
      (!rule.tag || rule.tag === name) &&
      rule.classes.every(token => own.has(token)) &&
      !rule.without.some(token => own.has(token))
  );
  if (matching.length === 0) return undefined;
  const base = matching.filter(rule => !rule.media);
  const top = Math.max(-1, ...base.map(rule => rule.weight));
  const displays = new Set<BulmaDisplay | undefined>(
    base.filter(rule => rule.weight === top).map(rule => rule.display)
  );
  if (displays.size === 0) displays.add(undefined);
  for (const rule of matching) {
    if (rule.media && rule.weight >= top) displays.add(rule.display);
  }
  return displays;
}
