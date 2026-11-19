/**
 * The parts of the docs site's axe pass (`a11y-scan.mjs`) that need no
 * browser: reading its arguments and the sitemap, and matching what axe
 * reports against the exemptions in `a11y-exemptions.mjs`.
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
    a => !a.startsWith('--theme') && !a.startsWith('--report=')
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
 * The exemption that covers one element breaking one rule on one page in
 * this color mode, or undefined. An exemption that lists `targets` covers
 * only those elements, written exactly as axe writes them, so the same rule
 * failing anywhere else on the page still fails.
 */
export function exemptionFor(exemptions, { rule, page, target }, theme) {
  return exemptions.find(
    e =>
      e.rule === rule &&
      appliesIn(e, theme) &&
      e.pages.some(pattern => pageMatches(pattern, page)) &&
      (!e.targets || e.targets.includes(target))
  );
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
 * Sorts a run's violations into what an exemption covers and what fails the
 * run, element by element, and finds the exemptions for this color mode
 * that covered nothing, which fail it too: the problem they were for is
 * gone, so they come out with the fix.
 *
 * @param violations `{ page, rule, help, targets }` for each rule a page broke
 * @returns the violations left with only their uncovered elements, and the
 *   stale exemptions
 */
export function judge(violations, exemptions, theme) {
  const used = new Set();
  const failing = [];
  for (const v of violations) {
    const uncovered = v.targets.filter(target => {
      const e = exemptionFor(exemptions, { ...v, target }, theme);
      if (e) used.add(e);
      return !e;
    });
    if (uncovered.length) failing.push({ ...v, targets: uncovered });
  }
  const stale = exemptions.filter(e => appliesIn(e, theme) && !used.has(e));
  return { failing, stale };
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
