/**
 * Holds the Accessibility Conformance Report (#2185) to the parts of the
 * VPAT® 2.5Rev International Edition it has to keep: a row for every WCAG 2.2
 * Level A and AA criterion and every Section 508 and EN 301 549 row the report
 * answers, each exactly once, an answer in the template's terms, a reason on
 * every WCAG row that falls short (an issue cited, or a gap kept by design, in
 * the phrase the Notes define), and a link for every issue cited.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const REPORT = readFileSync(
  new URL(
    '../docs/guides/accessibility/conformance-report.md',
    import.meta.url
  ),
  'utf8'
);

const WCAG_A = [
  '1.1.1',
  '1.2.1',
  '1.2.2',
  '1.2.3',
  '1.3.1',
  '1.3.2',
  '1.3.3',
  '1.4.1',
  '1.4.2',
  '2.1.1',
  '2.1.2',
  '2.1.4',
  '2.2.1',
  '2.2.2',
  '2.3.1',
  '2.4.1',
  '2.4.2',
  '2.4.3',
  '2.4.4',
  '2.5.1',
  '2.5.2',
  '2.5.3',
  '2.5.4',
  '3.1.1',
  '3.2.1',
  '3.2.2',
  '3.2.6',
  '3.3.1',
  '3.3.2',
  '3.3.7',
  '4.1.1',
  '4.1.2',
];
const WCAG_AA = [
  '1.2.4',
  '1.2.5',
  '1.3.4',
  '1.3.5',
  '1.4.3',
  '1.4.4',
  '1.4.5',
  '1.4.10',
  '1.4.11',
  '1.4.12',
  '1.4.13',
  '2.4.5',
  '2.4.6',
  '2.4.7',
  '2.4.11',
  '2.5.7',
  '2.5.8',
  '3.1.2',
  '3.2.3',
  '3.2.4',
  '3.3.3',
  '3.3.4',
  '3.3.8',
  '4.1.3',
];
const SECTION_508 = [
  '302.1',
  '302.2',
  '302.3',
  '302.4',
  '302.5',
  '302.6',
  '302.7',
  '302.8',
  '302.9',
  '501.1',
  '502',
  '503',
  '504.2',
  '504.2.1',
  '504.2.2',
  '504.3',
  '504.4',
  '602.2',
  '602.3',
  '602.4',
  '603.2',
  '603.3',
];
const EN_301_549 = [
  '4.2.1',
  '4.2.2',
  '4.2.3',
  '4.2.4',
  '4.2.5',
  '4.2.6',
  '4.2.7',
  '4.2.8',
  '4.2.9',
  '4.2.10',
  '4.2.11',
  '5.1',
  '5.2',
  '5.3',
  '5.4',
  '5.5',
  '5.6',
  '5.7',
  '5.8',
  '5.9',
  '12.1.1',
  '12.1.2',
  '12.2.2',
  '12.2.3',
  '12.2.4',
];

/**
 * The phrase a row's remarks use for a gap kept on purpose, which has no open
 * issue to cite. The Notes define it, quoted.
 */
const BY_DESIGN = 'by design';
const BY_DESIGN_PATTERN = new RegExp(`\\b${BY_DESIGN}\\b`, 'i');

/**
 * Whether a row that falls short says why: it cites an open issue as a
 * reference link (`[#123]`), or it names a gap kept by design.
 */
function explainsShortfall(remarks) {
  return /\[#\d+\]/.test(remarks) || BY_DESIGN_PATTERN.test(remarks);
}

const LEVELS = [
  'Supports',
  'Partially Supports',
  'Does Not Support',
  'Not Applicable',
  'See WCAG 2.x section',
];

/** The report's table rows, as `{ id, level, remarks, section }`. */
function rows() {
  const out = [];
  let section = '';
  for (const line of REPORT.split('\n')) {
    if (line.startsWith('### ')) section = line.slice(4);
    const cells = line.split('|').map(cell => cell.trim());
    // A row is `| <id> <name> | <level> | <remarks> |`; the header and the
    // divider don't start with a criterion's number.
    const id = /^(\d+(?:\.\d+)*)\s/.exec(cells[1] ?? '')?.[1];
    if (!id || cells.length < 5) continue;
    out.push({ id, level: cells[2], remarks: cells[3], section });
  }
  return out;
}

function idsIn(section) {
  return rows()
    .filter(row => row.section.startsWith(section))
    .map(row => row.id);
}

describe('the conformance report', () => {
  it('answers every WCAG 2.2 Level A and AA criterion once, in its table', () => {
    expect(idsIn('Table 1')).toEqual(WCAG_A);
    expect(idsIn('Table 2')).toEqual(WCAG_AA);
  });

  it('answers each Section 508 and EN 301 549 row it covers once', () => {
    expect([
      ...idsIn('Chapter 3: Functional Performance Criteria'),
      ...idsIn('Chapter 5: Software'),
      ...idsIn('Chapter 6: Support Documentation'),
    ]).toEqual(SECTION_508);
    expect([
      ...idsIn('Chapter 4: Functional Performance Statements'),
      ...idsIn('Chapter 5: Generic Requirements'),
      ...idsIn('Chapter 12: Documentation'),
    ]).toEqual(EN_301_549);
  });

  it('answers each row in the template’s terms, each WCAG row for Web', () => {
    for (const { id, level, section } of rows()) {
      // A WCAG row answers for Web (the other parts are Not Applicable
      // throughout, as the Notes say), and with a real answer.
      const wcag = section.startsWith('Table');
      const answer = wcag ? level.replace(/^Web: /, '') : level;
      const known =
        LEVELS.includes(answer) &&
        (!wcag ||
          (level.startsWith('Web: ') && answer !== 'See WCAG 2.x section'));
      expect({ id, level, known }).toEqual({ id, level, known: true });
    }
  });

  it('gives a reason on every WCAG row that falls short', () => {
    const short = rows().filter(
      row =>
        row.section.startsWith('Table') &&
        (row.level === 'Web: Partially Supports' ||
          row.level === 'Web: Does Not Support')
    );
    expect(short.length).toBeGreaterThan(0);
    for (const { id, remarks } of short) {
      expect({ id, explained: explainsShortfall(remarks) }).toEqual({
        id,
        explained: true,
      });
    }
  });

  it('takes a cited issue or a gap kept by design as the reason, and nothing else', () => {
    expect(explainsShortfall('A gap ([#123], next major).')).toBe(true);
    expect(explainsShortfall('A gap, by design.')).toBe(true);
    expect(explainsShortfall('By design, the small size stays.')).toBe(true);
    expect(explainsShortfall('A gap no issue tracks.')).toBe(false);
    expect(explainsShortfall('A gap, see #123.')).toBe(false);
    expect(explainsShortfall('A gap designed by hand.')).toBe(false);
  });

  it('defines the by-design phrase in its Notes', () => {
    const start = REPORT.indexOf('**Notes:**');
    const end = REPORT.indexOf('**Evaluation Methods Used:**');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const notes = REPORT.slice(start, end);
    expect(notes).toContain(`"${BY_DESIGN}"`);
  });

  it('links every issue it cites, and cites every issue it links', () => {
    const cited = new Set(
      [...REPORT.matchAll(/\[#(\d+)\](?!:)/g)].map(match => match[1])
    );
    const linked = new Set(
      [
        ...REPORT.matchAll(
          /^\[#(\d+)\]: https:\/\/github\.com\/allxsmith\/bestax\/issues\/(\d+)$/gm
        ),
      ].map(([, label, number]) => {
        expect(number).toBe(label);
        return label;
      })
    );
    expect([...cited].sort()).toEqual([...linked].sort());
  });

  it('keeps the template’s title, edition and service mark notice', () => {
    expect(REPORT).toContain('# Bestax Accessibility Conformance Report');
    expect(REPORT).toContain('International Edition');
    expect(REPORT).toContain('(Based on VPAT® Version 2.5Rev)');
    expect(REPORT).toContain(
      '“Voluntary Product Accessibility Template” and “VPAT” are registered service marks of the\nInformation Technology Industry Council (ITI).'
    );
  });
});
