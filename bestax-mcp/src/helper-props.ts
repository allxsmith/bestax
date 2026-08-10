/**
 * Shaping the helper-prop reference so asking one question does not cost the whole page.
 *
 * `get_helper_props` was 54,886 characters — 49% of everything a cold-start builder read in
 * a measured session, on the tool this server's own `instructions` tell every client to call
 * before writing styling. Its `group` argument was supposed to prevent that and did not: the
 * filter substring-matched whole section BODIES, and three sections (`Supported Props`,
 * `Viewport-Specific Properties`, `Full TypeScript Definition`) name every helper keyword, so
 * `group: "text"` matched 21 of 41 sections — 87% of the page.
 *
 * Matching headings instead is not the fix either; it is a regression. `spacing` and
 * `typography` — two of the three groups the tool's own description advertises — match no
 * heading at all and would answer nothing.
 *
 * So the groups are curated, and each one carries its own slice of the prop table. The
 * governing rule is that **no call ever loses a prop name**: the default lists all 46 with
 * their accepted values, because a builder has to be able to look up a valid value in one
 * call. What moves behind `group` is the prose and the live examples, which are re-fetchable
 * and which nothing breaks without.
 */

/**
 * Markdown tables in the generated index are column-padded for human reading. That padding
 * is 32% of this document — 16,352 characters, of which `Supported Props` alone contributes
 * 12,455. Stripping it is free: no model reads alignment, and the cell contents are
 * untouched.
 */
export function reflowTables(md: string): string {
  // Fenced code is left exactly as written. Today's document happens to contain no table
  // inside a fence, so this changes nothing — but "pure whitespace, nothing lost" has to be
  // a property of the function rather than of the content it currently gets handed, and a
  // docs example that renders a markdown table is an ordinary thing to add.
  let inFence = false;
  return md
    .split('\n')
    .map(line => {
      const t = line.trim();
      if (t.startsWith('```') || t.startsWith('~~~')) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      if (!t.startsWith('|') || !t.endsWith('|')) return line;
      const cells = t.slice(1, -1).split('|');
      // A separator row (`| --- | --- |`) collapses to the shortest legal form.
      if (cells.every(c => /^\s*:?-+:?\s*$/.test(c))) {
        return `|${cells.map(c => (c.includes(':') ? c.trim() : '---')).join('|')}|`;
      }
      return `|${cells.map(c => ` ${c.trim()} `).join('|')}|`;
    })
    .join('\n');
}

export interface HelperGroup {
  /** Section headings, matched exactly against the `##`/`###` line. */
  headings: string[];
  /** Prop names whose rows are sliced out of the Supported Props table. */
  props: string[];
  /** Words a builder is likely to use for this group instead of its name. */
  aliases: string[];
}

/**
 * Every prop in the table belongs to exactly one group — checked by a test, because a prop
 * that falls through the map is a prop a `group` call can never surface.
 */
export const HELPER_GROUPS: Record<string, HelperGroup> = {
  spacing: {
    headings: ['### Margin'],
    props: [
      'm',
      'mt',
      'mr',
      'mb',
      'ml',
      'mx',
      'my',
      'p',
      'pt',
      'pr',
      'pb',
      'pl',
      'px',
      'py',
    ],
    aliases: ['margin', 'padding', 'gap', 'space'],
  },
  color: {
    headings: [
      '### Colors',
      '### Background Color',
      '### Color Shade',
      '### Background Color Shade',
    ],
    props: ['color', 'backgroundColor', 'colorShade', 'backgroundColorShade'],
    aliases: ['colour', 'background', 'bgcolor', 'textcolor', 'shade'],
  },
  typography: {
    headings: [
      '### Text Size',
      '### Text Align',
      '### Text Transform',
      '### Text Weight',
      '### Font Family',
    ],
    props: [
      'textSize',
      'textAlign',
      'textTransform',
      'textWeight',
      'fontFamily',
    ],
    aliases: ['text', 'font', 'weight', 'align', 'size', 'uppercase', 'italic'],
  },
  flex: {
    headings: ['### With Flexbox Helpers'],
    props: [
      'flexDirection',
      'flexWrap',
      'justifyContent',
      'alignContent',
      'alignItems',
      'alignSelf',
      'flexGrow',
      'flexShrink',
    ],
    aliases: ['flexbox', 'justify', 'row', 'column'],
  },
  layout: {
    headings: [
      '### Visibility',
      '### Overflow',
      '### Clearfix',
      '### Relative Position',
    ],
    props: [
      'display',
      'visibility',
      'float',
      'overflow',
      'clearfix',
      'relative',
      'fullHeight',
    ],
    aliases: ['hidden', 'show', 'hide', 'block', 'inline', 'position'],
  },
  interaction: {
    headings: [
      '### Interaction',
      '### Cursor',
      '### Overlay',
      '### Skeleton Examples',
    ],
    props: ['interaction', 'cursor', 'overlay', 'skeleton', 'radius', 'shadow'],
    aliases: ['hover', 'click', 'loading', 'rounded'],
  },
  responsive: {
    headings: [
      '### Responsive Props',
      '### Global Viewport Property (Legacy)',
      '### Viewport-Specific Properties (Recommended)',
      '### Properties That Support Viewport Modifiers',
      '### Breakpoint Reference',
    ],
    props: ['responsive', 'viewport'],
    aliases: ['mobile', 'tablet', 'desktop', 'breakpoint', 'widescreen'],
  },
};

export const GROUP_NAMES = Object.keys(HELPER_GROUPS);

/** A builder's word → a group name, or null when nothing sensible matches. */
export function resolveGroup(input: string): string | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  if (HELPER_GROUPS[q]) return q;
  for (const [name, g] of Object.entries(HELPER_GROUPS)) {
    if (g.aliases.some(a => a === q)) return name;
    // A prop name is the most precise thing a builder can ask for: `mt` → spacing.
    if (g.props.some(p => p.toLowerCase() === q)) return name;
  }
  // Last resort, substring against names and aliases, so "colors" and "flexbox layout" land.
  for (const [name, g] of Object.entries(HELPER_GROUPS)) {
    if (name.includes(q) || q.includes(name)) return name;
    if (g.aliases.some(a => q.includes(a))) return name;
  }
  return null;
}

const sections = (doc: string) => doc.split(/\n(?=#{2,3} )/);
const headingOf = (chunk: string) => chunk.split('\n')[0].trim();

/** The `## Supported Props` table, reflowed, header rows plus the rows for `props`. */
export function propTable(doc: string, props?: string[]): string {
  const chunk = sections(doc).find(c => headingOf(c) === '## Supported Props');
  if (!chunk) return '';
  const lines = reflowTables(chunk).split('\n');
  const rows = lines.filter(l => l.trim().startsWith('|'));
  if (rows.length < 3) return '';
  const [header, sep, ...body] = rows;
  const wanted = props
    ? body.filter(r => {
        const m = r.match(/^\s*\|\s*`?([A-Za-z][A-Za-z0-9]*)`?\s*\|/);
        return m ? props.includes(m[1]) : false;
      })
    : body;
  if (!wanted.length) return '';
  return [header, sep, ...wanted].join('\n');
}

const GROUP_INDEX =
  `Narrow with \`get_helper_props({ group })\` — ` +
  `${GROUP_NAMES.join(' · ')} — for the examples and the prose behind any row above.`;

/**
 * The no-argument answer: every prop and every accepted value, and nothing else.
 *
 * Deliberately excluded, and why each is safe to drop: `Full TypeScript Definition` (5,143)
 * is a lossless restatement of the table above it; `Composable Mini-Hooks` (4,792) is
 * material for writing a component, which is `bestax-custom-component`'s job; the twenty-odd
 * live example blocks are reachable through `group`.
 */
export function renderHelperDefault(doc: string): string {
  const keep = ['## Overview', '## Import'];
  const intro = sections(doc)
    .filter(c => keep.includes(headingOf(c)))
    .map(c => reflowTables(c).trim());
  const table = propTable(doc);
  return ['# Helper props', ...intro, '## Supported props', table, GROUP_INDEX]
    .filter(Boolean)
    .join('\n\n');
}

/** One group: its example sections, then just its rows of the prop table. */
export function renderHelperGroup(doc: string, name: string): string {
  const group = HELPER_GROUPS[name];
  if (!group) return '';
  const bodies = sections(doc)
    .filter(c => group.headings.includes(headingOf(c)))
    .map(c => reflowTables(c).trim());
  const table = propTable(doc, group.props);
  return [
    `# Helper props — ${name}`,
    table && `## Props\n\n${table}`,
    ...bodies,
    `Other groups: ${GROUP_NAMES.filter(g => g !== name).join(' · ')}. ` +
      `Call \`get_helper_props\` with no argument for every prop at once.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
