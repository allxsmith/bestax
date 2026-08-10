/**
 * The bestax MCP server.
 *
 * Nine tools, four resource templates, and one prompt per Agent Skill — all
 * built from the generated index in `data/`, so nothing here carries a list
 * that can drift from the library.
 *
 * Two things shape the surface:
 *
 * 1. PROGRESSIVE DISCLOSURE. `search_bestax` and `list_components` are cheap
 *    and every result names the tool to call next; the expensive things (full
 *    prop tables, 24 usage examples, a 23 KB skill reference) are separate
 *    calls. A server that returns everything on the first call spends the
 *    context the client needs for the actual task.
 *
 * 2. MORE THAN A PROP LOOKUP. bestax is a component library with opinions —
 *    helper props instead of inline styles, `--bulma-*` overrides instead of
 *    hand-written CSS, Field/Control composition instead of bare inputs. Those
 *    live in the skills, so the skills ship as prompts and resources rather
 *    than being left to a separate install step.
 */
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
  loadCatalog,
  loadComponent,
  loadSkills,
  loadSkillFile,
  resolveName,
  type ComponentRecord,
} from './data.js';
import {
  errorResult,
  renderCatalog,
  renderComponent,
  renderCssVars,
  renderExamples,
  renderPart,
  renderSkills,
  table,
  textResult,
} from './format.js';
import { searchAll, suggest, type HitKind } from './search.js';
import { resolveVersions, versionNote, type VersionInfo } from './version.js';

const ALL_KINDS: HitKind[] = [
  'component',
  'prop',
  'example',
  'css-var',
  'skill',
];
/**
 * Bounds on the free-text arguments, because this is a single-threaded stdio process and
 * every one of them feeds a linear scan.
 *
 * Unbounded, `query` reached `new RegExp` per term per haystack over ~1,500 props and ~900
 * examples: 3,000 terms blocked the event loop for 5.8 s, and a single ~40 KB token threw
 * "Regular expression too large" and reflected the whole query back as the error text. An
 * unbounded `name` fed the not-found suggester's edit-distance scan — 1 MB blocked for 9.3 s.
 * Rejecting at the schema costs the model one retry with a readable message; the alternative
 * costs every other request on the connection.
 *
 * Both limits sit far above any real value: the longest component name is 20 characters and
 * a useful search query is a handful of words.
 */
const MAX_NAME = 100;
const MAX_QUERY = 200;

/**
 * Every tool here answers from a read-only index that ships inside this package: nothing
 * writes, nothing calls out to the network, and the same arguments always reach the same
 * committed files. Saying so is what lets a client stop asking the user to approve a
 * documentation lookup — without these hints, a well-behaved client must treat every call as
 * potentially destructive and prompt.
 */
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const INCLUDES = [
  'props',
  'examples',
  'cssVars',
  'accessibility',
  'related',
] as const;

/** Load every component record. Only `search_bestax` needs this much. */
async function allComponents(): Promise<ComponentRecord[]> {
  const catalog = await loadCatalog();
  return Promise.all(catalog.components.map(c => loadComponent(c.name)));
}

export interface CreateServerOptions {
  /** Directory to resolve the consumer's installed library from. */
  cwd?: string;
}

export async function createServer(
  options: CreateServerOptions = {}
): Promise<McpServer> {
  const catalog = await loadCatalog();
  const skills = await loadSkills();
  const versions: VersionInfo = await resolveVersions(
    catalog.generatedFrom.version,
    options.cwd
  );
  const note = () => versionNote(versions);

  const server = new McpServer(
    { name: 'bestax', version: catalog.generatedFrom.version },
    {
      // "Start with list_components" is measured, not assumed. Across twenty eval runs
      // (eval/agent-loop/runs-v2/aggregate.md) list_components was called by 10/10 builders
      // and search_bestax by 0/10 — despite this string previously naming search as the
      // entry point. A cold-start builder's first question is "what does this library
      // have?", which is enumeration; search answers "what is the thing called X?", which
      // only arises once you know what you are missing. The docs were wrong about the first
      // move, not the builders.
      instructions:
        `Documentation for @allxsmith/bestax-bulma ${catalog.generatedFrom.version} — ` +
        `React components for Bulma v1. Start with list_components to see what exists; ` +
        `its output names the tool to call next. Use search_bestax when you need a ` +
        `component whose name you do not know. Before writing any styling by hand, call ` +
        `get_helper_props: this library expects spacing, colour and typography ` +
        `to go through helper props rather than inline styles, and theming to go ` +
        `through --bulma-* variables rather than custom CSS.`,
    }
  );

  // Appended to every list_components answer, for the same reason the inline-style rule
  // moved into get_helper_props: put guidance where the traffic already is.
  //
  // The eval (eval/agent-loop/runs-v2/aggregate.md) measured which tools ten MCP-only
  // builders actually reached for. list_components: 10/10. search_bestax, which the server's
  // own instructions name as the entry point: 0/10 — every builder enumerated instead of
  // searching, and its results are what would otherwise have named the next tool.
  // get_css_variables: 1/10, in an arm where every single run themed the site.
  //
  // The skills line is the important one. Builders pulled bestax-theming 10/10 and
  // bestax-layout-scaffold 2/10, and layout-scaffold is the only place the no-inline-style
  // rule lives — the two runs that pulled it are the only two that wrote zero inline styles.
  // Nothing was telling them it existed at the moment they were choosing components.
  const NEXT_STEPS =
    `\n\n---\n\n` +
    `**Next:** \`get_component({ name })\` for props, examples and CSS variables · ` +
    `\`get_props\` for one table, including compound parts like \`Navbar.Brand\` · ` +
    `\`get_examples\` for working \`tsx\` · \`get_css_variables\` **before** theming a ` +
    `component by hand.\n\n` +
    `**Before writing layout or styling**, read the how-to guides — they carry rules the ` +
    `prop tables do not. \`get_skill({ name: "bestax-layout-scaffold" })\` has the ` +
    `inline-style → helper-prop mapping (this library expects props, not \`style={{}}\` ` +
    `and not hand-written Bulma classes); ` +
    `\`get_skill({ name: "bestax-custom-component" })\` has the spine every reusable ` +
    `component needs. \`list_skills\` has all seven.\n\n` +
    // Placed here rather than left to bestax-layout-scaffold, for the reason the footer
    // itself exists: eval/agent-loop/runs-v4 measured that skill reaching 4 builders in 10,
    // and the arm-level result was a flat null while the four it did reach used LinkButton
    // 4/4 against 1/6. Guidance only counts where it is delivered, and list_components is
    // called by 10/10.
    `**Three components core Bulma will talk you out of.** Everything else here gets ` +
    `found because Bulma has no equivalent; these have a near-miss close enough to end ` +
    `the search. For a brief self-dismissing confirmation use **Toast** ` +
    `(\`<ToastContainer />\` at the app root, then \`toast.success('Saved')\`) — not ` +
    `\`Notification\`/\`Message\`, which you must place and dismiss yourself. For a confirm ` +
    `or alert use **Dialog** (\`<DialogContainer />\` at the root, then ` +
    `\`await dialog.confirm({ title, message })\`) — not \`Modal\`, which is an empty shell ` +
    `you rebuild the title, message and buttons inside. For a control that reads as text ` +
    `or a link but does something, use **LinkButton** — not \`<a href="#">\`, ` +
    `\`<div onClick>\` or \`Button color="text"\`. Mounting a container without calling ` +
    `\`toast.*\`/\`dialog.*\` is not usage.`;

  // The single highest-leverage thing this server says, prepended to every
  // get_helper_props answer.
  //
  // Why here: a 20-run eval (eval/agent-loop/runs-v2/aggregate.md) found that all ten
  // MCP-only runs called get_helper_props, and eight of them still wrote 46-162 inline
  // styles — while all ten skills-channel runs wrote zero. The two MCP runs that wrote zero
  // were exactly the two that pulled bestax-layout-scaffold, which is the only place the
  // prohibition and its mapping table live. Skills auto-trigger on description match; an MCP
  // tool has to be asked for, and nobody asks for layout guidance when the task does not
  // sound like layout. So the rule is moved to the tool everyone already calls.
  //
  // Sourced from the skill rather than copied, so the two cannot drift. Failure is
  // non-fatal: a missing or restructured skill costs the preamble, never the reference.
  const inlineStyleRule = async (): Promise<string> => {
    const heading = '## Inline style → helper prop mapping';
    try {
      const md = await loadSkillFile('bestax-layout-scaffold');
      const start = md.indexOf(heading);
      if (start < 0) return '';
      const end = md.indexOf('\n## ', start + 1);
      const section = md.slice(start, end < 0 ? undefined : end).trimEnd();
      return (
        `**Do not write inline \`style={{ … }}\`, and do not hand-write Bulma ` +
        `\`className\`s.** Spacing, colour, typography, flex and visibility are ` +
        `props on every component. Translate the declaration you were about to ` +
        `inline using the table below; if nothing matches (\`maxWidth\`, a ` +
        `one-off gradient), add a named class to the project stylesheet and pass ` +
        `it via \`className\` — still never inline \`style\`.\n\n${section}\n\n---\n\n`
      );
    } catch {
      return '';
    }
  };

  const notFound = async (name: string) => {
    const names = catalog.components.map(c => c.name);
    const near = suggest(name, names);
    return errorResult(
      `No component named "${name}". ` +
        (near.length
          ? `Did you mean ${near.map(n => `"${n}"`).join(', ')}? `
          : '') +
        `Call list_components to see all ${names.length}.`
    );
  };

  // -- Discovery ------------------------------------------------------------

  server.registerTool(
    'search_bestax',
    {
      title: 'Search bestax',
      annotations: READ_ONLY,
      description:
        'Search components, props, usage examples, CSS variables and agent ' +
        'skills at once. The entry point — each hit names the tool to call for ' +
        'the full thing. Use this before guessing a component name.',
      inputSchema: {
        query: z
          .string()
          .max(MAX_QUERY)
          .describe(
            'What you are looking for, e.g. "date picker" or "spacing"'
          ),
        kind: z
          .enum(['component', 'prop', 'example', 'css-var', 'skill', 'all'])
          .optional()
          .describe('Restrict to one kind of result. Defaults to all.'),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ query, kind, limit }) => {
      const kinds = !kind || kind === 'all' ? ALL_KINDS : [kind as HitKind];
      // Prop and example hits need every component record; the other kinds are
      // answerable from the catalog alone, so don't pay for them.
      const needsAll = kinds.includes('prop') || kinds.includes('example');
      const hits = searchAll(
        query,
        catalog,
        needsAll ? await allComponents() : [],
        skills,
        kinds
      ).slice(0, limit ?? 15);

      if (!hits.length) {
        return textResult(
          `No matches for "${query}". Call list_components for the full catalog, ` +
            `or list_skills for the how-to guides.`,
          note()
        );
      }
      return textResult(
        table(
          ['Kind', 'Name', 'Detail', 'Next'],
          hits.map(h => [h.kind, h.name, h.detail, `\`${h.next}\``])
        ),
        note()
      );
    }
  );

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      annotations: READ_ONLY,
      description:
        'Every documented component with a one-line purpose, grouped by ' +
        'category. Cheap — use it to find the right name before calling ' +
        'get_component.',
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe(
            'elements, components, form, columns, grid, layout, helpers'
          ),
      },
    },
    async ({ category }) => {
      const entries = category
        ? catalog.components.filter(
            c => c.category.toLowerCase() === category.toLowerCase()
          )
        : catalog.components;
      if (!entries.length) {
        return errorResult(
          `No category "${category}". Available: ${catalog.categories
            .map(c => c.id)
            .join(', ')}.`
        );
      }
      return textResult(renderCatalog(entries) + NEXT_STEPS, note());
    }
  );

  // -- Component detail -----------------------------------------------------

  server.registerTool(
    'get_component',
    {
      title: 'Get component documentation',
      annotations: READ_ONLY,
      description:
        'Import statement, summary and prop table for one component. Add ' +
        '`include` for examples, CSS variables, accessibility notes or related ' +
        'components.',
      inputSchema: {
        name: z
          .string()
          .max(MAX_NAME)
          .describe('Component name, e.g. "Button" or "Navbar"'),
        include: z
          .array(z.enum(INCLUDES))
          .optional()
          .describe('Extra sections. Defaults to ["props"].'),
      },
    },
    async ({ name, include }) => {
      const resolved = await resolveName(name);
      if (!resolved) return notFound(name);
      const record = await loadComponent(resolved);
      return textResult(renderComponent(record, include ?? ['props']), note());
    }
  );

  server.registerTool(
    'get_props',
    {
      title: 'Get props',
      annotations: READ_ONLY,
      description:
        'The prop table for a component, or for one part of a compound family ' +
        '(pass a dot-path like "Navbar.Brand"). Cheaper than get_component when ' +
        'the props are all you need.',
      inputSchema: {
        component: z
          .string()
          .max(MAX_NAME)
          .describe('Component name, e.g. "Navbar"'),
        path: z
          .string()
          .max(MAX_NAME)
          .optional()
          .describe('Dot-path of a subcomponent, e.g. "Navbar.Brand"'),
      },
    },
    async ({ component, path }) => {
      const resolved = await resolveName(component);
      if (!resolved) return notFound(component);
      const record = await loadComponent(resolved);

      if (record.kind === 'helper') {
        return textResult(
          `\`${record.name}\` is a hook/utility, not a component — it has no ` +
            `prop table. Call get_component({ name: "${record.name}" }) for its API.`,
          note()
        );
      }

      // A dot-path given as `path`, or folded into `component` ("Navbar.Brand").
      const wanted = path ?? (component.includes('.') ? component : null);
      if (!wanted) {
        const [root, ...subs] = record.parts;
        const body = [renderPart(root, { heading: false })];
        if (subs.length) {
          body.push(
            `**Subcomponents:** ${subs.map(s => `\`${s.path}\``).join(', ')}.`
          );
        }
        return textResult(`# ${record.name}\n\n${body.join('\n\n')}`, note());
      }

      const part =
        record.parts.find(p => p.path === wanted) ??
        record.parts.find(p => p.path.toLowerCase() === wanted.toLowerCase());
      if (!part) {
        return errorResult(
          `"${wanted}" is not a part of ${record.name}. Available: ${record.parts
            .map(p => p.path)
            .join(', ')}.`
        );
      }
      return textResult(renderPart(part), note());
    }
  );

  server.registerTool(
    'get_examples',
    {
      title: 'Get usage examples',
      annotations: READ_ONLY,
      description:
        "Working examples from the component's documentation page. Every one " +
        'is executed on the docs site, so they compile against this version.',
      inputSchema: {
        component: z.string().max(MAX_NAME),
        query: z
          .string()
          .max(MAX_QUERY)
          .optional()
          .describe('Filter by example heading or code, e.g. "loading"'),
        limit: z.number().int().min(1).max(30).optional(),
      },
    },
    async ({ component, query, limit }) => {
      const resolved = await resolveName(component);
      if (!resolved) return notFound(component);
      const record = await loadComponent(resolved);
      const q = query?.toLowerCase();
      const matches = q
        ? record.examples.filter(
            e =>
              e.title.toLowerCase().includes(q) ||
              e.code.toLowerCase().includes(q)
          )
        : record.examples;

      if (!matches.length) {
        return textResult(
          query
            ? `No ${record.name} examples match "${query}". It has ` +
                `${record.examples.length}: ${record.examples
                  .map(e => e.title)
                  .join(', ')}.`
            : `${record.name} has no examples on its documentation page.`,
          note()
        );
      }
      return textResult(
        `# ${record.name} examples\n\n${renderExamples(
          matches.slice(0, limit ?? 8)
        )}`,
        note()
      );
    }
  );

  // -- Styling --------------------------------------------------------------

  server.registerTool(
    'get_css_variables',
    {
      title: 'Get CSS and Sass variables',
      annotations: READ_ONLY,
      description:
        'The --bulma-* custom properties a component reads, with their Sass ' +
        'names and defaults. This is how you restyle bestax — reach for these ' +
        'before writing custom CSS. Omit `component` to search across all of them.',
      inputSchema: {
        component: z.string().max(MAX_NAME).optional(),
        query: z
          .string()
          .max(MAX_QUERY)
          .optional()
          .describe('Substring of a variable name, e.g. "radius"'),
      },
    },
    async ({ component, query }) => {
      if (component) {
        const resolved = await resolveName(component);
        if (!resolved) return notFound(component);
        const record = await loadComponent(resolved);
        const vars = query
          ? record.cssVars.filter(v =>
              v.css.toLowerCase().includes(query.toLowerCase())
            )
          : record.cssVars;
        if (!vars.length) {
          return textResult(
            `${record.name} registers no CSS variables${
              query ? ` matching "${query}"` : ''
            }.`,
            note()
          );
        }
        return textResult(
          `# ${record.name} CSS variables\n\n${renderCssVars(vars)}`,
          note()
        );
      }

      if (!query) {
        return errorResult(
          "Pass `component` for one component's variables, or `query` to " +
            'search all of them by name.'
        );
      }
      const q = query.toLowerCase();
      const rows = Object.entries(catalog.cssVarIndex)
        .filter(([css]) => css.toLowerCase().includes(q))
        .slice(0, 60)
        .map(([css, owner]) => [`\`${css}\``, owner]);
      if (!rows.length) {
        return textResult(`No CSS variable matches "${query}".`, note());
      }
      return textResult(table(['CSS Variable', 'Declared by'], rows), note());
    }
  );

  server.registerTool(
    'get_helper_props',
    {
      title: 'Get helper props',
      annotations: READ_ONLY,
      description:
        'The helper props every bestax component accepts — spacing, colour, ' +
        'typography, flexbox, visibility — and their valid values. Call this ' +
        'BEFORE writing an inline style or a utility class by hand; this ' +
        'library expects those to be props.',
      inputSchema: {
        group: z
          .string()
          .optional()
          .describe('Filter to one area, e.g. "spacing", "flex", "color"'),
      },
    },
    async ({ group }) => {
      // The helper reference lives on the hook's own docs page, which is prose
      // with signature blocks rather than a props table.
      const record = await loadComponent('useBulmaClasses');
      const doc = record.doc ?? '';
      const rule = await inlineStyleRule();
      if (!group) return textResult(rule + doc, note());

      // Return only the `##`/`###` sections that mention the group, so asking
      // about spacing does not cost the whole 50 KB page.
      const q = group.toLowerCase();
      const chunks = doc
        .split(/\n(?=#{2,3} )/)
        .filter(c => c.toLowerCase().includes(q));
      return textResult(
        rule +
          (chunks.length
            ? chunks.join('\n\n')
            : `Nothing in the helper-prop reference mentions "${group}". Call ` +
              `get_helper_props with no argument for the full reference.`),
        note()
      );
    }
  );

  // -- Skills ---------------------------------------------------------------

  server.registerTool(
    'list_skills',
    {
      title: 'List agent skills',
      annotations: READ_ONLY,
      description:
        'The bestax Agent Skills — task-level guides for forms, theming, ' +
        'layout scaffolding, icons, custom components, migration and CSS size. ' +
        'Read one with get_skill when a task matches.',
    },
    async () => textResult(renderSkills(skills), note())
  );

  server.registerTool(
    'get_skill',
    {
      title: 'Get an agent skill',
      annotations: READ_ONLY,
      description:
        "A skill's instructions, or one of its reference documents. Load the " +
        'skill first; pull a reference only when you need that depth.',
      inputSchema: {
        name: z
          .string()
          .describe('Skill name, e.g. "bestax-theming" or "theming"'),
        reference: z
          .string()
          .optional()
          .describe('Reference id from list_skills, e.g. "css-variables"'),
      },
    },
    async ({ name, reference }) => {
      const key = name.toLowerCase().replace(/^bestax-/, '');
      const skill = skills.find(
        s =>
          s.promptName.toLowerCase() === key ||
          s.name.toLowerCase() === name.toLowerCase()
      );
      if (!skill) {
        return errorResult(
          `No skill named "${name}". Available: ${skills
            .map(s => s.name)
            .join(', ')}.`
        );
      }
      if (!reference) {
        return textResult(await loadSkillFile(skill.dir), note());
      }
      const ref =
        skill.references.find(r => r.id === reference) ??
        skill.examples.find(r => r.id === reference);
      if (!ref) {
        return errorResult(
          `${skill.name} has no reference "${reference}". Available: ${[
            ...skill.references,
            ...skill.examples,
          ]
            .map(r => r.id)
            .join(', ')}.`
        );
      }
      return textResult(await loadSkillFile(skill.dir, ref.file), note());
    }
  );

  // -- Resources ------------------------------------------------------------

  server.registerResource(
    'catalog',
    'bestax://catalog',
    {
      title: 'Component catalog',
      description: 'Every bestax component with a one-line purpose.',
      mimeType: 'text/markdown',
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: renderCatalog(catalog.components),
        },
      ],
    })
  );

  server.registerResource(
    'component',
    new ResourceTemplate('bestax://components/{name}', {
      list: undefined,
      complete: {
        name: value =>
          catalog.components
            .filter(c => c.name.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 20)
            .map(c => c.name),
      },
    }),
    {
      title: 'Component documentation',
      description: 'Full documentation for one component.',
      mimeType: 'text/markdown',
    },
    async (uri, { name }) => {
      const resolved = await resolveName(String(name));
      if (!resolved) throw new Error(`No component named "${String(name)}"`);
      const record = await loadComponent(resolved);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: renderComponent(record, [...INCLUDES]),
          },
        ],
      };
    }
  );

  server.registerResource(
    'skill',
    new ResourceTemplate('bestax://skills/{name}', {
      list: undefined,
      complete: { name: () => skills.map(s => s.name) },
    }),
    {
      title: 'Agent skill',
      description: 'A bestax Agent Skill.',
      mimeType: 'text/markdown',
    },
    async (uri, { name }) => {
      const skill = skills.find(s => s.name === String(name));
      if (!skill) throw new Error(`No skill named "${String(name)}"`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: await loadSkillFile(skill.dir),
          },
        ],
      };
    }
  );

  server.registerResource(
    'skill-reference',
    new ResourceTemplate('bestax://skills/{name}/references/{ref}', {
      list: undefined,
      complete: { name: () => skills.map(s => s.name) },
    }),
    {
      title: 'Agent skill reference',
      description: 'A reference document belonging to a bestax Agent Skill.',
      mimeType: 'text/markdown',
    },
    async (uri, { name, ref }) => {
      const skill = skills.find(s => s.name === String(name));
      if (!skill) throw new Error(`No skill named "${String(name)}"`);
      const doc = skill.references.find(r => r.id === String(ref));
      if (!doc) {
        throw new Error(`${skill.name} has no reference "${String(ref)}"`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: await loadSkillFile(skill.dir, doc.file),
          },
        ],
      };
    }
  );

  // -- Prompts, one per skill ----------------------------------------------
  //
  // Generated from the manifest, never listed here. skills/CLAUDE.md counts the
  // roster as already duplicated in five places; this would have been a sixth.
  for (const skill of skills) {
    server.registerPrompt(
      skill.promptName,
      {
        title: skill.name,
        description: skill.description,
        argsSchema: {
          task: z
            .string()
            .optional()
            .describe('What you want to build, in your own words'),
        },
      },
      async ({ task }) => ({
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                await loadSkillFile(skill.dir),
                '---',
                task
                  ? `Apply the guidance above to this task: ${task}`
                  : 'Apply the guidance above to the task at hand.',
                `Reference documents are available via ` +
                  `get_skill({ name: "${skill.name}", reference: "…" }); ` +
                  `component props via get_props.`,
              ].join('\n\n'),
            },
          },
        ],
      })
    );
  }

  return server;
}
