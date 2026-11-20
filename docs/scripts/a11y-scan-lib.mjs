/**
 * The parts of the docs site's axe pass (`a11y-scan.mjs`) that need no
 * browser: reading its arguments and the sitemap, and matching what axe
 * reports against the exemptions in `a11y-exemptions.mjs`. Plus
 * `settleAnimations`, which the pass runs inside the page.
 */

/** The axe rules the pass runs: WCAG 2.0, 2.1 and 2.2, Level A and AA. */
export const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

/** The two color modes the site has, one per run. */
export const THEMES = ['light', 'dark'];

/**
 * The run's options from its command line. `--theme=light` or
 * `--theme=dark` is required, once, so a CI leg can't silently check the
 * wrong mode. `--report=<file>` also writes every violation as JSON.
 */
export function parseArgs(argv) {
  const themes = argv.filter(a => a === '--theme' || a.startsWith('--theme='));
  const theme = themes[0]?.slice('--theme='.length);
  if (themes.length !== 1 || !THEMES.includes(theme)) {
    throw new Error(
      `Pass the color mode once, as --theme=light or --theme=dark (got ${
        themes.join(' ') || 'none'
      }).`
    );
  }
  const reports = argv.filter(a => a.startsWith('--report='));
  if (reports.length > 1) throw new Error('Pass --report=<file> at most once.');
  const report = reports[0]?.slice('--report='.length);
  if (reports.length && !report) throw new Error('--report needs a file.');
  const unknown = argv.filter(
    a =>
      a !== '--theme' && !a.startsWith('--theme=') && !a.startsWith('--report=')
  );
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return { theme, report };
}

/**
 * The page paths a sitemap lists, in order and once each, without the
 * site's origin, so they can be loaded from a local server instead.
 */
export function pagesFromSitemap(xml) {
  const paths = [];
  for (const [, loc] of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const path = new URL(loc).pathname;
    if (!paths.includes(path)) paths.push(path);
  }
  if (paths.length === 0) throw new Error('The sitemap lists no pages.');
  return paths;
}

/**
 * Whether a page path matches an exemption's page pattern: the path itself,
 * or, for a pattern ending in `*`, any path that starts with what comes
 * before it.
 */
export function pageMatches(pattern, path) {
  return pattern.endsWith('*')
    ? path.startsWith(pattern.slice(0, -1))
    : path === pattern;
}

/** Whether an exemption applies in a color mode (both, when it names none). */
export function appliesIn(exemption, theme) {
  return !exemption.themes || exemption.themes.includes(theme);
}

/**
 * Each page pattern of each exemption that covers one element breaking one
 * rule on one page in this color mode, as `{ exemption, pattern }`. An
 * exemption that lists `targets` covers only those elements, written exactly
 * as the scan prints them, so the same rule failing anywhere else on the
 * page still fails.
 */
export function coverFor(exemptions, { rule, page, target }, theme) {
  const covers = [];
  for (const exemption of exemptions) {
    if (exemption.rule !== rule || !appliesIn(exemption, theme)) continue;
    if (exemption.targets && !exemption.targets.includes(target)) continue;
    for (const pattern of exemption.pages) {
      if (pageMatches(pattern, page)) covers.push({ exemption, pattern });
    }
  }
  return covers;
}

/**
 * What's wrong with the exemptions themselves: each needs a rule, at least
 * one page pattern, known color modes, and an issue number or a reason.
 */
export function invalidExemptions(exemptions) {
  const problems = [];
  exemptions.forEach((e, i) => {
    const label = `Exemption ${i + 1} (${e.rule ?? 'no rule'})`;
    if (typeof e.rule !== 'string' || !e.rule) {
      problems.push(`${label} names no rule.`);
    }
    if (!Array.isArray(e.pages) || e.pages.length === 0) {
      problems.push(`${label} names no pages.`);
    }
    if (
      e.targets !== undefined &&
      (!Array.isArray(e.targets) || e.targets.length === 0)
    ) {
      problems.push(`${label} lists no targets.`);
    }
    if (e.themes && !e.themes.every(t => THEMES.includes(t))) {
      problems.push(`${label} names a color mode other than light or dark.`);
    }
    const hasIssue = Number.isInteger(e.issue) && e.issue > 0;
    const hasReason = typeof e.reason === 'string' && e.reason.trim() !== '';
    if (!hasIssue && !hasReason) {
      problems.push(`${label} needs an issue number or a reason.`);
    }
  });
  return problems;
}

/**
 * Sorts a run's violations into what the exemptions cover and what fails the
 * run, element by element, and finds each page pattern of an exemption for
 * this color mode that covered nothing: the problem it was for may be gone
 * there. A run where pages failed to load can't tell a fixed page from an
 * unread one, so it calls no exemption stale.
 *
 * @param violations `{ page, rule, help, targets }` for each rule a page broke
 * @param pagesFailed whether any page failed to load in this run
 * @returns the violations left with only their uncovered elements, and the
 *   stale `{ exemption, pattern }` pairs
 */
export function judge(violations, exemptions, theme, pagesFailed = false) {
  const used = new Map(exemptions.map(e => [e, new Set()]));
  const failing = [];
  for (const v of violations) {
    const uncovered = v.targets.filter(target => {
      const covers = coverFor(exemptions, { ...v, target }, theme);
      for (const { exemption, pattern } of covers) {
        used.get(exemption).add(pattern);
      }
      return covers.length === 0;
    });
    if (uncovered.length) failing.push({ ...v, targets: uncovered });
  }
  const stale = pagesFailed
    ? []
    : exemptions
        .filter(e => appliesIn(e, theme))
        .flatMap(e =>
          e.pages
            .filter(pattern => !used.get(e).has(pattern))
            .map(pattern => ({ exemption: e, pattern }))
        );
  return { failing, stale };
}

/**
 * Waits, in the page, until no animation that will end is still running, or
 * until `timeoutMs` has passed, and says whether it ran out of time. That's a
 * CSS animation with a finite count, or a transition; one that loops forever
 * never ends and isn't waited for. axe takes text at zero opacity for hidden,
 * so a check while an element is still fading in skips it (#2249).
 *
 * It looks again after each wait, since one animation can start another, and
 * in open shadow roots too, where the live examples render: a document's
 * `getAnimations()` leaves those out. A paused animation is left alone. It
 * won't move while the page sits, and the scan has scrolled every part of
 * the page into view once already.
 *
 * The scan runs it in the browser through `page.evaluate`, which sends it as
 * source text, so it uses nothing from this module's scope. A test runs it
 * from its source alone.
 */
export async function settleAnimations(timeoutMs, doc = globalThis.document) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const roots = [doc];
    for (let i = 0; i < roots.length; i++) {
      for (const element of roots[i].querySelectorAll('*')) {
        if (element.shadowRoot) roots.push(element.shadowRoot);
      }
    }
    const running = roots
      .flatMap(root => root.getAnimations())
      .filter(
        animation =>
          animation.playState === 'running' &&
          animation.effect?.getComputedTiming().endTime !== Infinity
      );
    if (!running.length) return { timedOut: false };
    const left = deadline - Date.now();
    if (left <= 0) return { timedOut: true };
    let timer;
    await Promise.race([
      Promise.all(running.map(animation => animation.finished.catch(() => {}))),
      new Promise(resolve => {
        timer = setTimeout(resolve, left);
      }),
    ]);
    clearTimeout(timer);
  }
}

/**
 * How the scan writes the element axe names: its selector, with the shadow
 * roots it sits in joined by ` >>> ` and the frames by ` >> `.
 */
export function formatTarget(target) {
  return target
    .map(part => (Array.isArray(part) ? part.join(' >>> ') : part))
    .join(' >> ');
}

/** The failing violations, one rule at a time, as the run prints them. */
export function describeFailures(failing) {
  const byRule = new Map();
  for (const v of failing) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule).push(v);
  }
  const lines = [];
  for (const [rule, list] of [...byRule].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    lines.push(`${rule}: ${list[0].help} (${list.length} pages)`);
    for (const v of list) {
      lines.push(`  ${v.page}`);
      for (const target of v.targets.slice(0, 3)) lines.push(`    ${target}`);
      if (v.targets.length > 3) {
        lines.push(`    and ${v.targets.length - 3} more`);
      }
    }
  }
  return lines;
}
