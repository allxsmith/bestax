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
        ? `**Deprecated.**${p.deprecationNote ? ` ${p.deprecationNote}` : ''}`
        : '',
      p.description,
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

export function renderPart(part: Part, { heading = true } = {}): string {
  const out: string[] = [];
  if (heading) out.push(`### ${part.path}`);
  if (part.summary) out.push(part.summary);
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
            `- \`${t.name}\`: \`${t.expansion}\`${t.summary ? ` — ${t.summary}` : ''}`
        ),
      ].join('\n')
    );
  }
  return out.join('\n\n');
}

export function renderComponent(
  record: ComponentRecord,
  include: string[]
): string {
  const out: string[] = [`# ${record.name}`];
  if (record.summary) out.push(record.summary);
  out.push(`\`\`\`tsx\n${record.import}\n\`\`\``);

  if (record.kind === 'helper') {
    // Helper pages are reference prose with signature blocks, not tables.
    if (record.doc) out.push(record.doc);
  } else if (include.includes('props')) {
    const [root, ...subs] = record.parts;
    if (root) out.push(renderPart(root, { heading: false }));
    if (subs.length) {
      out.push(
        `**Subcomponents:** ${subs.map(s => `\`${s.path}\``).join(', ')}. ` +
          `Call \`get_props\` with a dot-path for any of them.`
      );
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
  }
  if (include.includes('accessibility') && record.accessibility) {
    out.push('## Accessibility', record.accessibility);
  }
  if (include.includes('related') && record.related.length) {
    out.push(`**Related:** ${record.related.map(r => `\`${r}\``).join(', ')}.`);
  }

  const links = [`Docs: ${record.docsUrl}`];
  if (record.storybook) links.push(`Storybook: ${record.storybook}`);
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
  // getting that wrong is the single most common theming failure.
  const scopes = new Set(vars.map(v => v.scope));
  const note = scopes.has('component')
    ? "Variables scoped `component` are declared on the component's own element — " +
      'override them there or via `className`; a value set on an ancestor is only ' +
      'inherited and loses to the component-level declaration.'
    : 'These are declared globally, so overriding them on `:root` (or with the ' +
      '`Theme` component) retheme every instance.';
  return `${body}\n\n${note}`;
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
            `- **${e.name}**${e.compound ? ' (compound)' : ''} — ${e.purpose}`
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
