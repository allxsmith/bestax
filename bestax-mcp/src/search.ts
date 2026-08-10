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
 * Score a haystack against the query terms.
 *
 * Whole-phrase and exact-name matches dominate; term coverage breaks ties. A
 * miss on any term is not fatal — "button icon" should still find Button —
 * but scoring coverage means the thing matching both wins.
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
  return s;
}

export function searchAll(
  query: string,
  catalog: Catalog,
  components: ComponentRecord[],
  skills: Skill[],
  kinds: HitKind[]
): Hit[] {
  const q = norm(query.trim());
  const terms = q.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits: Hit[] = [];
  const want = (k: HitKind) => kinds.includes(k);

  if (want('component')) {
    for (const c of catalog.components) {
      const s = score(`${c.name} ${c.purpose} ${c.category}`, c.name, terms, q);
      if (s > 0) {
        hits.push({
          kind: 'component',
          name: c.name,
          detail: c.purpose,
          // A helper has no prop table, and `get_component` on one is itself only a
          // pointer at `get_helper_props` — so naming it here would make a search hit a
          // three-hop trip to the answer.
          next:
            c.kind === 'helper'
              ? 'get_helper_props()'
              : `get_component({ name: "${c.name}" })`,
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

  return hits.sort(
    (a, b) =>
      b.score - a.score || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  );
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
 */
export function suggest(input: string, names: string[], limit = 3): string[] {
  const q = norm(input);
  return (
    names
      .map(n => ({ n, d: editDistance(q, norm(n)) }))
      // Scale with length so short names don't swallow every query, and long
      // ones still tolerate a typo or two.
      .filter(x => x.d <= Math.max(1, Math.floor(x.n.length / 3)))
      .sort((a, b) => a.d - b.d || (a.n < b.n ? -1 : 1))
      .slice(0, limit)
      .map(x => x.n)
  );
}
