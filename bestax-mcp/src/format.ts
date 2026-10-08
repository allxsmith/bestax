/**
 * Rendering for tool responses.
 *
 * Responses are markdown, not JSON. The consumer is a language model, and a
 * prop table it can read costs fewer tokens than the same data as nested
 * objects with repeated keys — and it does not tempt the model into echoing
 * JSON structure back into the code it writes.
 *
 * The other rule here is that nothing is dumped in full when a summary will do.
 * `get_component` returns a component's props; the 24 usage examples are a
 * separate call, because most questions do not need them.
 */
import type {
  CatalogEntry,
  ComponentRecord,
  CssVar,
  Example,
  Part,
  PropRow,
  Skill,
} from './data.js';

/** Escape a cell for a markdown table — the parser splits on pipes first. */
const cell = (text: string) =>
  String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();

/**
 * Tag an outbound link with `utm_source=bestax-mcp` so a docs or Storybook
 * visit that started here shows up as such in the site analytics. Render-time
 * only — the URLs in `data/` are generated and stay canonical. Idempotent, and
 * anything that is not an http(s) URL passes through unchanged.
 *
 * Two kinds of link go through here. The ones this server composes itself:
 * the Docs/Storybook footer on component responses and the version-drift
 * notice. And the bestax.io links inside index text, such as a summary, an
 * accessibility note or a prose page, which the generator made canonical and
 * `attributedLinks` tags at render time, one field at a time, leaving code
 * fences and code spans alone.
 *
 * Skill bodies and skill reference docs are not index text. `get_skill`, the
 * MCP prompts and the skill resources serve them verbatim from the bundled
 * markdown, untagged links included, and so do the skill-sourced sections
 * prepended to other answers. Do not "fix" that by running either function
 * over them, or over a whole response: examples are code, and a URL inside
 * one is part of the program.
 */
export function attributed(url: string): string {
  if (!/^https?:\/\//.test(url)) return url;
  // Split the fragment FIRST: the already-tagged check below must inspect
  // only the query. A `#utm_source=bestax-mcp` inside a fragment (or the
  // same text inside another parameter's value) is not attribution — the
  // analytics request never sees it — so matching it would skip tagging.
  // Do not use URL.searchParams: it re-encodes Storybook `path=/story/...`
  // as `%2F`.
  const hashIndex = url.indexOf('#');
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1);
  if (query.split('&').includes('utm_source=bestax-mcp')) return url;
  const sep = queryIndex === -1 ? '?' : '&';
  return `${withoutHash}${sep}utm_source=bestax-mcp${hash}`;
}

/** Stands in for a code span or an escaped character in a block's shadow. */
const MASK = '\0';

/**
 * A link destination into bestax.io, read in a block's shadow: `](` then the
 * URL, bare or in angle brackets, and what may close a link after it (a title,
 * then `)`). A bare URL in prose has no `](` before it, and `bestax.io.other`
 * fails the character after the host. Neither class admits MASK, so a target
 * that runs into a code span is never read.
 */
const SITE_TARGET =
  /\]\([ \t]*\n?[ \t]*(<https:\/\/bestax\.io(?:[/?#][^<>\n\0]*)?>|https:\/\/bestax\.io(?:[/?#][^\s<>()\0]*)?)(?=(?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?\s*\))/g;

/**
 * A block as inline markdown reads it: code spans and backslash-escaped
 * characters replaced by MASK, the same length, so an offset in one is the
 * same place in the other. A run of backticks with no run of the same length
 * after it opens nothing, and stays.
 */
function shadowOf(block: string): string {
  let out = '';
  let i = 0;
  while (i < block.length) {
    if (block[i] === '\\' && /[!-/:-@[-`{-~]/.test(block[i + 1] ?? '')) {
      out += MASK + MASK;
      i += 2;
      continue;
    }
    if (block[i] !== '`') {
      out += block[i++];
      continue;
    }
    let run = 1;
    while (block[i + run] === '`') run++;
    let close = block.indexOf('`', i + run);
    while (close !== -1) {
      let length = 1;
      while (block[close + length] === '`') length++;
      if (length === run) break;
      close = block.indexOf('`', close + length);
    }
    const end = close === -1 ? i + run : close + run;
    out += close === -1 ? block.slice(i, end) : MASK.repeat(end - i);
    i = end;
  }
  return out;
}

/**
 * Whether the `]` at `close` ends a link's text: a `[` opens it, and no `!`
 * before that makes it an image.
 */
function closesLinkText(shadow: string, close: number): boolean {
  let depth = 0;
  for (let i = close - 1; i >= 0; i--) {
    if (shadow[i] === ']') depth++;
    else if (shadow[i] === '[' && depth-- === 0) return shadow[i - 1] !== '!';
  }
  return false;
}

/** One block of prose, with no fence or blank line in it, its site links tagged. */
function attributedBlock(block: string): string {
  if (!block.includes('https://bestax.io')) return block;
  const shadow = shadowOf(block);
  let out = '';
  let last = 0;
  for (const match of shadow.matchAll(SITE_TARGET)) {
    if (!closesLinkText(shadow, match.index)) continue;
    const target = match[1];
    const at = match.index + match[0].length - target.length;
    out +=
      block.slice(last, at) +
      (target.startsWith('<')
        ? `<${attributed(target.slice(1, -1))}>`
        : attributed(target));
    last = at + target.length;
  }
  return out + block.slice(last);
}

/**
 * `attributed` applied to the destination of every markdown link into
 * bestax.io in a piece of index text: `[text](https://bestax.io/…)`, in angle
 * brackets or not, with a title or without. Everything else is left as it is
 * written: fenced code (``` or ~~~, at any indent, as a fence in a list item
 * sits), code spans, images, a bare URL, a relative link, a link to another
 * host. Idempotent, like `attributed`.
 *
 * For one field of a record at a time, never a whole response: see
 * `attributed` for what must not go through here.
 */
export function attributedLinks(markdown: string): string {
  if (!markdown.includes('https://bestax.io')) return markdown;
  const out: string[] = [];
  let block: string[] = [];
  let fence: { char: string; length: number } | null = null;
  const flush = () => {
    if (block.length) out.push(attributedBlock(block.join('\n')));
    block = [];
  };
  for (const line of markdown.split('\n')) {
    if (fence) {
      const t = line.trim();
      if (t.length >= fence.length && t === fence.char.repeat(t.length)) {
        fence = null;
      }
      out.push(line);
      continue;
    }
    // A backtick fence's info string holds no backtick, so ```a``` is a code span.
    const open = /^[ \t]*(`{3,}|~{3,})(.*)$/.exec(line);
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      flush();
      fence = { char: open[1][0], length: open[1].length };
      out.push(line);
    } else if (!line.trim()) {
      flush();
      out.push(line);
    } else {
      block.push(line);
    }
  }
  flush();
  return out.join('\n');
}

export function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return '';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(r => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n');
}

function propRows(props: PropRow[]): string[][] {
  return props.map(p => {
    const notes = [
      p.deprecated
        ? `**Deprecated.**${
            p.deprecationNote ? ` ${attributedLinks(p.deprecationNote)}` : ''
          }`
        : '',
      attributedLinks(p.description),
      // The valid-value unions are too large to inline in a cell; name the page
      // that lists them so the model can ask for it rather than guess.
      p.valuesRef ? `(values: ${p.valuesRef})` : '',
    ].filter(Boolean);
    return [
      `\`${p.name}\``,
      `\`${p.type}\``,
      p.default ? `\`${p.default}\`` : '—',
      notes.join(' '),
    ];
  });
}

export function renderPart(
  part: Part,
  { heading = true, summary = true } = {}
): string {
  const out: string[] = [];
  if (heading) out.push(`### ${part.path}`);
  if (summary && part.summary) out.push(attributedLinks(part.summary));
  if (part.component) {
    out.push(
      `Also exported standalone as \`${part.component}\` — call \`get_props\` with that name for its full table.`
    );
  }

  const rows = [...propRows(part.props), ...propRows(part.extraProps)];
  if (part.catchAll) {
    rows.push(['`...`', part.catchAll, '—', 'See `get_helper_props`.']);
  }
  if (rows.length) {
    out.push(table(['Prop', 'Type', 'Default', 'Notes'], rows));
  } else if (!part.component) {
    out.push('No props of its own beyond the standard HTML attributes.');
  }

  if (part.types.length) {
    out.push(
      [
        '**Types:**',
        '',
        ...part.types.map(
          t =>
            `- \`${t.name}\`: \`${t.expansion}\`${
              t.summary ? ` — ${attributedLinks(t.summary)}` : ''
            }`
        ),
      ].join('\n')
    );
  }
  return out.join('\n\n');
}

/**
 * The page `get_helper_props` reads: the helper props reference lives on this
 * hook's documentation, so it is the one helper whose answer names that tool.
 */
export const HELPER_PROPS_PAGE = 'useBulmaClasses';

/**
 * A prose page as it is served, its bestax.io links tagged. The size the
 * pointers quote is this text's, so it matches what the caller gets.
 */
export const referenceOf = (record: ComponentRecord): string =>
  attributedLinks(record.doc ?? '');

/**
 * What a hook or utility has instead of a props table: its `## API` signature
 * block, when the page has one, and where the rest of its documentation is.
 *
 * Both `get_component` and `get_props` answer with this. It used to point every
 * helper at `get_helper_props`, which describes the helper props and none of
 * these hooks, so `useFocusTrap` was sent somewhere that never mentions it
 * (#933). The pointers carry the page size because useBulmaClasses' page runs
 * to tens of thousands of characters, and a caller deciding whether to fetch
 * it should know that first.
 */
export function renderHelperApi(record: ComponentRecord): string {
  const out: string[] = [];
  if (record.api) out.push('## API', attributedLinks(record.api));
  const next = [
    `pass \`include: ["reference"]\` to \`get_component\` for its whole ` +
      `documentation page (${referenceOf(record).length.toLocaleString(
        'en-US'
      )} characters)`,
  ];
  if (record.examples.length) {
    next.push(
      `call \`get_examples({ component: "${record.name}" })\` for its ` +
        `${record.examples.length} working example${
          record.examples.length === 1 ? '' : 's'
        }`
    );
  }
  out.push(
    `\`${record.name}\` is not a component, so it has no prop table. ` +
      `${record.api ? 'For more than the signature above' : 'For its API'}, ` +
      `${next.join(', or ')}.`
  );
  if (record.name === HELPER_PROPS_PAGE) {
    out.push(
      'The helper props it reads, with their accepted values, are in ' +
        '`get_helper_props()`, or `get_helper_props({ group })` for one area.'
    );
  }
  return out.join('\n\n');
}

/**
 * Where the rest of a component documented in prose is. Theme's page describes
 * far more than its table, and nothing else on a default answer led to it once
 * Theme stopped being answered as a helper (#933).
 */
export function referencePointer(record: ComponentRecord): string {
  return (
    `\`${record.name}\`'s documentation page has more than this table: ` +
    `\`get_component({ name: "${record.name}", include: ["reference"] })\` ` +
    `returns all of it (${referenceOf(record).length.toLocaleString(
      'en-US'
    )} characters).`
  );
}

/**
 * Where `get_component` lands for a dot-path: the part it names, or, for a path
 * that names none, the family with a line saying so. It used to answer
 * `Navbar.Brand` with Navbar's own table and no word about the switch (#935).
 */
export interface PartFocus {
  /** The dot-path as asked. */
  wanted: string;
  /** The part it names, or null when it names none. */
  part: Part | null;
}

export function renderComponent(
  record: ComponentRecord,
  include: string[],
  focus?: PartFocus
): string {
  const part =
    focus?.part && focus.part !== record.parts[0] ? focus.part : null;
  const out: string[] = [`# ${part ? part.path : record.name}`];
  if (part) {
    out.push(
      `\`${part.path}\` is a part of \`${record.name}\`, used through the import ` +
        `below. The props are the part's own; any examples, CSS variables and ` +
        `notes are the whole family's, and ` +
        `\`get_component({ name: "${record.name}" })\` has the family's table.`
    );
    if (part.summary) out.push(attributedLinks(part.summary));
  } else {
    if (focus && !focus.part) {
      out.push(
        `\`${record.name}\` has no part \`${focus.wanted}\`, so this is ` +
          `\`${record.name}\` itself. ` +
          (record.parts.length > 1
            ? `Its parts: ${record.parts
                .slice(1)
                .map(p => `\`${p.path}\``)
                .join(', ')}.`
            : 'It has no parts.')
      );
    }
    if (record.summary) out.push(attributedLinks(record.summary));
  }
  out.push(`\`\`\`tsx\n${record.import}\n\`\`\``);

  // A page written as prose is opt-in, because useBulmaClasses' runs to tens of
  // thousands of characters. It used to be pushed unconditionally for every helper,
  // so the DEFAULT call returned all of it and no argument could ask for less.
  const reference = include.includes('reference') && referenceOf(record);
  if (record.kind === 'helper') {
    out.push(reference || renderHelperApi(record));
  } else {
    if (include.includes('props') && part) {
      out.push(renderPart(part, { heading: false, summary: false }));
    } else if (include.includes('props')) {
      const [root, ...subs] = record.parts;
      // The root part's summary is the component's, already printed above; printed
      // again it doubled every answer's opening paragraph (#935).
      if (root) {
        out.push(
          renderPart(root, {
            heading: false,
            summary: root.summary !== record.summary,
          })
        );
      }
      if (subs.length) {
        out.push(
          `**Subcomponents:** ${subs.map(s => `\`${s.path}\``).join(', ')}. ` +
            `Call \`get_props\` with a dot-path for any of them.`
        );
      }
    }
    // A component documented in prose (Theme) keeps its page alongside the table.
    // The pointer speaks of "this table", so it goes only where one was printed:
    // `include` replaces the default, and a call without `props` has none.
    if (reference) out.push('## Reference', reference);
    else if (record.doc && include.includes('props')) {
      out.push(referencePointer(record));
    }
  }

  if (include.includes('examples') && record.examples.length) {
    out.push('## Examples', renderExamples(record.examples.slice(0, 5)));
    if (record.examples.length > 5) {
      out.push(
        `_${record.examples.length - 5} more — call \`get_examples\` for the rest._`
      );
    }
  }
  if (include.includes('cssVars') && record.cssVars.length) {
    out.push('## CSS Variables', renderCssVars(record.cssVars));
  } else if (record.cssVars.length) {
    // Routing, not a second tool call: get_component can already serve this on the
    // call being made, so the fix is a pointer at `include`, not at get_css_variables.
    // A 20-run eval (issue #501) found get_css_variables reached 1/10 MCP-only builders
    // in an arm where every one themed the site by hand instead.
    out.push(
      `\`${record.name}\` has ${record.cssVars.length} CSS variable${
        record.cssVars.length === 1 ? '' : 's'
      } for theming — pass \`include: ["cssVars"]\` to see them.`
    );
  }
  if (include.includes('accessibility') && record.accessibility) {
    out.push('## Accessibility', attributedLinks(record.accessibility));
  }
  if (include.includes('related') && record.related.length) {
    out.push(`**Related:** ${record.related.map(r => `\`${r}\``).join(', ')}.`);
  }

  const links = [`Docs: ${attributed(record.docsUrl)}`];
  if (record.storybook) {
    links.push(`Storybook: ${attributed(record.storybook)}`);
  }
  out.push(links.join(' · '));
  return out.join('\n\n');
}

export function renderExamples(examples: Example[]): string {
  return examples
    .map(e => `### ${e.title}\n\n\`\`\`tsx\n${e.code}\n\`\`\``)
    .join('\n\n');
}

export function renderCssVars(vars: CssVar[]): string {
  const body = table(
    ['CSS Variable', 'Sass Variable', 'Default'],
    vars.map(v => [
      `\`${v.css}\``,
      v.sass ? `\`${v.sass}\`` : '—',
      `\`${v.default}\``,
    ])
  );
  // Where Bulma declares the default decides where an override has to go, and
  // getting that wrong is the single most common theming failure — including
  // by this function: collapsing compound-declared variables into the
  // override-via-className advice re-created #464 on the MCP surface.
  const scopes = new Set(vars.map(v => v.scope));
  const notes: string[] = [];
  if (scopes.has('root')) {
    notes.push(
      "Variables scoped `root` are declared on the component's own element — " +
        'override them there or via `className`; a value set on an ancestor ' +
        'is only inherited and loses to the component-level declaration.'
    );
  }
  if (scopes.has('compound')) {
    notes.push(
      'Variables scoped `compound` are declared on a compound selector ' +
        '(higher specificity than a single class): a lone class added via ' +
        '`className` loses — override with inline `style`, or a selector ' +
        'that exceeds that specificity (one that only matches it must ' +
        'load after the library styles to win by source order).'
    );
  }
  if (scopes.has('element')) {
    notes.push(
      'Variables scoped `element` are declared on a constituent element ' +
        '(e.g. `.tooltip-content`): values set via `className`, the `style` ' +
        'prop, or an ancestor are only inherited and lose — target the ' +
        'declaring element in your CSS.'
    );
  }
  if (scopes.has('global')) {
    notes.push(
      'Variables scoped `global` are declared on `:root` — override them ' +
        'there (or with the `Theme` component) to retheme every instance.'
    );
  }
  return `${body}\n\n${notes.join('\n\n')}`;
}

export function renderCatalog(entries: CatalogEntry[]): string {
  const byCategory = new Map<string, CatalogEntry[]>();
  for (const e of entries) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }
  return [...byCategory]
    .map(([category, list]) =>
      [
        `## ${category}`,
        ...list.map(
          e =>
            `- **${e.name}**${e.compound ? ' (compound)' : ''} — ${attributedLinks(
              e.purpose
            )}`
        ),
      ].join('\n')
    )
    .join('\n\n');
}

export function renderSkills(skills: Skill[]): string {
  return skills
    .map(s =>
      [
        `## ${s.name}`,
        s.description,
        s.references.length
          ? `References: ${s.references.map(r => `\`${r.id}\``).join(', ')} — ` +
            `call \`get_skill\` with \`reference\` to read one.`
          : null,
        `MCP prompt: \`${s.promptName}\`.`,
      ]
        .filter(Boolean)
        .join('\n\n')
    )
    .join('\n\n');
}

/** Wrap a body as an MCP text result, appending the version note when there is one. */
export function textResult(body: string, note: string | null) {
  return {
    content: [
      { type: 'text' as const, text: note ? `${body}\n\n${note}` : body },
    ],
  };
}

export function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}
