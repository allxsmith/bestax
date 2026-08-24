/**
 * Markdown surgery for the API reference pages: generated-region markers,
 * top-level section spans, and frontmatter upserts.
 *
 * Everything here is FENCE-AWARE. `docs/docs/api/helpers/theme.md` contains a
 * `---` inside a code fence, and several pages show HTML comments inside `html`
 * fences — a naive line scan would treat those as a section break or a marker
 * and corrupt the page. Every scan therefore runs through `fenceMask()`.
 *
 * Region markers look like:
 *
 *     <!-- bestax:generated props -->
 *     …machine-owned content…
 *     <!-- /bestax:generated props -->
 *
 * The generator only ever rewrites the bytes BETWEEN a marker pair. Content
 * outside the markers — even inside the same `##` section — is preserved
 * byte-for-byte, which is what lets a page carry a generated Overview sentence
 * with hand-written prose and admonitions below it. Deleting a marker pair is
 * the documented opt-out.
 *
 * Malformed markers (duplicate id, unclosed, close-before-open) are always a
 * hard error naming the file and line. Guessing would silently eat prose.
 */

const OPEN_RE = /^<!--\s*bestax:generated\s+([a-z][a-z0-9-]*)\s*-->\s*$/;
const CLOSE_RE = /^<!--\s*\/bestax:generated\s+([a-z][a-z0-9-]*)\s*-->\s*$/;

export function openMarker(id) {
  return `<!-- bestax:generated ${id} -->`;
}

export function closeMarker(id) {
  return `<!-- /bestax:generated ${id} -->`;
}

/** Split into lines, remembering whether the source used CRLF. */
export function splitLines(src) {
  const crlf = src.includes('\r\n');
  return { lines: src.split(/\r?\n/), crlf };
}

export function joinLines(lines, crlf) {
  return lines.join(crlf ? '\r\n' : '\n');
}

/**
 * Boolean per line: true when the line sits INSIDE a fenced code block. The
 * opening and closing fence lines themselves are marked true, so callers never
 * treat a fence delimiter as content either.
 *
 * Tracks the opening fence character and length per CommonMark: a fence is
 * closed only by the same character, at least as long, with no info string.
 */
export function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  for (const { open, close } of fenceSpans(lines)) {
    for (let i = open; i <= close; i++) mask[i] = true;
  }
  return mask;
}

/**
 * The fenced blocks of `lines`, as [{ open, close }] line-index pairs with
 * both delimiters included (`close` is the last line for a fence left
 * unterminated at EOF). The same CommonMark rules as `fenceMask` — in fact
 * fenceMask is derived from this, so the two views cannot disagree. Consumers
 * that need BLOCKS should use this rather than re-deriving structure from the
 * boolean mask: in the mask, butted fences form one continuous run, and a
 * content line shaped like a delimiter is indistinguishable from one.
 */
export function fenceSpans(lines) {
  const spans = [];
  let fence = null; // { char, len }
  let open = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!fence) {
      if (m) {
        // An opening ``` fence may not contain a backtick in its info string.
        const char = m[1][0];
        if (!(char === '`' && m[2].includes('`'))) {
          fence = { char, len: m[1].length };
          open = i;
        }
      }
    } else if (
      m &&
      m[1][0] === fence.char &&
      m[1].length >= fence.len &&
      !m[2].trim()
    ) {
      spans.push({ open, close: i });
      fence = null;
    }
  }
  if (fence) spans.push({ open, close: lines.length - 1 });
  return spans;
}

/**
 * Locate every generated region.
 *
 * @returns Map<id, { open, close, body }> — `open`/`close` are marker line
 *   indices; `body` is the text between them (markers excluded).
 */
export function readRegions(src, label = '<source>') {
  const { lines } = splitLines(src);
  const mask = fenceMask(lines);
  const regions = new Map();
  let open = null;

  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue;
    const line = lines[i].trim();

    const o = line.match(OPEN_RE);
    if (o) {
      if (open) {
        throw new Error(
          `${label}:${i + 1} opens generated region "${o[1]}" while ` +
            `"${open.id}" (opened at line ${open.at + 1}) is still unclosed. ` +
            `Regions cannot nest — close the first one.`
        );
      }
      if (regions.has(o[1])) {
        throw new Error(
          `${label}:${i + 1} re-opens generated region "${o[1]}", already ` +
            `defined at line ${regions.get(o[1]).open + 1}. Each region id may ` +
            `appear once per page.`
        );
      }
      open = { id: o[1], at: i };
      continue;
    }

    const c = line.match(CLOSE_RE);
    if (c) {
      if (!open) {
        throw new Error(
          `${label}:${i + 1} closes generated region "${c[1]}" that was never ` +
            `opened. Add \`${openMarker(c[1])}\` above the content.`
        );
      }
      if (open.id !== c[1]) {
        throw new Error(
          `${label}:${i + 1} closes "${c[1]}" but the open region is ` +
            `"${open.id}" (line ${open.at + 1}). Marker ids must match.`
        );
      }
      regions.set(open.id, {
        open: open.at,
        close: i,
        body: lines.slice(open.at + 1, i).join('\n'),
      });
      open = null;
    }
  }

  if (open) {
    throw new Error(
      `${label}:${open.at + 1} opens generated region "${open.id}" but it is ` +
        `never closed. Add \`${closeMarker(open.id)}\`.`
    );
  }
  return regions;
}

/**
 * Replace one region's body. Byte-preserving outside the region. Returns the
 * source unchanged when the region is absent — absence is the opt-out, not an
 * error, so callers decide whether to complain.
 */
export function replaceRegion(src, id, body, label = '<source>') {
  const regions = readRegions(src, label);
  const region = regions.get(id);
  if (!region) return src;
  const { lines, crlf } = splitLines(src);
  const next = [
    ...lines.slice(0, region.open + 1),
    ...body.split('\n'),
    ...lines.slice(region.close),
  ];
  return joinLines(next, crlf);
}

/**
 * Top-level (`## `) section spans, fence-aware.
 *
 * A section runs from its heading line to the line before the next `## `
 * heading (or EOF), so it owns its own trailing `---` thematic break and blank
 * lines. `preamble` is everything before the first `## ` (frontmatter + H1).
 */
export function sectionSpans(src) {
  const { lines } = splitLines(src);
  const mask = fenceMask(lines);
  const heads = [];
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue;
    const m = lines[i].match(/^##[ \t]+(.+?)[ \t]*$/);
    if (m) heads.push({ heading: m[1], start: i });
  }
  const sections = heads.map((h, idx) => ({
    heading: h.heading,
    start: h.start,
    end: idx + 1 < heads.length ? heads[idx + 1].start : lines.length,
  }));
  return {
    lines,
    sections,
    preambleEnd: heads.length ? heads[0].start : lines.length,
  };
}

/** Section body text (heading line excluded, trailing `---`/blanks trimmed). */
export function sectionBody(lines, section) {
  const body = lines.slice(section.start + 1, section.end);
  while (body.length && !body[body.length - 1].trim()) body.pop();
  if (body.length && body[body.length - 1].trim() === '---') body.pop();
  while (body.length && !body[body.length - 1].trim()) body.pop();
  while (body.length && !body[0].trim()) body.shift();
  return body.join('\n');
}

/**
 * Insert or update a frontmatter key, preserving key order and the rest of the
 * block. Used for `description:` — `docusaurus-plugin-llms` picks each page's
 * llms.txt description from the first non-heading paragraph, which after
 * migration is a marker line, so the description has to be explicit.
 */
/**
 * A plain YAML scalar unless the value needs quoting. Generated Overview
 * sentences are prose, and one of them contains ": " — `Menu` reads "provides
 * Bulma's vertical navigation menu: a simple, accessible sidebar…" — which
 * makes the frontmatter parse as a nested mapping and fails the docs build.
 * Quoted only when necessary, so the other 80 pages keep their bare form.
 */
/** Literal-ise a frontmatter key before it becomes a regex. */
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function yamlScalar(value) {
  const needsQuotes =
    /: |:\t|\s#|^[\s>|&*!%@`"'{}[\],]|[:\s]$/.test(value) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(value) ||
    /^[-+.]?\d/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function upsertFrontmatter(src, key, value, after = null) {
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) throw new Error('page has no frontmatter block');
  const eol = m[1].includes('\r\n') ? '\r\n' : '\n';
  const lines = m[2].split(/\r?\n/);
  const line = `${key}: ${yamlScalar(value)}`;
  const at = lines.findIndex(l => new RegExp(`^${escapeRe(key)}:`).test(l));

  if (at >= 0) {
    lines[at] = line;
  } else {
    const afterAt = after
      ? lines.findIndex(l => new RegExp(`^${escapeRe(after)}:`).test(l))
      : -1;
    if (afterAt >= 0) lines.splice(afterAt + 1, 0, line);
    else lines.push(line);
  }
  return (
    src.slice(0, m.index) +
    m[1] +
    lines.join(eol) +
    m[3] +
    src.slice(m.index + m[0].length)
  );
}

/**
 * First sentence of a prose line.
 *
 * Deliberately the SAME rule as `overviewSentence()` in
 * gen-component-catalog.mjs — a period ending a word of more than one character
 * (so "e.g." doesn't split), and only when the result is long enough to be a
 * real sentence. The generated Overview must round-trip through that function
 * unchanged, or the skill catalog churns on every run.
 */
export function firstSentence(text) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  const m = s.match(/^.*?[A-Za-z0-9)"'`][.](?=\s|$)/);
  return m && m[0].length >= 40 ? m[0] : s;
}

/**
 * Escape a cell for a markdown table. `|` must be backslash-escaped even inside
 * an inline-code span, because the table parser splits on pipes BEFORE inline
 * code is parsed — see the hand-written `avatar.md` rows, which do the same.
 */
export function escapeCell(text) {
  return (
    codeSpanBareTags(String(text))
      // Backslash first. A cell ending in `\` immediately before a `|` would
      // otherwise produce `\\|`, where the second backslash is consumed as an
      // escape and the pipe survives — splitting the row into an extra column.
      .replace(/\\/g, '\\\\')
      .replace(/\|/g, '\\|')
      .replace(/\r?\n/g, ' ')
      .trim()
  );
}

/**
 * Backtick a bare `<Tag>` that is not already inside a code span.
 *
 * MDX parses `<Icon>` in a table cell as JSX and then fails the whole build
 * looking for a closing tag — `Rate`'s TSDoc says "renders <Icon> instead of
 * default SVG". An author writing a component name in a comment cannot be
 * expected to know it will be spliced into markdown, so fix it here rather
 * than policing every comment.
 */
function codeSpanBareTags(text) {
  return text
    .split(/(`[^`]*`)/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(/<\/?[A-Za-z][\w.-]*\s*\/?>/g, tag => `\`${tag}\``)
    )
    .join('');
}

/**
 * Render a markdown table. Deliberately NOT column-padded: the generator runs
 * prettier over the whole file afterwards, which pads every cell to the house
 * width. Padding here as well would just be a second, divergent implementation.
 */
export function renderTable(headers, rows) {
  const out = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(cells => `| ${cells.map(escapeCell).join(' | ')} |`),
  ];
  return out.join('\n');
}
