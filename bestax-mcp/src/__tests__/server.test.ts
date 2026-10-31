/**
 * End-to-end tests over the real MCP protocol.
 *
 * A linked in-memory transport rather than direct handler calls: the contract
 * that matters is what a client sees, and that includes schema validation,
 * result envelopes and the tool/resource/prompt listings themselves. Calling
 * the handlers directly would pass while the server advertised nothing.
 *
 * These run against the committed index, not fixtures. The index is the
 * product; a test that stubs it proves nothing about what ships.
 */
import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

import { DATA_DIR, loadCatalog, loadComponent } from '../data.js';
import { createServer } from '../server.js';

/** The repository, which the export sweep reads the library's barrel from. */
const REPO_ROOT = join(DATA_DIR, '..', '..');

type TextResult = {
  isError?: boolean;
  content: { type: string; text: string }[];
};

let client: Client;

const text = (r: unknown) => (r as TextResult).content[0].text;
const failed = (r: unknown) => Boolean((r as TextResult).isError);

const call = (name: string, args: Record<string, unknown> = {}) =>
  client.callTool({ name, arguments: args });

beforeAll(async () => {
  const server = await createServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test', version: '0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
});

describe('advertised surface', () => {
  it('exposes exactly the ten documented tools', async () => {
    const names = (await client.listTools()).tools.map(t => t.name).sort();
    expect(names).toEqual([
      'get_component',
      'get_css_variables',
      'get_examples',
      'get_helper_props',
      'get_props',
      'get_skill',
      'list_components',
      'list_skills',
      'lookup_bulma_classes',
      'search_bestax',
    ]);
  });

  it('describes every tool, since the description is what routes the model', async () => {
    for (const tool of (await client.listTools()).tools) {
      expect(tool.description?.length ?? 0).toBeGreaterThan(40);
    }
  });

  // Without these a well-behaved client has to assume a documentation lookup might be
  // destructive, and prompts the user for every call.
  it('marks every tool read-only, non-destructive and closed-world', async () => {
    for (const tool of (await client.listTools()).tools) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      });
    }
  });

  // Unbounded, these arguments fed linear scans on a single-threaded process: a ~40 KB
  // query threw "Regular expression too large" and echoed itself back as the error, and a
  // 1 MB name blocked the event loop for 9.3 s in the not-found suggester.
  describe('bounds every free-text argument', () => {
    it.each([
      ['search_bestax', { query: 'x'.repeat(5000) }],
      ['get_component', { name: 'x'.repeat(5000) }],
      ['get_props', { component: 'x'.repeat(5000) }],
      ['get_examples', { component: 'x'.repeat(5000) }],
      ['get_css_variables', { query: 'x'.repeat(5000) }],
    ])('rejects an oversized argument to %s', async (tool, args) => {
      const res = await call(tool, args);
      expect(failed(res)).toBe(true);
      // The schema rejects it, so the message states the limit — and, unlike the
      // "Regular expression too large" failure this replaces, does not reflect the
      // oversized input back into the model's context.
      expect(text(res)).toContain('Too big');
      expect(text(res).length).toBeLessThan(400);
    });

    it('still accepts ordinary values', async () => {
      expect(failed(await call('search_bestax', { query: 'spacing' }))).toBe(
        false
      );
      expect(failed(await call('get_component', { name: 'Button' }))).toBe(
        false
      );
    });
  });

  // The instructions are the one string every client reads before it calls anything, so
  // the first tool they name is the only entry point the server really gets to choose.
  // The eval said that has to be list_components: 10/10 builders started there and 0/10
  // touched search_bestax, whatever the instructions claimed.
  it('names list_components as the entry point, ahead of search_bestax', async () => {
    const instructions = client.getInstructions() ?? '';
    expect(instructions).toContain('list_components');
    expect(instructions.indexOf('list_components')).toBeLessThan(
      instructions.indexOf('search_bestax')
    );
    // The rule the whole runs-v3 improvement rests on stays in there too.
    expect(instructions).toContain('get_helper_props');
  });

  it('derives one prompt per skill from the manifest', async () => {
    const names = (await client.listPrompts()).prompts.map(p => p.name);
    expect(names).toContain('theming');
    expect(names).toContain('form');
    expect(names).toContain('layout-scaffold');
    // No hardcoded roster — every skill in the index gets a prompt.
    expect(names.length).toBeGreaterThanOrEqual(7);
  });

  it('exposes the catalog and the three templated resources', async () => {
    const direct = (await client.listResources()).resources.map(r => r.uri);
    expect(direct).toContain('bestax://catalog');
    const templates = (
      await client.listResourceTemplates()
    ).resourceTemplates.map(t => t.uriTemplate);
    expect(templates).toEqual(
      expect.arrayContaining([
        'bestax://components/{name}',
        'bestax://skills/{name}',
        'bestax://skills/{name}/references/{ref}',
      ])
    );
  });
});

describe('search_bestax', () => {
  it('finds a component and names the tool to call next', async () => {
    const out = text(await call('search_bestax', { query: 'button' }));
    expect(out).toContain('Button');
    expect(out).toContain('get_component({ name: "Button" })');
  });

  it('reaches props and examples, not just component names', async () => {
    const out = text(
      await call('search_bestax', { query: 'loading', limit: 30 })
    );
    expect(out).toMatch(/prop|example/);
  });

  it('finds CSS variables by name', async () => {
    const out = text(
      await call('search_bestax', { query: 'radius', kind: 'css-var' })
    );
    expect(out).toContain('--bulma-');
    expect(out).toContain('get_css_variables');
  });

  it('finds skills, so a task-shaped query reaches the guidance', async () => {
    const out = text(
      await call('search_bestax', { query: 'theme', kind: 'skill' })
    );
    expect(out).toContain('bestax-theming');
  });

  it('says so, actionably, when nothing matches', async () => {
    const out = text(
      await call('search_bestax', { query: 'zzzzz-no-such-thing' })
    );
    expect(out).toContain('list_components');
  });

  // The example in the tool's own schema, which put DateInput 33rd (#934).
  it('answers "date picker" with DateInput first', async () => {
    const out = text(await call('search_bestax', { query: 'date picker' }));
    const [first] = out.split('\n').slice(2);
    expect(first).toMatch(/^\| component \| DateInput \|/);
  });

  // A port of a `<label class="label sr-only">` asked this, and got label props
  // that mention screen readers but neither the helper prop nor the pattern a
  // form needs (#1273).
  it('answers "screen reader only label" with the helper prop and the form pattern', async () => {
    const out = text(
      await call('search_bestax', { query: 'screen reader only label' })
    );
    const rows = out.split('\n').slice(2, 7).join('\n');
    expect(rows).toContain(
      '| example | Input: Visually Hidden Label for Screen Readers |'
    );
    expect(rows).toContain(
      "| prop | visibility (helper prop) | 'hidden' \\| 'sr-only' \\| 'invisible'"
    );
    expect(rows).toContain('`get_helper_props({ group: "layout" })`');
    const example = text(
      await call('get_examples', {
        component: 'Input',
        query: 'Visually Hidden Label for Screen Readers',
      })
    );
    expect(example).toContain("labelProps={{ className: 'is-sr-only' }}");
  });

  it('finds a helper prop by what it does', async () => {
    const out = text(await call('search_bestax', { query: 'margin top' }));
    const [first] = out.split('\n').slice(2);
    expect(first).toMatch(/^\| prop \| mt \(helper prop\) \|/);
    expect(first).toContain('`get_helper_props({ group: "spacing" })`');
  });

  it('suggests DateInput for a DatePicker that does not exist', async () => {
    const res = await call('get_component', { name: 'DatePicker' });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('Did you mean "DateInput"');
  });
});

describe('list_components', () => {
  it('lists every component grouped by category', async () => {
    const out = text(await call('list_components'));
    expect(out).toContain('## elements');
    expect(out).toContain('**Button**');
    expect(out).toContain('**Navbar** (compound)');
  });

  it('filters by category, case-insensitively', async () => {
    const out = text(await call('list_components', { category: 'FORM' }));
    expect(out).toContain('## form');
    expect(out).not.toContain('## elements');
  });

  it('names the valid categories when given a bad one', async () => {
    const res = await call('list_components', { category: 'nope' });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('elements');
  });

  // In the 20-run eval this tool was called by 10/10 MCP builders while search_bestax was
  // called by 0/10 -- even though the instructions named search as the entry point at the
  // time. Whatever search results would have said about the next step has to be said here
  // instead.
  describe('points at the next step', () => {
    it('names the detail tools, including get_css_variables', async () => {
      const out = text(await call('list_components'));
      for (const tool of [
        'get_component',
        'get_props',
        'get_examples',
        'get_css_variables',
      ]) {
        expect(out).toContain(tool);
      }
    });

    // The load-bearing one: builders pulled bestax-theming 10/10 and
    // bestax-layout-scaffold 2/10, and layout-scaffold is where the inline-style rule
    // lives. Naming it at component-choosing time is the whole point of the footer.
    it('names the two skills the eval showed builders never reach for', async () => {
      const out = text(await call('list_components'));
      expect(out).toContain('bestax-layout-scaffold');
      expect(out).toContain('bestax-custom-component');
      expect(out).toContain('list_skills');
    });

    it('appears on a category-filtered listing too', async () => {
      const out = text(await call('list_components', { category: 'form' }));
      expect(out).toContain('bestax-layout-scaffold');
    });

    // Pointing at bestax-layout-scaffold is not enough on its own. runs-v4 measured that
    // skill reaching 4 builders in 10 and the arm coming out a flat null, so the three
    // components with a core-Bulma near-miss are named here, on the tool 10/10 runs call.
    describe('names the three components with a core-Bulma near-miss', () => {
      // Asserting the component NAMES here proved nothing: all five are components, so the
      // catalog listing above the footer contains every one of them whether or not the
      // block rendered. Verified by executing the assertions against the listing alone --
      // all five passed. The heading is the only string unique to the block.
      it('renders the section itself, not just names the listing already has', async () => {
        const out = text(await call('list_components'));
        const listingOnly = out.slice(0, out.indexOf('---'));
        expect(listingOnly).toContain('Toast');
        expect(out).toContain(
          'Three components core Bulma will talk you out of'
        );
        expect(listingOnly).not.toContain(
          'Three components core Bulma will talk you out of'
        );
      });

      it('pairs each with the substitution it loses to', async () => {
        const out = text(await call('list_components'));
        const block = out.slice(
          out.indexOf('Three components core Bulma will talk you out of')
        );
        for (const [right, wrong] of [
          ['Toast', 'Notification'],
          ['Dialog', 'Modal'],
          ['LinkButton', 'Button color="text"'],
        ]) {
          expect(block).toContain(right);
          expect(block).toContain(wrong);
        }
      });

      it('gives the container-plus-imperative setup', async () => {
        const out = text(await call('list_components'));
        expect(out).toContain('ToastContainer');
        expect(out).toContain("toast.success('Saved')");
        expect(out).toContain('<DialogContainer />');
        expect(out).toContain('dialog.confirm(');
      });

      // sk01 mounted DialogContainer, never called it, and built its confirm out of Modal.
      it('rules out mounting a container and calling it done', async () => {
        const out = text(await call('list_components'));
        expect(out).toMatch(/Mounting a container without ever calling/);
      });

      // Sourced from the skill, not paraphrased — so the API a builder needs in order to
      // act on the row travels with it. The hardcoded copy this replaced named LinkButton
      // with no variant prop at all.
      it('carries the LinkButton variants the hardcoded copy had lost', async () => {
        const out = text(await call('list_components'));
        expect(out).toContain('variant="text"');
        expect(out).toContain('underline');
      });

      // The footer is a fixed cost on a variable-size answer: with this block appended
      // unconditionally, list_components({category:"grid"}) was 86% boilerplate.
      it('is omitted on a category-filtered call, which is not a choosing moment', async () => {
        const filtered = text(
          await call('list_components', { category: 'grid' })
        );
        expect(filtered).not.toContain('talk you out of');
        // The cheap next-step routing still travels on every call.
        expect(filtered).toContain('get_component');
        expect(filtered.length).toBeLessThan(
          text(await call('list_components')).length
        );
      });
    });
  });
});

describe('get_component', () => {
  it('returns the import statement and prop table by default', async () => {
    const out = text(await call('get_component', { name: 'Button' }));
    expect(out).toContain("import { Button } from '@allxsmith/bestax-bulma';");
    expect(out).toContain('| Prop | Type | Default | Notes |');
    expect(out).toContain('`color`');
    // Not paid for unless asked.
    expect(out).not.toContain('## Examples');
  });

  it('adds only the sections asked for', async () => {
    const out = text(
      await call('get_component', {
        name: 'Button',
        include: ['props', 'examples', 'cssVars', 'accessibility', 'related'],
      })
    );
    expect(out).toContain('## Examples');
    expect(out).toContain('## CSS Variables');
    expect(out).toContain('## Accessibility');
    expect(out).toContain('**Related:**');
  });

  it('lists subcomponents for a compound family', async () => {
    const out = text(await call('get_component', { name: 'Navbar' }));
    expect(out).toContain('**Subcomponents:**');
    expect(out).toContain('`Navbar.Brand`');
  });

  it('renders a helper as prose rather than an empty table', async () => {
    const out = text(await call('get_component', { name: 'useBulmaClasses' }));
    expect(out).toContain('useBulmaClasses');
    expect(out).not.toContain('| Prop | Type | Default | Notes |');
  });

  it('accepts the names a model actually types', async () => {
    for (const name of ['button', '<Button>', 'Navbar.Brand']) {
      const out = text(await call('get_component', { name }));
      expect(failed(out)).toBeFalsy();
      expect(out).toMatch(/^# (Button|Navbar)/);
    }
  });

  it('suggests a near miss instead of just refusing', async () => {
    const res = await call('get_component', { name: 'Buton' });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('Button');
  });

  // The server itself never goes online; the utm tag on the links it hands out
  // is what makes a follow-through visible in the bestax.io analytics.
  it('tags the emitted docs and Storybook links for attribution', async () => {
    const out = text(await call('get_component', { name: 'Button' }));
    expect(out).toMatch(/Docs: https:\/\/\S+\?utm_source=bestax-mcp/);
    expect(out).toMatch(/Storybook: https:\/\/\S+&utm_source=bestax-mcp/);
  });

  // Issue #501: get_css_variables reached 1/10 MCP-only builders in an eval arm where
  // every run themed the site. get_component can already serve the variables on the call
  // being made (`include: ["cssVars"]`), so the default answer names the count and points
  // there instead of requiring a builder to already know a second tool exists.
  describe('surfaces CSS variables without a second tool call', () => {
    it('names the count and the include option by default', async () => {
      const out = text(await call('get_component', { name: 'Button' }));
      expect(out).toMatch(/`Button` has \d+ CSS variables? for theming/);
      expect(out).toContain('include: ["cssVars"]');
      expect(out).not.toContain('## CSS Variables');
    });

    it('says nothing once cssVars is already included', async () => {
      const out = text(
        await call('get_component', {
          name: 'Button',
          include: ['props', 'cssVars'],
        })
      );
      expect(out).toContain('## CSS Variables');
      expect(out).not.toContain('for theming — pass');
    });

    it('says nothing for a component with no CSS variables', async () => {
      const out = text(await call('get_component', { name: 'Block' }));
      expect(out).not.toContain('CSS variable');
    });
  });
});

// The links inside index text were made canonical by the generator, and are tagged at
// render time like the footer's, so a visit that starts in an answer is counted as one.
// Code, skill bodies and skill references are served as written.
describe('the bestax.io links inside answers', () => {
  const TAG = 'utm_source=bestax-mcp';
  /** The site's origin, with nothing after it that makes a longer host. */
  const SITE_ORIGIN = /https:\/\/bestax\.io(?![\w.-])/;
  /** Every markdown link target into bestax.io in a piece of text. */
  const siteLinks = (out: string) =>
    [...out.matchAll(/\]\(<?(https:\/\/bestax\.io(?![\w.-])[^)\s>]*)/g)].map(
      m => m[1]
    );
  /** The tag where it counts: in the query, ahead of any fragment. */
  const TAGGED = new RegExp(`[?&]${TAG}(?:[&#]|$)`);
  /** Markdown outside its fences, as the generator's guard reads it. */
  const outsideFences = (md: string) =>
    md
      .split(/^[ \t]*(?:```|~~~)[^\n]*$/m)
      .filter((_, i) => i % 2 === 0)
      .join('\n');

  it('tags the link in an accessibility note, keeping its fragment', async () => {
    const out = text(
      await call('get_component', {
        name: 'Avatars',
        include: ['accessibility'],
      })
    );
    expect(out).toContain(
      "[Avatar's accessibility notes](https://bestax.io/docs/api/components/avatar?utm_source=bestax-mcp#accessibility)"
    );
    // The code span beside it is served as written.
    expect(out).toContain('``surplusLabel={count => `${count} weitere`}``');
  });

  it.each([
    ['get_component', { name: 'Columns' }],
    ['get_props', { component: 'Grid.Cell' }],
    ['list_components', {}],
    ['search_bestax', { query: 'columns' }],
    ['get_component', { name: 'useBulmaClasses' }],
    ['get_component', { name: 'useBulmaClasses', include: ['reference'] }],
    ['get_helper_props', { group: 'layout' }],
  ])('tags every one in %s %j', async (tool, args) => {
    const links = siteLinks(text(await call(tool, args)));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toContain(TAG);
  });

  it.each(['Avatar', 'Footer', 'Input'])(
    "serves %s's example code as written",
    async component => {
      const record = await loadComponent(component);
      const examples = record.examples.filter(e => SITE_ORIGIN.test(e.code));
      expect(examples.length).toBeGreaterThan(0);
      for (const e of examples) {
        const out = text(
          await call('get_examples', { component, query: e.title })
        );
        expect(out).toContain('```tsx\n' + e.code + '\n```');
      }
    }
  );

  // The cases above, made exhaustive the way the generator's guard over relative links
  // is: every record through each tool that renders it, and every catalog entry. A
  // render path that serves a field without tagging it fails here, whichever field.
  it('tags every site link in every record and catalog entry it serves', async () => {
    const catalog = await loadCatalog();
    const getComponent = (await client.listTools()).tools.find(
      t => t.name === 'get_component'
    );
    // Every section get_component offers, as it advertises them.
    const include = (
      getComponent?.inputSchema.properties?.include as {
        items: { enum: string[] };
      }
    ).items.enum;
    const answers: { at: string; out: string }[] = [];
    const refused: string[] = [];
    const ask = async (tool: string, args: Record<string, unknown>) => {
      const at = `${tool} ${JSON.stringify(args)}`;
      const result = await call(tool, args);
      if (failed(result)) refused.push(at);
      answers.push({ at, out: text(result) });
      return text(result);
    };

    // By category, since the unfiltered listing adds a section from a skill, and
    // skills are served as written.
    for (const { id } of catalog.categories) {
      await ask('list_components', { category: id });
    }
    for (const { name } of catalog.components) {
      const record = await loadComponent(name);
      await ask('get_component', { name });
      await ask('get_component', { name, include });
      await ask('search_bestax', { query: name, kind: 'component' });
      for (const { path } of record.parts.slice(1)) {
        await ask('get_component', { name: path });
        await ask('get_props', { component: name, path });
      }
      // Code is served as written, a link in it included.
      for (const e of record.examples.filter(e => SITE_ORIGIN.test(e.code))) {
        const out = await ask('get_examples', {
          component: name,
          query: e.title,
        });
        expect(out).toContain('```tsx\n' + e.code + '\n```');
      }
    }

    expect(refused).toEqual([]);
    const links = answers.flatMap(({ at, out }) =>
      siteLinks(outsideFences(out)).map(link => ({ at, link }))
    );
    expect(links.length).toBeGreaterThan(0);
    expect(
      links
        .filter(({ link }) => !TAGGED.test(link))
        .map(({ at, link }) => `${at}: ${link}`)
    ).toEqual([]);
  });

  it('serves a skill as written, untagged links included', async () => {
    // The bundled markdown, read here rather than through the server's loader.
    const body = await readFile(
      join(DATA_DIR, 'skills', 'bestax-optimize', 'SKILL.md'),
      'utf8'
    );
    const untagged = siteLinks(body).filter(link => !TAGGED.test(link));
    expect(untagged.length).toBeGreaterThan(0);
    const skill = text(await call('get_skill', { name: 'bestax-optimize' }));
    const prompt = (
      (await client.getPrompt({ name: 'optimize' })).messages[0].content as {
        text: string;
      }
    ).text;
    const resource = String(
      (await client.readResource({ uri: 'bestax://skills/bestax-optimize' }))
        .contents[0].text
    );
    // Each opens with the body as written. What may follow it is the server's own:
    // the prompt's instructions, and on get_skill the version note, whose link is
    // tagged like the footer's.
    for (const out of [skill, prompt, resource]) {
      expect(out.slice(0, body.length)).toBe(body);
    }
  });
});

describe('get_props', () => {
  // The catch-all row alone read as if both went to the `<input>` (#1273).
  it.each([
    ['Checkbox', 'Helper props go on the outer `<label>`, with `className`.'],
    ['Select', 'Helper props go on the `.select` wrapper `<div>`'],
  ])(
    'says where %s puts its helper props, beside the catch-all row',
    async (component, note) => {
      const out = text(await call('get_props', { component }));
      const catchAll = out.split('\n').find(l => l.startsWith('| `...` |'));
      expect(catchAll).toContain(`${note}`);
      expect(catchAll).toMatch(/See `get_helper_props`\. \|$/);
    }
  );

  it('returns a compound subcomponent by dot-path', async () => {
    const out = text(
      await call('get_props', { component: 'Navbar', path: 'Navbar.Brand' })
    );
    expect(out).toContain('### Navbar.Brand');
    expect(out).toContain('| Prop | Type | Default | Notes |');
  });

  it('accepts the dot-path folded into the component name', async () => {
    const out = text(await call('get_props', { component: 'Navbar.Burger' }));
    expect(out).toContain('### Navbar.Burger');
  });

  it('points at the standalone export when a sub has one', async () => {
    const out = text(
      await call('get_props', { component: 'Table', path: 'Table.Thead' })
    );
    expect(out).toContain('Thead');
  });

  it('lists the real parts when the dot-path is wrong', async () => {
    const res = await call('get_props', {
      component: 'Navbar',
      path: 'Navbar.Nope',
    });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('Navbar.Brand');
  });

  it('explains that a hook has no props rather than returning nothing', async () => {
    const out = text(await call('get_props', { component: 'useBulmaClasses' }));
    expect(out).toContain('is not a component, so it has no prop table');
  });

  it('never leaks markdown escaping into a type', async () => {
    // Scoped to the Type column on purpose: a component's own TSDoc summary may
    // legitimately contain a markdown link (`Columns` links to `Column`), and
    // that prose is authored, not extracted. What must never appear is a nested
    // code span or a docs-relative link inside a TYPE, which is what the
    // extractor's markdown mode would produce.
    for (const component of ['Columns', 'Avatar', 'Grid', 'Slider']) {
      const out = text(await call('get_props', { component }));
      const types = out
        .split('\n')
        .filter(l => l.startsWith('| `'))
        .map(l => l.split('|')[2] ?? '');
      expect(types.length).toBeGreaterThan(0);
      for (const type of types) {
        expect(type).not.toContain('``');
        expect(type).not.toContain('.md)');
      }
    }
  });
});

describe('get_examples', () => {
  it('returns runnable tsx with headings', async () => {
    const out = text(await call('get_examples', { component: 'Button' }));
    expect(out).toContain('```tsx');
    expect(out).toContain('<Button');
  });

  it('filters by query', async () => {
    const out = text(
      await call('get_examples', { component: 'Button', query: 'color' })
    );
    expect(out.toLowerCase()).toContain('color');
  });

  it('lists what it does have when the filter misses', async () => {
    const out = text(
      await call('get_examples', { component: 'Button', query: 'zzzz' })
    );
    expect(out).toContain('No Button examples match');
  });

  it('honours the limit', async () => {
    const out = text(
      await call('get_examples', { component: 'Button', limit: 2 })
    );
    expect(out.match(/```tsx/g)?.length).toBe(2);
  });
});

describe('get_css_variables', () => {
  it('returns the triples for one component with override guidance', async () => {
    const out = text(await call('get_css_variables', { component: 'Button' }));
    expect(out).toContain('--bulma-button-h');
    expect(out).toContain('| CSS Variable | Sass Variable | Default |');
    expect(out).toMatch(/override/i);
  });

  it('searches across every component by name', async () => {
    const out = text(await call('get_css_variables', { query: 'radius' }));
    expect(out).toContain('--bulma-');
    expect(out).toContain('Declared by');
  });

  it('asks for one of the two arguments when given neither', async () => {
    const res = await call('get_css_variables', {});
    expect(failed(res)).toBe(true);
  });

  // The index named whichever declarer the generator read last, so DateInput's
  // calendar variables were "declared by DateTimeInput" (#964).
  it('names every declarer, the one a variable is named after first', async () => {
    // The list comes from the index, since who else declares the calendar's
    // variables grows with the pickers; what is pinned is DateInput leading it.
    const declarers = (await loadCatalog()).cssVarIndex[
      '--bulma-dateinput-cell-color'
    ];
    expect(declarers[0]).toBe('DateInput');
    expect(declarers).toContain('DateTimeInput');
    const named = declarers.join(', ');

    const out = text(
      await call('get_css_variables', { query: 'dateinput-cell-color' })
    );
    expect(out).toContain(`| \`--bulma-dateinput-cell-color\` | ${named} |`);

    const search = text(
      await call('search_bestax', {
        query: '--bulma-dateinput-cell-color',
        kind: 'css-var',
      })
    );
    expect(search).toContain(`declared by ${named}`);
    expect(search).toContain('get_css_variables({ component: "DateInput" })');
  });

  // "Registers no CSS variables" and nothing else read as "this can't be themed", for
  // a component that Button's variables style (#1045).
  describe("a component that renders another component's element", () => {
    const pointer = (from: string, too: string, query?: string) =>
      `renders ${from}'s element, so ${from}'s variables style it${too}, for the ` +
      `colors and modifiers it accepts. They are ` +
      `in \`get_css_variables({ component: "${from}"${
        query ? `, query: "${query}"` : ''
      } })\`.`;

    it('points at the other table under its own rows', async () => {
      const out = text(
        await call('get_css_variables', { component: 'LinkButton' })
      );
      expect(out).toContain('# LinkButton CSS variables');
      const line = `LinkButton ${pointer('Button', ' too')}`;
      expect(out).toContain(line);
      expect(out.indexOf(line)).toBeGreaterThan(
        out.lastIndexOf('--bulma-link-button-')
      );
    });

    it('keeps "matching" honest when the query finds none of its own', async () => {
      const out = text(
        await call('get_css_variables', {
          component: 'LinkButton',
          query: 'padding',
        })
      );
      expect(out).toContain(
        `LinkButton registers no CSS variables matching "padding". It ` +
          pointer('Button', ' too', 'padding')
      );
      // And the call it names finds them.
      const there = text(
        await call('get_css_variables', {
          component: 'Button',
          query: 'padding',
        })
      );
      expect(there).toContain('--bulma-button-padding-horizontal');
    });

    it('gives every component the index points elsewhere a call that answers', async () => {
      const catalog = await loadCatalog();
      const pointing = (
        await Promise.all(catalog.components.map(c => loadComponent(c.name)))
      ).filter(r => r.cssVarsFrom);
      expect(pointing.map(r => r.name)).toEqual(
        expect.arrayContaining(['LinkButton', 'ToggleButton'])
      );
      for (const record of pointing) {
        const from = record.cssVarsFrom as string;
        const named = `\`get_css_variables({ component: "${from}" })\``;
        // get_css_variables, get_component's default answer, and the resource,
        // which includes cssVars.
        const answers = [
          text(await call('get_css_variables', { component: record.name })),
          text(await call('get_component', { name: record.name })),
          String(
            (
              await client.readResource({
                uri: `bestax://components/${record.name}`,
              })
            ).contents[0].text
          ),
        ];
        for (const out of answers) expect(out).toContain(named);
        const there = text(
          await call('get_css_variables', { component: from })
        );
        expect(there).toContain(`# ${from} CSS variables`);
      }
    });

    it('says nothing of the kind for a component without one', async () => {
      expect((await loadComponent('Block')).cssVarsFrom).toBeUndefined();
      const out = text(await call('get_css_variables', { component: 'Block' }));
      expect(out).toMatch(/^Block registers no CSS variables\.(\n|$)/);
      expect(out).not.toContain('element, so');
      const button = text(
        await call('get_css_variables', { component: 'Button' })
      );
      expect(button).not.toContain('element, so');
    });
  });
});

describe('get_helper_props', () => {
  it('returns the full helper reference', async () => {
    const out = text(await call('get_helper_props'));
    expect(out).toContain('useBulmaClasses');
    expect(out.length).toBeGreaterThan(2000);
  });

  it('narrows to a group so the whole page is not the price of one question', async () => {
    const full = text(await call('get_helper_props'));
    const spacing = text(await call('get_helper_props', { group: 'spacing' }));
    expect(spacing.toLowerCase()).toContain('spacing');
    expect(spacing.length).toBeLessThan(full.length);
  });

  it('falls back to advice when the group matches nothing', async () => {
    const out = text(await call('get_helper_props', { group: 'zzzz' }));
    expect(out).toContain('get_helper_props');
  });

  // A group answer carries only its own sections, so a same-page link in it can point at a
  // section the answer does not hold. A question about `pos` has to learn what `overlay` does
  // beside it from the answer itself, not from a link it cannot follow.
  it.each(['pos', 'position'])(
    'tells a %p question what overlay does beside it',
    async group => {
      const out = text(await call('get_helper_props', { group }));
      expect(out).toMatch(/`overlay`[^.]*`absolute`/);
    }
  );

  // See the list_components suite for the sibling case: guidance goes where the traffic is.
  // The 20-run eval in eval/agent-loop/runs-v2/aggregate.md: every MCP-only run called this
  // tool, eight of ten still wrote 46-162 inline styles, and the two that did not were the
  // two that had pulled bestax-layout-scaffold — the only place the prohibition lives.
  // Moving it here puts it in front of every caller. These tests exist so it stays there.
  describe('leads with the inline-style prohibition', () => {
    it('states the rule and the escape hatch before the reference', async () => {
      const out = text(await call('get_helper_props'));
      expect(out).toContain('Do not write inline');
      // The escape hatch matters as much as the ban: a builder that hits maxWidth with
      // nowhere sanctioned to go reaches for style={{}} regardless of the ban.
      expect(out).toContain('className');
      expect(out.indexOf('Do not write inline')).toBeLessThan(
        out.indexOf('useBulmaClasses')
      );
    });

    it('carries the mapping table, sourced from the skill so it cannot drift', async () => {
      const out = text(await call('get_helper_props'));
      expect(out).toContain('Inline style → helper prop mapping');
      // Spot-check declarations the failing eval runs actually inlined.
      for (const decl of ['marginTop', 'textAlign', 'display', 'gap']) {
        expect(out).toContain(decl);
      }
    });

    it('prepends the rule to a narrowed group too', async () => {
      const out = text(await call('get_helper_props', { group: 'spacing' }));
      expect(out).toContain('Do not write inline');
    });
  });

  // get_helper_props was 54,886 characters -- 49% of everything a measured cold-start
  // session read -- on the tool the server's own instructions tell every client to call.
  describe('answers without spending the session', () => {
    it('keeps the default under 10k while naming every prop', async () => {
      const out = text(await call('get_helper_props'));
      expect(out.length).toBeLessThan(10_000);
      // Spot-check across all seven groups; helper-props.test.ts checks every prop exhaustively.
      for (const prop of [
        'mt',
        'px',
        'color',
        'backgroundColor',
        'textSize',
        'flexGrow',
        'display',
        'cursor',
        'skeleton',
        'viewport',
      ]) {
        expect(out).toContain('`' + prop + '`');
      }
    });

    it('narrows further when a group is named', async () => {
      const full = text(await call('get_helper_props'));
      for (const group of ['spacing', 'flex', 'layout']) {
        const out = text(await call('get_helper_props', { group }));
        expect(out.length).toBeLessThan(full.length);
      }
    });

    // Under the old whole-body substring filter "text" returned 87% of the page; under a
    // naive heading-only filter it would have returned nothing at all.
    it.each([
      ['text', 'textWeight'],
      ['margin', 'mt'],
      ['colour', 'backgroundColor'],
      ['mobile', 'viewport'],
    ])('resolves the word a builder actually uses: %p', async (group, prop) => {
      const out = text(await call('get_helper_props', { group }));
      expect(out).toContain('`' + prop + '`');
      expect(out.length).toBeLessThan(10_000);
    });

    it('answers a nonsense group briefly, listing the real ones', async () => {
      const out = text(await call('get_helper_props', { group: 'quantum' }));
      // Was 3,956 characters, of which 3,832 was a prohibition prepended to a call that
      // answered nothing.
      expect(out.length).toBeLessThan(400);
      expect(out).toContain('spacing');
    });
  });

  describe('get_component on a helper', () => {
    // useBulmaClasses is where the helper props are documented, so its answers name
    // get_helper_props as well as its own signature. Every other hook's must not: that
    // tool describes none of them (#933).
    it('is reachable in one hop from search and from get_props', async () => {
      const search = text(
        await call('search_bestax', { query: 'useBulmaClasses' })
      );
      const helperRow = search
        .split('\n')
        .find(
          l => l.includes('| component |') && l.includes('useBulmaClasses')
        );
      expect(helperRow).toContain('get_component({ name: "useBulmaClasses" })');

      const props = text(
        await call('get_props', { component: 'useBulmaClasses' })
      );
      expect(props).toContain('useBulmaClasses(props)');
      expect(props).toContain('get_helper_props()');
    });

    it('is its signature and pointers by default, not the whole reference', async () => {
      const out = text(
        await call('get_component', { name: 'useBulmaClasses' })
      );
      // The page runs to tens of thousands of characters; the default answer is the
      // `## API` block and where to go next.
      expect(out.length).toBeLessThan(3_000);
      expect(out).toContain('## API');
      expect(out).toContain('get_helper_props');
      expect(out).toContain('include: ["reference"]');
    });

    it('returns the full prose when it is asked for', async () => {
      const out = text(
        await call('get_component', {
          name: 'useBulmaClasses',
          include: ['reference'],
        })
      );
      expect(out.length).toBeGreaterThan(40_000);
    });
  });
});

// Theme, ConfigProvider, Portal and ClientOnly are documented on helpers pages, and
// used to be answered as hooks: no prop table, and a pointer at get_helper_props,
// which describes none of them (#933).
describe('components documented on helpers pages', () => {
  const TABLE = '| Prop | Type | Default | Notes |';

  it.each([
    ['Theme', '`colorMode`'],
    ['ConfigProvider', '`iconLibrary`'],
    ['Portal', '`container`'],
    ['ClientOnly', '`fallback`'],
  ])('get_props gives %s a prop table', async (component, prop) => {
    const res = await call('get_props', { component });
    expect(failed(res)).toBe(false);
    const out = text(res);
    expect(out).toContain(TABLE);
    expect(out).toContain(prop);
    expect(out).not.toContain('get_helper_props()');
    // A table, not the page: Theme's page is about 40k characters.
    expect(out.length).toBeLessThan(10_000);
  });

  it('get_component shows the table by default and the page on request', async () => {
    const out = text(await call('get_component', { name: 'Theme' }));
    expect(out).toContain(TABLE);
    expect(out).toContain('`colorMode`');
    expect(out.length).toBeLessThan(10_000);
    // The page has far more than the table, and the default answer says where.
    const pointer = 'get_component({ name: "Theme", include: ["reference"] })';
    expect(out).toContain(pointer);
    expect(text(await call('get_props', { component: 'Theme' }))).toContain(
      pointer
    );
    // A component with no prose page has nothing to point at.
    expect(text(await call('get_component', { name: 'Button' }))).not.toContain(
      '"reference"'
    );
    // `include` replaces the default, so an answer without props has no table
    // for the pointer to speak of, and says nothing about one.
    for (const include of [['cssVars'], []]) {
      expect(
        text(await call('get_component', { name: 'Theme', include }))
      ).not.toContain('this table');
    }

    const full = text(
      await call('get_component', { name: 'Theme', include: ['reference'] })
    );
    expect(full).toContain('## Reference');
    expect(full).toContain('### CSS Variable Props');
  });

  it.each([
    ['colorMode', 'Theme.colorMode'],
    ['iconLibrary', 'ConfigProvider.iconLibrary'],
  ])('search_bestax finds %s as a prop', async (query, name) => {
    const out = text(await call('search_bestax', { query }));
    expect(out).toMatch(
      new RegExp(`\\| prop \\| ${name.replace('.', '\\.')} \\|`)
    );
  });

  it('points a hook at its own documentation, not at get_helper_props', async () => {
    const props = text(await call('get_props', { component: 'useFocusTrap' }));
    expect(props).toContain('function useFocusTrap(');
    expect(props).toContain('include: ["reference"]');
    expect(props).toContain('get_examples({ component: "useFocusTrap" })');
    expect(props).not.toContain('get_helper_props');

    const component = text(
      await call('get_component', { name: 'useFocusTrap' })
    );
    expect(component).toContain('function useFocusTrap(');
    expect(component).not.toContain('get_helper_props');

    const search = text(await call('search_bestax', { query: 'useFocusTrap' }));
    const row = search
      .split('\n')
      .find(l => l.includes('| component |') && l.includes('useFocusTrap'));
    expect(row).toContain('get_component({ name: "useFocusTrap" })');
  });

  it('points a page with no API block at its reference', async () => {
    const out = text(
      await call('get_props', { component: 'Valid value constants' })
    );
    expect(out).toContain('For its API, pass `include: ["reference"]`');
    expect(out).not.toContain('get_helper_props');
  });
});

describe('lookup_bulma_classes', () => {
  const lookup = async (classes: string, tag?: string) =>
    text(
      await call('lookup_bulma_classes', tag ? { classes, tag } : { classes })
    );

  it('names the component, and a prop for each class, one row per class', async () => {
    const out = await lookup('button is-primary is-large my-cta', 'a');
    expect(out).toContain('**Component:** `Button` with `as="a"`.');
    expect(out).toContain('| `is-primary` | `color="primary"` |');
    expect(out).toContain('| `is-large` | `size="large"` |');
    expect(out).toMatch(/\| `my-cta` \| stays in `className` \|/);
    expect(out).toContain('get_props({ component: "Button" })');
  });

  it('says a `.icon` writes its glyph as props, and when the aria-hidden moves up', async () => {
    const out = await lookup('icon is-small', 'span');
    expect(out).toContain('**Component:** `Icon`.');
    expect(out).toContain(
      "write the <i>'s classes as its props and drop the <i>, so it closes itself"
    );
    expect(out).toContain(
      '`far fa-bell fa-lg` as `name="bell" variant="regular" features="fa-lg"`'
    );
    expect(out).toContain('`fa-brands` as `brands`');
    expect(out).toContain(
      'in a <button> or a link that its own `aria-label` or `aria-labelledby` names, where the icon is decoration'
    );
    // The attributes it may carry for the move come from the index.
    expect(out).toContain(
      'Font Awesome\'s own `<i aria-hidden="true">` converts the same way when the element carries nothing but its classes, `id`, `style`, `key` and any `data-` attribute: `Icon` writes `aria-hidden` on the element instead'
    );
    expect(out).toContain(
      'a `title`, a `role` or a `tabIndex` say, whether written out or as an expression, nothing moves'
    );
    // Nothing else reads a glyph.
    expect(await lookup('tag')).not.toContain('<i>');
  });

  it('says "an" before a tag read with a vowel sound', async () => {
    expect(await lookup('tag', 'a')).toContain(
      '**Component:** `Tag` renders only <span>, not an <a>. Change the tag to use it, and the rows below are what it takes then; the codemod leaves an <a> as markup.'
    );
    expect(await lookup('section', 'div')).toContain(
      '`Section` renders only <section>, not a <div>'
    );
    // Not by the letter alone: a <ul> reads "you".
    expect(await lookup('breadcrumb')).toContain(
      'converts only around a <ul> with no class or attribute'
    );
    expect(await lookup('image')).toContain('only around an <img>');
  });

  it('says when a class is exact only on some tags', async () => {
    expect(await lookup('title is-4')).toContain(
      '| `is-4` | `size="4"` | exact only on <h4> or <p>; on another tag, `textSize="4"` sizes it the same and keeps the tag |'
    );
    // On an <h2>, size="4" would render an <h4>, so it stays a class, and
    // textSize, which keeps the <h2>, is the prop for it.
    expect(await lookup('title is-4', 'h2')).toContain(
      '| `is-4` | stays in `className` | bestax `Title` renders it exactly only on <h4> or <p>; on this <h2>, write `textSize="4"` in its place, which sizes it the same and keeps the <h2> |'
    );
    expect(await lookup('subtitle is-6', 'h1')).toContain(
      'on this <h1>, write `textSize="6"` in its place'
    );
    // Title can't render a <div>, so the lookup says to change the tag, and
    // on an <h4> or a <p> the class converts: no textSize to suggest.
    const onDiv = await lookup('title is-4', 'div');
    expect(onDiv).toContain('not a <div>');
    expect(onDiv).not.toContain('keeps the <div>');
    expect(onDiv).not.toContain('textSize="4"');
  });

  it('defers to a size helper that writes textSize already', async () => {
    // `is-size-2` wins, being `!important`, so `textSize="4"` would change it.
    const onTag = await lookup('title is-4 is-size-2', 'h2');
    expect(onTag).toContain(
      '| `is-4` | stays in `className` | bestax `Title` renders it exactly only on <h4> or <p>; `textSize` is written by `is-size-2` already, so this class is the one that stays |'
    );
    expect(onTag).toContain('| `is-size-2` | `textSize="2"` |');
    expect(onTag).not.toContain('textSize="4"');
    // With no tag, the row converts it, so the stay is only for another tag.
    expect(await lookup('title is-4 is-size-2')).toContain(
      '| `is-4` | `size="4"` | exact only on <h4> or <p>; on another tag, `textSize` is written by `is-size-2` already, so this class is the one that stays |'
    );
    // A size for one viewport writes another prop, so the note stands.
    expect(await lookup('title is-4 is-size-2-mobile', 'h2')).toContain(
      'on this <h2>, write `textSize="4"` in its place'
    );
  });

  it('says when the component cannot render the tag', async () => {
    expect(await lookup('section', 'div')).toContain(
      '`Section` renders only <section>, not a <div>'
    );
  });

  it("says another component's class stays a class, which component won and why", async () => {
    expect(await lookup('columns box', 'div')).toContain(
      "| `box` | stays in `className` | bestax `Box`'s class too, and an element converts to one component: `Columns` here, since the codemod ranks `.columns` first, putting layout and parts ahead of surfaces; to use `Box`, give it an element of its own around or inside this one |"
    );
    // A component that renders the tag wins over one ranked ahead of it.
    const image = await lookup('image is-128x128 container', 'figure');
    expect(image).toContain('**Component:** `Image` with `as="figure"`.');
    expect(image).toContain(
      '`Image` here, since `Container` renders <div>, <main>, <section>, <article>, <aside>, <header>, <footer> or <nav> through `as`, not a <figure>; where it is only there to center this element, `mx="auto"` centers it'
    );
    expect(await lookup('image is-128x128 container', 'div')).toContain(
      '**Component:** `Container`.'
    );
    // And one whose own tag it is wins over one that reaches it through `as`.
    const hero = await lookup('container hero is-primary', 'section');
    expect(hero).toContain('**Component:** `Hero`.');
    expect(hero).toContain(
      "`Hero` here, since a <section> is `Hero`'s own element, and `Container` renders one only through `as`"
    );
    // The fit is to the tag the classes pick: a ratio puts `Image` on a
    // <figure>, so it reaches a <div> only through `as`, like `Media.Left`.
    const left = await lookup('media-left image is-1by1', 'div');
    expect(left).toContain('**Component:** `Media.Left` with `as="div"`.');
    expect(left).toContain(
      "| `image` | stays in `className` | bestax `Image`'s class too, and an element converts to one component: `Media.Left` here, since the codemod ranks `.media-left` first, putting layout and parts ahead of surfaces;"
    );
    const item = await lookup('navbar-item image is-16by9', 'figure');
    expect(item).toContain('**Component:** `Image`.');
    expect(item).toContain(
      '`Image` here, since `Image` renders a <figure> with these classes and no `as`, and `Navbar.Item` renders one only through `as`'
    );
    // A heading's size picks its tag the same way.
    expect(await lookup('navbar-item title is-3', 'h3')).toContain(
      '`Title` here, since `Title` renders an <h3> with these classes and no `as`, and `Navbar.Item` renders one only through `as`'
    );
  });

  it('sends a family bestax converts as a whole to its recipe', async () => {
    const out = await lookup('dropdown box');
    expect(out).toContain('**Stays markup:** `.dropdown`:');
    expect(out).toContain('| `dropdown` | by hand |');
    expect(out).toContain('bulma-classes-unmappables');
  });

  it('says File renders is-empty itself beside has-name with no name', async () => {
    // And that the name is pinned empty there, as the codemod writes it, so
    // a pick shows no name where the markup shows none.
    expect(await lookup('file has-name')).toContain(
      'With `hasName` and no `.file-name`, write `fileName=""`, so a file the user picks shows no name where the markup shows none. ' +
        "It renders Bulma's `is-empty` there itself, so that class isn't needed."
    );
    // The class's own row says the same, rather than keeping it as a class.
    const out = await lookup('file has-name is-empty');
    expect(out).toContain(
      '| `is-empty` | rendered by `File` | with no `.file-name` in the tree; beside one it stays in `className` |'
    );
    expect(out).not.toMatch(/\| `is-empty` \| stays in `className` \|/);
  });

  it('writes a layout value with the class it renders beside, and only then', async () => {
    const out = await lookup('field has-addons has-addons-centered', 'div');
    expect(out).toContain(
      '| `has-addons-centered` | `hasAddons="centered"` | beside `has-addons`, which it renders too |'
    );
    expect(out).toContain(
      '| `has-addons` | rendered by `Field` | from `hasAddons="centered"`, which `has-addons-centered` sets |'
    );
    expect(await lookup('field is-grouped-right', 'div')).toContain(
      '| `is-grouped-right` | stays in `className` | `grouped="right"` renders `is-grouped` too, so it converts only beside that class |'
    );
    // A second layout for the prop stays, as a second size does.
    expect(
      await lookup('field is-grouped is-grouped-multiline is-grouped-right')
    ).toContain(
      '| `is-grouped-right` | stays in `className` | `grouped` is already set by `is-grouped-multiline` |'
    );
  });

  it('writes a prop typed as a number as a number', async () => {
    const out = await lookup('cell is-col-span-2', 'div');
    expect(out).toContain('**Component:** `Cell`.');
    expect(out).toContain('| `is-col-span-2` | `colSpan={2}` |');
    expect(await lookup('grid is-gap-2', 'div')).toContain('`gap="2"`');
  });

  it('says which classes a part without helper props keeps', async () => {
    expect(await lookup('navbar-dropdown is-right mt-2', 'div')).toContain(
      '| `mt-2` | stays in `className` | bestax `Navbar.DropdownMenu` takes no helper props |'
    );
    expect(await lookup('navbar-divider mt-2', 'hr')).toContain(
      '| `mt-2` | stays in `className` | bestax `Navbar.Divider` takes no helper props |'
    );
    expect(await lookup('navbar-divider', 'hr')).toContain(
      '**Component:** `Navbar.Divider`.'
    );
  });

  it('folds a wrapper into the component that renders it', async () => {
    expect(await lookup('table-container', 'div')).toContain(
      '**Folds into the `Table` inside it**, as `isResponsive`:'
    );
    const grid = await lookup('fixed-grid has-3-cols', 'div');
    expect(grid).toContain('as `isFixed` `fixedCols={3}`:');
    expect(grid).toContain('| `has-3-cols` | `fixedCols={3}` |');
    expect(await lookup('table-container mt-2', 'div')).toContain(
      '**Stays markup:** bestax renders `.table-container` with nothing on it but its own class and modifiers.'
    );
  });

  it('says when a component renders the element inside it', async () => {
    const select = await lookup('select is-multiple is-small', 'div');
    expect(select).toContain(
      "It renders the <select> inside it itself, and puts the attributes it is given on that <select>: write the <select>'s attributes and children on `SelectBase` in its place, and nothing on this element but a `key`. On the <select>, `is-hovered` becomes `isHovered`, `is-focused` becomes `isFocused` and `size` becomes `multipleSize` (beside `multiple`). It renders no <label>: one beside the <select> goes on `Select` instead, as its `label` with its classes in `labelProps`, and `Select` renders a `Field` and a `Control` around it. Inside a `Field` it drops that `label`, and inside a bare `Control` it nests the label's `.field` there, so in either move the <label> out beside this element, pointing at the <select>'s `id`, or give the <select> an `aria-label`."
    );
    expect(select).toContain(
      '| `is-multiple` | `multiple` | with a bare `multiple` on the <select> inside, which it renders |'
    );
    expect(await lookup('breadcrumb has-dot-separator', 'nav')).toContain(
      "It renders the <ul> inside it itself, bare: put that <ul>'s children straight inside `Breadcrumb`"
    );
    const image = await lookup('image is-64x64 is-4by3', 'figure');
    expect(image).toContain(
      "It renders the <img> inside it itself, from its own `src` and `alt` props: write the <img>'s `src` and `alt` on `Image` in its place, which converts that way only around an <img> with no other attribute. On the <img>, `is-rounded` becomes `isRounded`. Around other HTML elements written out it renders them as given, in place of its own <img>, so put them inside `Image` as they are; around an expression, which can come out empty, it would render its own."
    );
    expect(image).toContain('| `is-64x64` | `size="64x64"` |');
    expect(image).toContain(
      '| `is-4by3` | stays in `className` | `size` is already set by `is-64x64` |'
    );
    // A ratio puts `Image` on a <figure> with no `as`, so only another tag
    // keeps one.
    const ratio = await lookup('image is-4by3', 'figure');
    expect(ratio).toContain('**Component:** `Image`.');
    expect(ratio).toContain('| `is-4by3` | `size="4by3"` |');
    expect(await lookup('image is-4by3', 'div')).toContain(
      '**Component:** `Image` with `as="div"`.'
    );
    expect(await lookup('image is-4by3')).toContain(
      '(renders <figure> with these classes, or <div>, <figure> or <p> through `as`)'
    );
    expect(await lookup('image is-4by3', 'span')).toContain(
      '`Image` renders <figure> with these classes, or <div>, <figure> or <p> through `as`, not a <span>'
    );
    expect(await lookup('card', 'div')).not.toContain('inside it itself');
  });

  it('writes a color shade as its color and its shade, and keeps what one of each cannot write', async () => {
    const shades = await lookup(
      'has-text-primary-on-scheme has-background-info-light has-text-link-30 has-text-danger-30-invert',
      'p'
    );
    expect(shades).toContain(
      '| `has-text-primary-on-scheme` | `textColor="primary"` `colorShade="on-scheme"` |'
    );
    expect(shades).toContain(
      '| `has-background-info-light` | `bgColor="info"` `backgroundColorShade="light"` |'
    );
    expect(shades).toContain(
      '| `has-text-link-30` | stays in `className` | `textColor` is already set by `has-text-primary-on-scheme` |'
    );
    expect(shades).toContain(
      '| `has-text-danger-30-invert` | stays in `className` | a color shade with no single shade'
    );
    expect(await lookup('table has-text-success-dark', 'table')).toContain(
      '| `has-text-success-dark` | `color="success"` `colorShade="dark"` |'
    );
  });

  it('follows a part to the tags its `as` takes, and no further', async () => {
    for (const tag of ['div', 'label']) {
      const block = await lookup('panel-block', tag);
      expect(block).toContain('**Component:** `Panel.Block`');
      expect(block).toContain(`\`as="${tag}"\``);
    }
    expect(await lookup('panel-block', 'span')).toContain(
      '**Component:** `Panel.Block` renders <a>, <div> or <label> through `as`, not a <span>'
    );
    expect(await lookup('panel-block', 'a')).toContain(
      '**Component:** `Panel.Block`'
    );
    expect(await lookup('hero', 'main')).toContain('`as="main"`');
  });

  it('says when a component renders its class only at the top level', async () => {
    expect(await lookup('menu-list', 'ul')).toContain(
      'It renders `.menu-list` only when no other `Menu.List` is around it, so one inside another `.menu-list`, or around a `Menu.List`, stays markup.'
    );
    expect(await lookup('menu', 'aside')).not.toContain('only when no other');
  });

  it('says when a component renders the element around it, or its text', async () => {
    const link = await lookup('pagination-link is-current', 'a');
    expect(link).toContain(
      "It renders its own bare <li> around the element too: write it in the <li>'s place, which converts only when that <li> holds nothing else and carries nothing but a `key`."
    );
    expect(link).toContain(
      'beside an `aria-current` of the element\'s own, since the prop renders `aria-current="page"` otherwise; without one it stays a class'
    );
    const ellipsis = await lookup('pagination-ellipsis', 'span');
    expect(ellipsis).toContain(
      'It renders its own `\u2026` as its content, so write it closing itself.'
    );
    expect(ellipsis).toContain(
      "A `className` it's given replaces its own class, so it converts only with no other class."
    );
    expect(await lookup('pagination-ellipsis mt-2', 'span')).toContain(
      '**Stays markup:**'
    );
  });

  it('says what the items of a list become, by where they sit', async () => {
    expect(await lookup('menu-list', 'ul')).toContain(
      "Each <li> in it holding an <a>, at most one bare <ul> after it, which becomes a `Menu.List` after the <a>'s children, and nothing else becomes a `Menu.Item`, written in the <li>'s place around the <a>'s children. `is-active` on the <a> becomes `active`. `Menu.Item` puts `className`, `id`, `title`, `role`, `tabIndex`, `style` and `data-testid` on the <li> and everything else on the <a>, so an item converts only when its attributes already sit that way."
    );
    expect(await lookup('menu', 'aside')).not.toContain('Each <li>');
  });

  it('says when a component renders the children from a count', async () => {
    const lines = await lookup('skeleton-lines', 'div');
    expect(lines).toContain(
      '**Component:** `Skeleton` with `variant="lines"`. It renders this element\'s children itself, `lines` bare, empty <div>s: write their count as `lines={N}` and drop them.'
    );
    expect(await lookup('skeleton-block', 'div')).toContain(
      '**Component:** `Skeleton`.'
    );
  });

  it('says when a component needs one of its parts inside', async () => {
    expect(await lookup('card', 'div')).toContain(
      '**Component:** `Card`. It renders its children inside a `.card-content` of its own unless one of them is a `Card.Header`,'
    );
    expect(await lookup('card-content')).not.toContain('renders its children');
    // A field wraps its children only when it's horizontal.
    expect(await lookup('field is-horizontal', 'div')).toContain(
      'inside a `.field-body` of its own unless one of them is a `Field.Label` or `Field.Body`'
    );
    expect(await lookup('field', 'div')).not.toContain('renders its children');
  });

  it('answers helper classes with no component, and says what that depends on', async () => {
    const out = await lookup('has-text-centered mt-4 has-text-danger');
    expect(out).toContain('**No component in these classes.**');
    expect(out).toContain('| `mt-4` | `mt="4"` |');
    // The color prop is named per component, so the row says which differ.
    expect(out).toMatch(
      /\| `has-text-danger` \| `textColor="danger"` \| on most components;/
    );
    expect(await lookup('has-text-centered', 'p')).toContain(
      '**Component:** `Paragraph`.'
    );
    expect(await lookup('has-text-centered', 'div')).toContain(
      'bestax has no component for a plain <div>'
    );
  });

  it('names the prop for a class the codemod leaves alone on purpose', async () => {
    // The class stays, but bestax has the prop: it renders more than the class.
    expect(await lookup('button is-disabled')).toMatch(
      /\| `is-disabled` \| stays in `className` \| bestax `Button` renders it through `isDisabled`/
    );
    expect(await lookup('tag is-delete')).toContain('`isDelete`');
  });

  it('names a prop that needs another class beside it', async () => {
    const out = await lookup('is-justify-content-center');
    expect(out).toContain(
      'each prop these classes name needs another class beside it'
    );
    expect(out).toContain(
      '`justifyContent="center"` renders only beside a flex `display`'
    );
  });

  it('keeps the tag advice and the rows below it in agreement', async () => {
    const out = await lookup('notification is-primary', 'p');
    expect(out).toContain('the rows below are what it takes then');
    expect(out).toContain('| `is-primary` | `color="primary"` |');
  });

  it('keeps a Bulma 0.9 hint beside a class that keeps the markup', async () => {
    expect(await lookup('label tile')).toContain('Bulma v1 removed tiles');
  });

  it('reads a selector as well as a class string', async () => {
    expect(await lookup('.button.is-primary')).toContain(
      '| `is-primary` | `color="primary"` |'
    );
  });

  it('answers a class named like an Object member as the class it is', async () => {
    expect(await lookup('toString constructor')).toContain(
      '| `toString` | stays in `className` |'
    );
  });

  it('asks for classes when given none', async () => {
    const result = await call('lookup_bulma_classes', { classes: '  ' });
    expect(failed(result)).toBe(true);
    expect(text(result)).toContain('button is-primary');
  });

  it('rejects a tag that is not a lowercase tag name', async () => {
    const result = await call('lookup_bulma_classes', {
      classes: 'box',
      tag: '<div>',
    });
    expect(failed(result)).toBe(true);
  });
});

describe('skills', () => {
  it('lists every skill with its trigger description', async () => {
    const out = text(await call('list_skills'));
    expect(out).toContain('## bestax-theming');
    expect(out).toContain('MCP prompt: `theming`');
  });

  it('returns a skill body by full or short name', async () => {
    for (const name of ['bestax-theming', 'theming']) {
      const out = text(await call('get_skill', { name }));
      expect(out.length).toBeGreaterThan(500);
    }
  });

  it('returns a named reference document', async () => {
    const out = text(
      await call('get_skill', {
        name: 'theming',
        reference: 'css-variables',
      })
    );
    expect(out).toContain('--bulma-');
    expect(out.length).toBeGreaterThan(2000);
  });

  it('lists the available references when the id is wrong', async () => {
    const res = await call('get_skill', {
      name: 'theming',
      reference: 'nope',
    });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('css-variables');
  });

  it('names the available skills when the skill is wrong', async () => {
    const res = await call('get_skill', { name: 'nope' });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('bestax-form');
  });

  it('serves a skill as a prompt carrying the task', async () => {
    const prompt = await client.getPrompt({
      name: 'theming',
      arguments: { task: 'make the brand purple' },
    });
    const body = prompt.messages[0].content as { text: string };
    expect(body.text).toContain('make the brand purple');
    expect(body.text).toContain('get_skill');
  });
});

describe('resources', () => {
  it('reads the catalog', async () => {
    const res = await client.readResource({ uri: 'bestax://catalog' });
    expect(String(res.contents[0].text)).toContain('**Button**');
  });

  it('reads a component, with every section included', async () => {
    const res = await client.readResource({
      uri: 'bestax://components/Button',
    });
    const body = String(res.contents[0].text);
    expect(body).toContain('## Examples');
    expect(body).toContain('## CSS Variables');
  });

  it('reads a skill and one of its references', async () => {
    const skill = await client.readResource({
      uri: 'bestax://skills/bestax-theming',
    });
    expect(String(skill.contents[0].text).length).toBeGreaterThan(500);
    const ref = await client.readResource({
      uri: 'bestax://skills/bestax-theming/references/css-variables',
    });
    expect(String(ref.contents[0].text)).toContain('--bulma-');
  });

  it('rejects an unknown component resource', async () => {
    await expect(
      client.readResource({ uri: 'bestax://components/Nope' })
    ).rejects.toThrow();
  });

  it('completes a component name as the user types it', async () => {
    // Argument completion is what makes the templated resources usable from a
    // client's picker; without it the user has to know the exact name already.
    const res = await client.complete({
      ref: { type: 'ref/resource', uri: 'bestax://components/{name}' },
      argument: { name: 'name', value: 'But' },
    });
    expect(res.completion.values).toContain('Button');
    expect(res.completion.values).toContain('Buttons');
    expect(res.completion.values).not.toContain('Navbar');
  });

  it('completes skill names for both skill templates', async () => {
    for (const uri of [
      'bestax://skills/{name}',
      'bestax://skills/{name}/references/{ref}',
    ]) {
      const res = await client.complete({
        ref: { type: 'ref/resource', uri },
        argument: { name: 'name', value: '' },
      });
      expect(res.completion.values).toContain('bestax-theming');
    }
  });

  it('rejects an unknown skill, and an unknown reference of a real skill', async () => {
    await expect(
      client.readResource({ uri: 'bestax://skills/nope' })
    ).rejects.toThrow();
    await expect(
      client.readResource({ uri: 'bestax://skills/nope/references/x' })
    ).rejects.toThrow();
    await expect(
      client.readResource({
        uri: 'bestax://skills/bestax-theming/references/nope',
      })
    ).rejects.toThrow();
  });
});

describe('edge cases that would otherwise read as "no answer"', () => {
  it('says a component registers no CSS variables rather than returning blank', async () => {
    // `Block` is one of the components verified to register none — an empty
    // response would read as "lookup failed".
    const out = text(await call('get_css_variables', { component: 'Block' }));
    expect(out).toContain('no CSS variables');
  });

  it('says so when a CSS variable query matches nothing', async () => {
    const out = text(
      await call('get_css_variables', { query: 'zzzz-no-such-var' })
    );
    expect(out).toContain('No CSS variable');
  });

  it('narrows CSS variables within one component', async () => {
    // A query that matches some of Button's variables and not others. One matching none
    // would pass a check for the query's own text, since the "none matching" sentence
    // repeats it.
    const all = (await loadComponent('Button')).cssVars.map(v => v.css);
    const matching = all.filter(css => css.includes('padding'));
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.length).toBeLessThan(all.length);
    expect(all).toContain('--bulma-button-family');

    const out = text(
      await call('get_css_variables', { component: 'Button', query: 'padding' })
    );
    expect(out).toContain('# Button CSS variables');
    for (const css of matching) expect(out).toContain(`\`${css}\``);
    expect(out).not.toContain('--bulma-button-family');
  });

  it('says "matching" when a query finds none of the rows a component has', async () => {
    // Rows of its own and no other component to point at, so the sentence is the
    // plain one, with the query in it.
    const box = await loadComponent('Box');
    expect(box.cssVars.length).toBeGreaterThan(0);
    expect(box.cssVarsFrom).toBeUndefined();
    const out = text(
      await call('get_css_variables', { component: 'Box', query: 'zzz' })
    );
    expect(out).toMatch(
      /^Box registers no CSS variables matching "zzz"\.(\n|$)/
    );
  });

  it('describes a subcomponent that has no props of its own', async () => {
    // `Navbar.Divider` types its props inline, so it has no table. Saying
    // nothing would read as a failed lookup.
    const out = text(
      await call('get_props', { component: 'Navbar', path: 'Navbar.Divider' })
    );
    expect(out).toContain('### Navbar.Divider');
    expect(out).toMatch(/No props of its own/);
  });

  it('reports a component with no examples', async () => {
    const catalogText = text(await call('list_components'));
    expect(catalogText).toBeTruthy();
    // Every documented component has at least one example today; assert the
    // shape of the message rather than depending on one that does not.
    const out = text(
      await call('get_examples', { component: 'Button', query: '!!!!' })
    );
    expect(out).toMatch(/No Button examples match|has no examples/);
  });
});

// Rough edges from a smoke test of a published release (#935).
describe('rough edges', () => {
  const codeOf = async (uri: string) =>
    client.readResource({ uri }).then(
      () => null,
      (err: { code?: number }) => err.code
    );

  it('reports its own version as serverInfo, not the library version', async () => {
    const pkg = JSON.parse(
      await readFile(join(process.cwd(), 'package.json'), 'utf8')
    ) as { version: string };
    expect(client.getServerVersion()).toMatchObject({
      name: 'bestax',
      version: pkg.version,
    });
    // The library version stays where a reader looks for it.
    const catalog = JSON.parse(
      await readFile(join(process.cwd(), 'data', 'catalog.json'), 'utf8')
    ) as { generatedFrom: { version: string } };
    expect(client.getInstructions()).toContain(catalog.generatedFrom.version);
  });

  it('shows an import a page written as prose can compile', async () => {
    const out = text(
      await call('get_component', { name: 'Valid value constants' })
    );
    expect(out).toContain('validColors');
    expect(out).not.toContain('import { Valid value constants }');
  });

  it('prints the summary once', async () => {
    for (const name of ['Button', 'Popover', 'Input']) {
      const out = text(await call('get_component', { name }));
      const opening = out.split('\n\n')[1];
      expect(out.split(opening).length - 1).toBe(1);
    }
  });

  it('answers a dot-path with the part it names', async () => {
    const out = text(await call('get_component', { name: 'Navbar.Brand' }));
    expect(out).toMatch(/^# Navbar\.Brand\n/);
    expect(out).toContain('is a part of `Navbar`');
    expect(out).not.toContain('**Subcomponents:**');

    const resource = await client.readResource({
      uri: 'bestax://components/Navbar.Brand',
    });
    expect(String(resource.contents[0].text)).toMatch(/^# Navbar\.Brand\n/);
  });

  // The self-closing form leaves a space before `/>`, which made `<Navbar.Brand />`
  // a part that does not exist and `<Button />` a component that does not.
  it('reads a name written as a self-closing tag', async () => {
    const part = text(
      await call('get_component', { name: '<Navbar.Brand />' })
    );
    expect(part).toMatch(/^# Navbar\.Brand\n/);
    expect(part).not.toContain('has no part');

    const res = await call('get_component', { name: '<Button />' });
    expect(failed(res)).toBe(false);
    expect(text(res)).toMatch(/^# Button\n/);
  });

  it('says in its schema that get_component takes a dot-path', async () => {
    const tool = (await client.listTools()).tools.find(
      t => t.name === 'get_component'
    );
    expect(tool?.description).toContain('"Navbar.Brand"');
    expect(JSON.stringify(tool?.inputSchema.properties?.name)).toContain(
      'Navbar.Brand'
    );
  });

  it('says so when a dot-path names no part', async () => {
    const out = text(await call('get_component', { name: 'Navbar.Nope' }));
    expect(out).toMatch(/^# Navbar\n/);
    expect(out).toContain('has no part `Navbar.Nope`');
    expect(out).toContain('`Navbar.Brand`');
  });

  it('says `path` is for subcomponents when it is given a prop', async () => {
    const res = await call('get_props', {
      component: 'Button',
      path: 'Button.isLoadng',
    });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('names a subcomponent');
    expect(text(res)).toContain('`isLoading`');

    const typo = text(
      await call('get_props', { component: 'Navbar', path: 'Navbar.Brnd' })
    );
    expect(typo).toContain('Did you mean "Navbar.Brand"?');
  });

  it("explains Theme's variables rather than saying it has none", async () => {
    for (const query of [undefined, 'primary']) {
      const out = text(
        await call('get_css_variables', { component: 'Theme', query })
      );
      expect(out).not.toContain('registers no CSS variables');
      expect(out).toContain('reference: "css-variables"');
    }
  });

  it('marks a missing query and an unknown helper group as errors', async () => {
    for (const query of ['', '   ']) {
      expect(failed(await call('search_bestax', { query }))).toBe(true);
    }
    expect(
      failed(await call('get_helper_props', { group: 'animations' }))
    ).toBe(true);
  });

  it('answers an unknown resource as not found, not as an internal error', async () => {
    for (const uri of [
      'bestax://components/DatePicker',
      'bestax://skills/nope',
      'bestax://skills/nope/references/x',
      'bestax://skills/bestax-theming/references/nope',
    ]) {
      expect(await codeOf(uri)).toBe(-32602);
    }
  });

  it('reads a skill by the short name get_skill takes, and its examples', async () => {
    const skill = await client.readResource({ uri: 'bestax://skills/theming' });
    expect(String(skill.contents[0].text).length).toBeGreaterThan(500);
    // get_skill lists dark-mode among what it can read; so does the resource now.
    const example = await client.readResource({
      uri: 'bestax://skills/bestax-theming/references/dark-mode',
    });
    expect(String(example.contents[0].text).length).toBeGreaterThan(100);
  });

  it('completes skill names by what has been typed, and reference ids', async () => {
    const named = await client.complete({
      ref: { type: 'ref/resource', uri: 'bestax://skills/{name}' },
      argument: { name: 'name', value: 'them' },
    });
    expect(named.completion.values).toEqual(['bestax-theming']);

    const ref = await client.complete({
      ref: {
        type: 'ref/resource',
        uri: 'bestax://skills/{name}/references/{ref}',
      },
      argument: { name: 'ref', value: 'dark' },
      context: { arguments: { name: 'bestax-theming' } },
    });
    expect(ref.completion.values).toEqual(['dark-mode']);
  });
});

// Exports with no page of their own, which answers named while the tools refused
// them: a lookup's `InputBase` (#1150), an import line's `CarouselItem` and a part's
// `Thead` (#1174).
describe('exports documented with another component', () => {
  it('answers get_props for the base a class lookup names', async () => {
    for (const [base, wrapper, prop] of [
      ['InputBase', 'Input', 'isStatic'],
      ['SelectBase', 'Select', 'multipleSize'],
      ['TextAreaBase', 'TextArea', 'hasFixedSize'],
    ]) {
      const res = await call('get_props', { component: base });
      expect(failed(res)).toBe(false);
      const out = text(res);
      expect(out).toContain(`### ${base}`);
      expect(out).toContain(
        `\`${base}\` is exported on its own and documented with \`${wrapper}\`, which renders it.`
      );
      expect(out).toContain(`| \`${prop}\` |`);
    }
  });

  it("lists them on the component's own answer, apart from its subcomponents", async () => {
    const out = text(await call('get_props', { component: 'Input' }));
    expect(out).toContain(
      '**Documented here too:** `InputBase`, which it renders.'
    );
    expect(out).not.toContain('**Subcomponents:**');
    // Not a compound for it, either.
    const listing = text(await call('list_components', { category: 'form' }));
    expect(listing).toMatch(/- \*\*Input\*\* —/);
  });

  it('answers for a companion the import line names, and its own import', async () => {
    const props = text(await call('get_props', { component: 'CarouselItem' }));
    expect(props).toContain('### CarouselItem');
    expect(props).toContain('| `active` |');
    const page = text(await call('get_component', { name: 'CarouselItem' }));
    expect(page).toContain('# CarouselItem');
    expect(page).toContain(
      "import { Carousel, CarouselItem } from '@allxsmith/bestax-bulma';"
    );
    // A base is left out of its wrapper's import, so it gets one of its own.
    const base = text(await call('get_component', { name: 'inputbase' }));
    expect(base).toContain(
      "import { InputBase } from '@allxsmith/bestax-bulma';"
    );
    expect(base).toContain("examples, CSS variables and notes are `Input`'s");
  });

  it('says a companion is no dot-path when asked for one', async () => {
    const res = await call('get_props', {
      component: 'Carousel',
      path: 'Carousel.Item',
    });
    expect(failed(res)).toBe(true);
    expect(text(res)).toContain('Did you mean "CarouselItem"?');
    expect(text(res)).toContain(
      'not a dot-path, so it is written <CarouselItem>'
    );
  });

  it('answers a sub exported standalone with its table, not a pointer back to itself', async () => {
    const out = text(await call('get_props', { component: 'Thead' }));
    expect(out).toContain('### Table.Thead');
    expect(out).toContain(
      'Also exported standalone as `Thead`, the same component, so this is its table.'
    );
    // A borrowed sub goes to the component that declares it.
    expect(
      text(await call('get_props', { component: 'DropdownItem' }))
    ).toContain('### Dropdown.Item');
  });

  it("reads a container's inline props, and says when one takes none", async () => {
    const toast = text(
      await call('get_props', { component: 'ToastContainer' })
    );
    expect(toast).toContain('| `position` |');
    expect(toast).toContain("`'top-right'`");
    expect(
      text(await call('get_props', { component: 'DialogContainer' }))
    ).toContain('Takes no props, not even the standard HTML attributes.');
    expect(
      text(
        await call('get_props', {
          component: 'Dropdown',
          path: 'Dropdown.Divider',
        })
      )
    ).toContain('Takes no props');
  });

  it('serves the examples that use one, and points a base at its wrapper', async () => {
    const items = text(
      await call('get_examples', { component: 'CarouselItem' })
    );
    expect(items).toContain('# CarouselItem examples');
    expect(items).toContain("From `Carousel`'s documentation page");
    expect(items).toContain('<CarouselItem>');
    expect(
      text(await call('get_examples', { component: 'DropdownItem', limit: 1 }))
    ).toContain('<Dropdown.Item');
    const base = text(await call('get_examples', { component: 'InputBase' }));
    expect(base).toContain('`InputBase` has no examples of its own.');
    expect(base).toContain('get_examples({ component: "Input" })');
    expect(
      text(
        await call('get_examples', { component: 'CarouselItem', query: '!!!' })
      )
    ).toContain('No CarouselItem examples match "!!!"');
  });

  it('names the component whose variables they are', async () => {
    expect(
      text(await call('get_css_variables', { component: 'InputBase' }))
    ).toContain(
      '`InputBase` is documented with `Input`, whose variables these are.'
    );
  });

  it('finds one by name in search_bestax', async () => {
    const out = text(await call('search_bestax', { query: 'InputBase' }));
    expect(out.split('\n')[2]).toContain(
      '| component | InputBase | documented with Input'
    );
    expect(out).toContain('`get_component({ name: "InputBase" })`');
  });

  it('answers a sub exported by name beside its parent, which no part names', async () => {
    for (const [name, path] of [
      ['TreeViewItem', 'TreeView.Item'],
      ['NavbarItem', 'Navbar.Item'],
      ['MenuItem', 'Menu.Item'],
      // A sub that is a compound itself is exported by the constant composing it.
      ['TabsContent', 'Tabs.Content'],
    ]) {
      const res = await call('get_props', { component: name });
      expect(failed(res)).toBe(false);
      expect(text(res)).toContain(`### ${path}`);
    }
    expect(
      text(await call('search_bestax', { query: 'TreeViewItem' })).split(
        '\n'
      )[2]
    ).toContain('| component | TreeViewItem | documented with TreeView');
  });

  it("sends a lookup for a base's examples to the component that renders it", async () => {
    const lookup = async (classes: string) =>
      text(await call('lookup_bulma_classes', { classes }));
    expect(await lookup('input is-rounded')).toContain(
      '**Next:** `get_props({ component: "InputBase" })` for its other props · ' +
        '`get_examples({ component: "Input" })` for examples of `Input`, which renders it.'
    );
    expect(await lookup('button')).toContain(
      '**Next:** `get_props({ component: "Button" })` for its other props.'
    );
  });
});

// A name the server hands out that its own tools refuse sends an agent nowhere, which
// is what #1150 and #1174 were. This walks list_components, the import line, the parts
// and the exports a record documents, its related components and the one whose
// variables style it, the CSS variable index, and what lookup_bulma_classes answers
// for every class it has a root or a hint for. Example code and skill bodies name
// components too, and are not walked.
describe('every component or part name an answer hands out', () => {
  const NAME = /^[A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?$/;
  const handed = new Map<string, string>();
  const examples = new Map<string, string>();
  const hand = (name: string, where: string) => {
    if (NAME.test(name) && !handed.has(name)) handed.set(name, where);
  };

  beforeAll(async () => {
    const catalog = await loadCatalog();
    for (const { name } of catalog.components) hand(name, 'list_components');
    for (const name of Object.keys(catalog.documentedWith)) {
      hand(name, 'search_bestax');
    }
    for (const declarers of Object.values(catalog.cssVarIndex)) {
      for (const name of declarers) hand(name, 'get_css_variables');
    }
    for (const { name } of catalog.components) {
      const record = await loadComponent(name);
      const imported = record.import.match(/\{([^}]*)\}/)?.[1] ?? '';
      for (const id of imported.split(',')) hand(id.trim(), `${name}'s import`);
      for (const part of record.parts) {
        hand(part.path, `${name}'s parts`);
        if (part.component) hand(part.component, part.path);
      }
      for (const related of record.related) hand(related, `${name}'s related`);
      if (record.cssVarsFrom) hand(record.cssVarsFrom, `${name}'s cssVarsFrom`);
    }
    const classTable = JSON.parse(
      await readFile(join(DATA_DIR, 'bulma-classes.json'), 'utf8')
    );
    for (const name of Object.values<string>(classTable.wrappers)) {
      hand(name, 'lookup_bulma_classes on a plain tag');
    }
    for (const [tag, { target }] of Object.entries<{ target: string }>(
      classTable.byHand
    )) {
      hand(target, `lookup_bulma_classes on a plain <${tag}>`);
    }
    const tokens = [
      ...Object.keys(classTable.roots),
      ...Object.keys(classTable.legacy),
      ...Object.keys(classTable.ownClasses),
    ];
    for (const token of tokens) {
      const out = text(await call('lookup_bulma_classes', { classes: token }));
      for (const m of out.matchAll(/`([A-Z][\w.]*)`/g)) {
        hand(m[1], `lookup of ${token}`);
      }
      for (const m of out.matchAll(/get_props\(\{ component: "([^"]+)"/g)) {
        hand(m[1], `lookup of ${token}`);
      }
      for (const m of out.matchAll(/get_examples\(\{ component: "([^"]+)"/g)) {
        examples.set(m[1], `lookup of ${token}`);
      }
    }
  });

  it('resolves in get_props', async () => {
    expect(handed.size).toBeGreaterThan(150);
    const refused: string[] = [];
    for (const [name, where] of handed) {
      if (failed(await call('get_props', { component: name }))) {
        refused.push(`${name} (from ${where})`);
      }
    }
    expect(refused).toEqual([]);
  });

  it('resolves in get_examples where an answer sends it there', async () => {
    expect(examples.size).toBeGreaterThan(0);
    const refused: string[] = [];
    for (const [name, where] of examples) {
      if (failed(await call('get_examples', { component: name }))) {
        refused.push(`${name} (from ${where})`);
      }
    }
    expect(refused).toEqual([]);
  });

  // The names above are the ones today's answers print. An agent learns others from
  // the docs and from the library's types: `TreeViewItem` beside `TreeView.Item`,
  // `NavbarItem` beside `Navbar.Item`. So every component the library's barrel
  // exports has to resolve too, read from the barrel itself rather than the index.
  it("resolves every component the library's index.ts exports", async () => {
    const exports = barrelComponents();
    expect(exports).toEqual(
      expect.arrayContaining(['TreeViewItem', 'NavbarItem', 'MenuItem'])
    );
    const refused: string[] = [];
    for (const name of exports) {
      if (failed(await call('get_props', { component: name }))) {
        refused.push(name);
      }
    }
    expect(refused).toEqual([]);
  });
});

/**
 * Every capitalised value `bulma-ui/src/index.ts` exports, `export *` ones
 * included, read with TypeScript's binder the way a consumer's import sees them.
 */
function barrelComponents(): string[] {
  const index = join(REPO_ROOT, 'bulma-ui', 'src', 'index.ts');
  const program = ts.createProgram([index], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(index);
  const barrel = source && checker.getSymbolAtLocation(source);
  if (!barrel) throw new Error(`cannot read the exports of ${index}`);
  return checker
    .getExportsOfModule(barrel)
    .filter(symbol => {
      const target =
        symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol;
      return Boolean(target.flags & ts.SymbolFlags.Value);
    })
    .map(symbol => String(symbol.escapedName))
    .filter(name => /^[A-Z]/.test(name))
    .sort();
}

// The three kinds of class no Bulma v1 rule matches each need their own advice, and
// they used to share "not a Bulma class bestax has a prop for" (#1174).
describe("lookup_bulma_classes on classes Bulma v1 doesn't have", () => {
  const lookup = async (classes: string) =>
    text(await call('lookup_bulma_classes', { classes }));
  const REMOVED = 'a Bulma 0.9 class that v1 removed';
  const NOT_BULMA =
    "not a Bulma 1 class: Bulma 1's stylesheet has no rule for it.";

  it('says a Bulma 0.9 class v1 removed was removed', async () => {
    expect(await lookup('columns is-variable is-2')).toContain(
      `| \`is-variable\` | stays in \`className\` | ${REMOVED}`
    );
    // Beside a family converted by hand too, rather than "converted with it".
    expect(await lookup('message heading')).toContain(
      `| \`heading\` | stays in \`className\` | ${REMOVED}`
    );
  });

  it('converts a removed helper as the v1 one, and says what replaced it where it stays', async () => {
    expect(await lookup('section is-paddingless')).toContain(
      '| `is-paddingless` | `p="0"` | Bulma 1 removed `is-paddingless`, so this renders its v1 class, `p-0`, in its place |'
    );
    // Beside a family, and beside a class that already wrote the prop.
    for (const classes of ['message is-marginless', 'box m-2 is-marginless']) {
      expect(await lookup(classes)).toContain(
        '| `is-marginless` | stays in `className` | Bulma v1 removed `is-marginless`'
      );
    }
  });

  it('says a class Bulma 1 has no rule for is none of its, and claims nothing of 0.9', async () => {
    for (const [classes, token] of [
      ['has-text-green', 'has-text-green'],
      // Bulma's `.image` sizes stop at 128x128, so this one is no modifier of it.
      ['image is-256x256', 'is-256x256'],
    ]) {
      const out = await lookup(classes);
      expect(out).toContain(
        `| \`${token}\` | stays in \`className\` | ${NOT_BULMA}`
      );
      expect(out).toContain("If the project's own CSS");
      expect(out).not.toContain('an `.image` modifier');
      // Nothing here holds a class to 0.9's stylesheet but the removed list.
      expect(out).not.toContain('0.9');
    }
  });

  it('still names the family of a v1 class away from its root', async () => {
    expect(await lookup('is-128x128')).toContain('an `.image` modifier');
    expect(await lookup('is-primary')).toContain(
      'a Bulma modifier, which bestax converts only beside ' +
        '`.button`, `.hero`, `.navbar` or another'
    );
    // Bulma styles a `.table` cell's `is-vcentered` too, which bestax does not
    // convert, so the note names where bestax converts it, not what it modifies.
    expect(
      await call('lookup_bulma_classes', { classes: 'is-vcentered', tag: 'td' })
    ).toMatchObject({
      content: [
        {
          text: expect.stringContaining(
            'a Bulma modifier, which bestax converts only beside `.columns`'
          ),
        },
      ],
    });
  });
});

// The re-ports of #1118 asked the lookup about markup the skill and the codemod both
// had an answer for, and it had none: a table cell, bulma-social, a `.icon` beside a
// `.control`'s icons, Font Awesome on a bare <i>, a bare checkbox input, a class of
// bestax's own (#1236, #1235).
describe('lookup_bulma_classes where the skill and the codemod have an answer', () => {
  const lookup = async (classes: string, tag?: string) =>
    text(
      await call('lookup_bulma_classes', tag ? { classes, tag } : { classes })
    );

  it('names the table part that renders a plain cell or row, and its props', async () => {
    const th = await lookup('has-text-centered', 'th');
    expect(th).not.toContain('bestax has no component');
    expect(th).toContain(
      '**Stays markup:** the codemod converts no plain <th>, though bestax `Table.Th` renders one as it is'
    );
    // Its own props come from its record, so a prop the library adds reaches here.
    expect(th).toContain(
      'props of its own, `isAligned`, `isNarrow`, `isVcentered`, `width` and `color`, and helper props.'
    );
    expect(th).toContain(
      '| `has-text-centered` | stays in `className` | the codemod converts no plain <th>, so its classes stay; on `Table.Th`, `textAlign="centered"` renders it |'
    );
    expect(th).toContain('get_props({ component: "Table.Th" })');
    const td = await lookup('has-text-right has-text-primary', 'td');
    expect(td).toContain('bestax `Table.Td` renders one as it is');
    expect(td).toContain(
      'props of its own, `isAligned`, `isNarrow`, `isVcentered` and `color`'
    );
    expect(td).toContain('`textAlign="right"` renders it');
    // A table part's color props are its own, so the lookup claims none.
    expect(td).toContain(
      '`get_props` says whether `Table.Td` has a prop that renders it'
    );
    // A tag no component renders as it is keeps the answer it had.
    expect(await lookup('has-text-centered', 'div')).toContain(
      'bestax has no component for a plain <div>'
    );
  });

  it('names bulma-social for its brand colors, on Button or alone', async () => {
    for (const classes of ['button is-facebook', 'is-x']) {
      const out = await lookup(classes);
      expect(out).toContain('a bulma-social class');
      expect(out).toContain(
        'keep loading bulma-social and keep the class on `Button`'
      );
      expect(out).not.toContain('not a Bulma 1 class');
    }
  });

  it("points a `.icon`'s side at the Control prop that renders it", async () => {
    for (const [side, prop] of [
      ['left', 'iconLeft'],
      ['right', 'iconRight'],
    ]) {
      const out = await lookup(`icon is-${side}`, 'span');
      expect(out).toContain('**Component:** `Icon`.');
      expect(out).toContain(
        `| \`is-${side}\` | stays in \`className\` | Bulma places it inside a \`.control\` with \`has-icons-${side}\`, and bestax \`Control\` renders that icon itself from \`${prop}\``
      );
    }
  });

  it('says Font Awesome on a bare <i> is a glyph `Icon` writes from props', async () => {
    for (const [classes, tag] of [
      ['fas fa-moon fa-lg', 'i'],
      ['fa fa-github', 'i'],
      ['mdi mdi-home', 'i'],
      ['far fa-bell', undefined],
    ] as const) {
      const out = await lookup(classes, tag);
      expect(out).toContain(
        "**Stays markup:** a bare <i> naming an icon font's glyph, which the codemod converts only inside the `.icon` around it"
      );
      expect(out).toContain('write bestax `Icon` in its place by hand');
      expect(out).not.toContain('styles nothing');
      expect(out).toContain('get_props({ component: "Icon" })');
    }
    expect(await lookup('fas fa-moon', 'i')).toContain(
      "| `fa-moon` | stays in `className` | a Font Awesome class: Font Awesome's own stylesheet styles it"
    );
    // Off an <i>, the classes still say whose they are, with no glyph answer.
    const span = await lookup('fas fa-moon', 'span');
    expect(span).toContain('a Font Awesome class');
    expect(span).not.toContain('a bare <i>');
  });

  it('gives a bare checkbox input the recipe for `Checkbox`', async () => {
    const out = await lookup('checkbox', 'input');
    expect(out).toContain('bestax `Checkbox` renders its own styled markup');
    expect(out).toContain('or a bare `<input>`');
    expect(out).toContain(
      '`id`, `name`, `aria-label` and the rest reach its `<input>`'
    );
    expect(out).toContain('add `indeterminate` for a select-all box');
    expect(out).toContain('`--bulma-checkbox-*` variables');
    expect(out).toContain('beside `.styled-checkbox`');
  });

  it("names the component a class of bestax's own stylesheet belongs to", async () => {
    const out = await lookup('carousel', 'div');
    expect(out).toContain(
      "**Stays markup:** `.carousel` is bestax `Carousel`'s own class too"
    );
    // A page's own CSS can own a class bestax's stylesheet styles too, so the
    // answer says what to do either way, not to write the component outright.
    expect(out).toContain(
      "Where it comes from a Bulma extension's markup, write `Carousel` by hand in this element's place. Where the page's own CSS defines it, rename that class"
    );
    const sidebar = await lookup('sidebar mt-2', 'aside');
    expect(sidebar).toContain(
      '| `mt-2` | stays in `className` | the codemod leaves this element as markup, so its classes stay |'
    );
    expect(out).toContain('get_props({ component: "Carousel" })');
    expect(out).not.toContain('not a Bulma 1 class');
    // And bulma-carousel's own, which stop styling with it.
    expect(await lookup('image is-covered', 'figure')).toContain(
      '| `is-covered` | stays in `className` | a bulma-carousel class'
    );
  });

  it('names the on-scheme shade beside a text color', async () => {
    const out = await lookup('has-text-primary', 'a');
    expect(out).toContain(
      '| `has-text-primary` | `textColor="primary"` | for text on the page\'s background, `colorShade="on-scheme"` beside it renders `has-text-primary-on-scheme` instead'
    );
    // Not beside a shade already, or on a background.
    expect(await lookup('has-text-primary-on-scheme', 'a')).not.toContain(
      'beside it renders'
    );
    expect(await lookup('has-background-primary', 'p')).not.toContain(
      'on-scheme'
    );
  });
});

describe('search_bestax inside the skills', () => {
  const search = async (query: string, limit?: number) =>
    text(await call('search_bestax', limit ? { query, limit } : { query }));

  it("finds a skill's recipe its description never names", async () => {
    const out = await search('bulma-social');
    expect(out).toContain(
      '| skill | bestax-migrate › bulma-classes-unmappables › Stylesheets and scripts it loads'
    );
    expect(out).toContain(
      '`get_skill({ name: "bestax-migrate", reference: "bulma-classes-unmappables" })`'
    );
    expect(await search('multi-page routing')).toContain(
      'bulma-classes-unmappables › URLs'
    );
  });

  it('finds the component for a Bulma extension, above its CSS variables', async () => {
    const out = await search('bulma-carousel');
    const rows = out.split('\n').filter(line => line.startsWith('| '));
    expect(rows[2]).toContain('| component | Carousel |');
    expect(rows.filter(row => row.startsWith('| css-var |'))).toHaveLength(3);
    expect(out).toContain(
      '| skill | bestax-migrate › bulma-classes-unmappables ›'
    );
    // Asked for CSS variables alone, it lists them all.
    const vars = text(
      await call('search_bestax', { query: 'bulma-carousel', kind: 'css-var' })
    );
    expect(
      vars.split('\n').filter(line => line.startsWith('| css-var |')).length
    ).toBeGreaterThan(3);
  });
});

describe('get_examples under a limit', () => {
  it('names what the limit left out, so no way of writing it goes unseen', async () => {
    const out = text(
      await call('get_examples', { component: 'Modal', limit: 2 })
    );
    expect(out).toContain('**Not shown** under this limit');
    expect(out).toContain('"Compound (dot-notation) usage');
    expect(out).toContain('`get_examples({ component: "Modal", query })`');
    // Nothing to say when every example fits.
    expect(
      text(await call('get_examples', { component: 'Modal', limit: 30 }))
    ).not.toContain('Not shown');
  });

  it('titles an example under a `####` by both headings', async () => {
    const out = text(
      await call('get_examples', {
        component: 'Carousel',
        query: 'Several Items in View',
      })
    );
    expect(out).toContain(
      '### Several Items in View › Stepping and indicators'
    );
    expect(out).toContain('### Several Items in View › Spacing between items');
  });
});

describe('get_helper_props for flex', () => {
  it('lists the gap props a flex container takes, which spacing owns', async () => {
    const out = text(await call('get_helper_props', { group: 'flex' }));
    for (const prop of ['gap', 'columnGap', 'rowGap', 'gapless']) {
      expect(out).toContain(`| \`${prop}\` |`);
    }
    expect(out).toContain('### Gap');
  });
});

// The scaffold's global stylesheet is `src/index.css`. Its `src/App.css` is the starter
// page's, which a port that replaces the page drops, so a class written there loads
// nowhere (#1174).
describe('get_helper_props on where a named class goes', () => {
  it("names the stylesheet a create-bestax app has, not the starter's alone", async () => {
    // The skill's prose, served as it wraps.
    const out = text(
      await call('get_helper_props', { group: 'spacing' })
    ).replace(/\s+/g, ' ');
    expect(out).toContain('In a create-bestax app that is `src/index.css`');
    expect(out).not.toContain('(`src/App.css` in a scaffolded app)');
  });
});

// A client that starts the server outside the project used to get answers checked
// against nothing, and no word of it (#935).
describe('with no installed library to check against', () => {
  let elsewhere: Client;
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bestax-mcp-elsewhere-'));
    const server = await createServer({ cwd: dir });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    elsewhere = new Client({ name: 'test', version: '0' });
    await Promise.all([
      server.connect(serverTransport),
      elsewhere.connect(clientTransport),
    ]);
  });

  afterAll(async () => {
    await elsewhere.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('says so once, naming the variable that points it at the project', async () => {
    const first = text(
      await elsewhere.callTool({
        name: 'get_component',
        arguments: { name: 'Button' },
      })
    );
    expect(first).toContain('no installed @allxsmith/bestax-bulma was found');
    expect(first).toContain('BESTAX_MCP_PROJECT_DIR');

    const second = text(
      await elsewhere.callTool({
        name: 'get_component',
        arguments: { name: 'Button' },
      })
    );
    expect(second).not.toContain('no installed');
  });
});
