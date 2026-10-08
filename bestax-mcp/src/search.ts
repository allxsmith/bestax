/**
 * Ranking for `search_bestax`, the entry point a model reaches for first.
 *
 * Deliberately a small scorer over the catalog rather than an index: the corpus
 * is 87 components, ~1500 props and ~900 examples, all already in memory, and
 * anything cleverer would need a build step this package does not have.
 *
 * What matters more than the algorithm is that every hit names the tool to call
 * next. A search result a model cannot act on costs a round trip to rediscover
 * what it just found.
 */
import type { Catalog, ComponentRecord, Skill } from './data.js';

export type HitKind = 'component' | 'prop' | 'example' | 'css-var' | 'skill';

export interface Hit {
  kind: HitKind;
  name: string;
  detail: string;
  /** The tool call that returns the full thing. */
  next: string;
  score: number;
}

const norm = (s: string) => s.toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A prefix of a term that survives common English inflection.
 *
 * Exact substring matching is too brittle here, and the miss is not
 * hypothetical: "theme" does not occur in `bestax-theming`, whose own
 * description says "colors", "dark mode" and "tokens" but never "theme". A user
 * asking how to theme their app got nothing. Trimming two characters catches
 * theme/theming, color/colors, migrate/migration and icon/icons without
 * needing a stemmer.
 *
 * The floor of 4 matters: shorter stems ("the") match everything.
 */
const stem = (t: string) => t.slice(0, Math.max(4, t.length - 2));

/**
 * Compiled word-initial matchers, memoised per stem.
 *
 * `termHit` runs once per term per haystack, and a search covers ~1,500 props and ~900
 * examples — so compiling here meant thousands of identical `new RegExp` calls per query,
 * which is where the measured 5.8 s at 3,000 terms went. The terms in one query are a tiny
 * set; compiling each once turns that into a lookup.
 *
 * The cap exists because the cache outlives a request: a stdio session is long-lived, and
 * every distinct query would otherwise pin a regex forever. Clearing wholesale rather than
 * evicting LRU keeps this honest — the cache is an optimisation, not state anything depends
 * on.
 */
const STEM_RE_CACHE = new Map<string, RegExp>();
const STEM_RE_CACHE_MAX = 500;

function wordInitialRe(stemmed: string): RegExp {
  let re = STEM_RE_CACHE.get(stemmed);
  if (!re) {
    if (STEM_RE_CACHE.size >= STEM_RE_CACHE_MAX) STEM_RE_CACHE.clear();
    re = new RegExp(`\\b${escapeRe(stemmed)}`);
    STEM_RE_CACHE.set(stemmed, re);
  }
  return re;
}

/** 2 for a substring hit, 1 for a word-initial stem hit, 0 for neither. */
function termHit(hay: string, term: string): number {
  if (hay.includes(term)) return 2;
  const s = stem(term);
  // Word-initial, so "them" finds "theming" but not "anthem".
  return s !== term && wordInitialRe(s).test(hay) ? 1 : 0;
}

/**
 * Words that say how a query's words relate rather than what it asks for. Kept
 * out of its terms, since "that" in an example's title or "with" in a prop's
 * description is no sign of what a builder wants: a query described in a
 * sentence put an example titled "A fallback that holds the layout" above
 * Reveal for "element that animates into view".
 */
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'inside',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'with',
]);

/** A query's words, less the stop words, unless it is nothing but stop words. */
function contentWords(words: string[]): string[] {
  const content = words.filter(w => !STOP_WORDS.has(w));
  return content.length ? content : words;
}

/**
 * What a word of a multi-word query is worth when it is a component's whole name,
 * singular or plural, and what an alias is worth when the query also names
 * another component outright: the same, so neither outweighs the other.
 */
const NAME_WORD_SCORE = 30;

/** Whether a query word is a name, as written or with a plural `s`. */
const isName = (word: string, lowerName: string) =>
  word === lowerName || word === `${lowerName}s`;

/**
 * Score a haystack against the query terms.
 *
 * Whole-phrase and exact-name matches dominate; term coverage breaks ties. A
 * miss on any term is not fatal — "button icon" should still find Button —
 * but scoring coverage means the thing matching both wins.
 *
 * In a query of several words, a word in the name counts for more than the same
 * word in the prose around it. The whole-query checks above it almost never fire
 * then ("date picker" is in no name), and without this a prop whose description
 * mentions a date picker outscored DateInput, whose name says "date" (#934).
 */
function score(haystack: string, name: string, terms: string[], query: string) {
  const hay = norm(haystack);
  const lowerName = norm(name);
  let s = 0;
  if (lowerName === query) s += 100;
  else if (lowerName.startsWith(query)) s += 60;
  else if (lowerName.includes(query)) s += 40;
  else if (termHit(lowerName, query)) s += 25;
  if (hay.includes(query)) s += 20;
  for (const t of terms) s += termHit(hay, t) * 5;
  if (terms.length > 1) {
    for (const t of terms) {
      if (isName(t, lowerName)) s += NAME_WORD_SCORE;
      else if (t.length >= 3 && lowerName.includes(t)) s += 15;
    }
  }
  return s;
}

/**
 * What other libraries, and the people who learned on them, call a bestax
 * component, keyed by the phrase lower-cased with its spaces and hyphens
 * removed. A query that names one of these finds the component as if it had
 * named it, and so does a name `get_component` cannot resolve.
 *
 * "date picker" is the example in search_bestax's own schema, and it put
 * DateInput 33rd, behind a prop that mentions a date picker in passing (#934).
 * Where a phrase fits more than one component the first is the closest fit.
 *
 * A vocabulary rather than a roster: a component missing from it is still found
 * by its name and summary. A test holds every name here to the catalog, so a
 * rename cannot leave an entry pointing nowhere.
 */
export const ALIASES: Readonly<Record<string, readonly string[]>> = {
  accordion: ['Collapses', 'Collapse'],
  autosuggest: ['Autocomplete'],
  avatargroup: ['Avatars'],
  buttongroup: ['Buttons'],
  calendar: ['DateInput', 'DateTimeInput'],
  checkboxgroup: ['Checkboxes'],
  chip: ['Taginput'],
  chipinput: ['Taginput'],
  combobox: ['Autocomplete'],
  confirmdialog: ['Dialog'],
  datepicker: ['DateInput', 'DateTimeInput'],
  datetimepicker: ['DateTimeInput'],
  drawer: ['Sidebar'],
  dropdownmenu: ['Dropdown'],
  dropzone: ['File'],
  fileupload: ['File'],
  modaldialog: ['Modal', 'Dialog'],
  offcanvas: ['Sidebar'],
  pager: ['Pagination'],
  popup: ['Popover'],
  progressbar: ['Progress'],
  radiogroup: ['Radios'],
  rangeslider: ['Slider'],
  rating: ['Rate'],
  selectbox: ['Select'],
  separator: ['Divider'],
  slideshow: ['Carousel'],
  snackbar: ['Toast'],
  spinbutton: ['Numberinput'],
  spinner: ['Loader'],
  stepper: ['Steps', 'Numberinput'],
  taggroup: ['Tags'],
  tagsinput: ['Taginput'],
  timepicker: ['TimeInput', 'DateTimeInput'],
  toggle: ['Switch'],
  typeahead: ['Autocomplete'],
  upload: ['File'],
  wizard: ['Steps'],
};

/** What an alias is worth: as much as the component's own name as a whole query. */
const ALIAS_SCORE = 100;

/**
 * Every run of up to four consecutive words, joined: "date time picker" yields
 * `datetime`, `timepicker` and `datetimepicker` as well as each word.
 */
function phrases(words: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    let joined = '';
    for (let j = i; j < Math.min(words.length, i + 4); j++) {
      joined += words[j];
      out.push(joined);
    }
  }
  return out;
}

/**
 * The components a query names by an alias, each with what that is worth. A
 * longer phrase is worth more, so "date time picker" prefers `datetimepicker`
 * to the `timepicker` inside it, and a later name for the same phrase less.
 *
 * Where the query also names a component outright that the alias does not
 * reach, the alias is worth only what that name is, NAME_WORD_SCORE. At full
 * worth one alias outweighed the noun a query was about, so "breadcrumbs with
 * separators" answered with the Divider a separator is. `names` are the
 * components a query can name; without them, every alias is worth its full
 * score.
 */
export function aliasMatches(
  query: string,
  names: readonly string[] = []
): Map<string, number> {
  // Splitting on anything but a letter or digit is what lets "date-picker",
  // "Date Picker" and `<DatePicker>` all reach the `datepicker` key.
  const words = norm(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const outright = names.filter(n => words.some(w => isName(w, norm(n))));
  const out = new Map<string, number>();
  for (const phrase of phrases(words)) {
    const key = Object.hasOwn(ALIASES, phrase)
      ? phrase
      : phrase.endsWith('s') && Object.hasOwn(ALIASES, phrase.slice(0, -1))
        ? phrase.slice(0, -1)
        : null;
    if (!key) continue;
    const reached = ALIASES[key];
    const worth = outright.every(n => reached.includes(n))
      ? ALIAS_SCORE + 2 * key.length
      : NAME_WORD_SCORE;
    reached.forEach((name, i) => {
      const s = worth - 10 * i;
      if (s > (out.get(name) ?? 0)) out.set(name, s);
    });
  }
  return out;
}

/**
 * Added to a component that matches at all. Components are what a search is
 * usually for, and a prop or a CSS variable that mentions the same words, or
 * shares the component's name (`DateInput.popover` for "popover"), should not
 * outrank the component itself (#934).
 */
const COMPONENT_BONUS = 30;

export function searchAll(
  query: string,
  catalog: Catalog,
  components: ComponentRecord[],
  skills: Skill[],
  kinds: HitKind[]
): Hit[] {
  const terms = contentWords(norm(query.trim()).split(/\s+/).filter(Boolean));
  if (!terms.length) return [];
  // What the name and phrase checks compare with, less the stop words too, so "the
  // button" asks for Button as plainly as "button" does.
  const q = terms.join(' ');
  const hits: Hit[] = [];
  const want = (k: HitKind) => kinds.includes(k);

  if (want('component')) {
    const aliased = aliasMatches(
      q,
      catalog.components.map(c => c.name)
    );
    for (const c of catalog.components) {
      const hay = `${c.name} ${c.purpose} ${c.category}`;
      const alias = aliased.get(c.name) ?? 0;
      const matched = score(hay, c.name, terms, q) + alias;
      // The bonus is for a component the query is about: one it names, or one whose
      // summary has most of its words. A summary that shares one word of two ("at a
      // time" for "time picker") is the same passing mention a prop's description is,
      // and one that misses a single word of a sentence ("spacing", where Block says
      // "margin") is not.
      const lowerName = norm(c.name);
      const lowerHay = norm(hay);
      const covered = terms.filter(t => termHit(lowerHay, t) > 0).length;
      const about =
        alias > 0 ||
        terms.some(t => t.length >= 3 && termHit(lowerName, t) > 0) ||
        covered * 2 > terms.length;
      const s = matched > 0 && about ? matched + COMPONENT_BONUS : matched;
      if (s > 0) {
        hits.push({
          kind: 'component',
          name: c.name,
          detail: c.purpose,
          // A hook's get_component answer is its signature and where the rest is, so
          // it is the next call for a helper too. It used to be get_helper_props(),
          // which describes the helper props and none of the hooks (#933).
          next: `get_component({ name: "${c.name}" })`,
          score: s,
        });
      }
    }
  }

  for (const record of components) {
    if (want('prop')) {
      for (const part of record.parts) {
        for (const p of part.props) {
          const s = score(`${p.name} ${p.description}`, p.name, terms, q);
          if (s > 20) {
            hits.push({
              kind: 'prop',
              name: `${part.path}.${p.name}`,
              detail: `${p.type}${p.description ? ` — ${p.description}` : ''}`,
              next: `get_props({ component: "${record.name}", path: "${part.path}" })`,
              score: s,
            });
          }
        }
      }
    }
    if (want('example')) {
      for (const e of record.examples) {
        const s = score(`${e.title} ${e.code}`, e.title, terms, q);
        if (s > 20) {
          hits.push({
            kind: 'example',
            name: `${record.name}: ${e.title}`,
            detail: e.code.split('\n')[0].slice(0, 100),
            next: `get_examples({ component: "${record.name}", query: "${e.title}" })`,
            score: s,
          });
        }
      }
    }
  }

  if (want('css-var')) {
    for (const [cssVar, owner] of Object.entries(catalog.cssVarIndex)) {
      const s = score(cssVar, cssVar, terms, q);
      if (s > 0) {
        hits.push({
          kind: 'css-var',
          name: cssVar,
          detail: `declared by ${owner}`,
          next: `get_css_variables({ component: "${owner}" })`,
          score: s,
        });
      }
    }
  }

  if (want('skill')) {
    for (const skill of skills) {
      const s = score(
        `${skill.name} ${skill.description}`,
        skill.name,
        terms,
        q
      );
      if (s > 0) {
        hits.push({
          kind: 'skill',
          name: skill.name,
          detail: skill.description.slice(0, 160),
          next: `get_skill({ name: "${skill.name}" })`,
          score: s,
        });
      }
    }
  }

  hits.sort(
    (a, b) =>
      b.score - a.score || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  );
  // Several examples can share a heading, and each became its own row with the same
  // name and the same next call: three "DateInput: Month and Year Pickers" rows for
  // "date picker", spending the limit on one answer. The best-scoring one stands.
  const seen = new Set<string>();
  return hits.filter(h => {
    const key = `${h.kind}\u0000${h.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Edit distance, capped — the names are short and the corpus is 87 entries. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * Near misses for a name that did not resolve.
 *
 * Real edit distance rather than a prefix heuristic, because the typos that
 * actually happen are a dropped or transposed letter — and a first-letter
 * heuristic answered "Buton" with "Badge, Block, Box", which is worse than
 * saying nothing.
 *
 * A name another library uses (`DatePicker`) is no typo of the bestax one, so
 * the aliases come first, best fit first, and edit distance fills the rest.
 */
export function suggest(input: string, names: string[], limit = 3): string[] {
  const q = norm(input);
  const known = new Set(names);
  const aliased = [...aliasMatches(input)]
    .filter(([n]) => known.has(n))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([n]) => n);
  const near = names
    .map(n => ({ n, d: editDistance(q, norm(n)) }))
    // Scale with length so short names don't swallow every query, and long
    // ones still tolerate a typo or two.
    .filter(x => x.d <= Math.max(1, Math.floor(x.n.length / 3)))
    .sort((a, b) => a.d - b.d || (a.n < b.n ? -1 : 1))
    .map(x => x.n);
  return [...new Set([...aliased, ...near])].slice(0, limit);
}
