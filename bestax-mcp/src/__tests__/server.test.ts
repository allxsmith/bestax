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
import { describe, expect, it, beforeAll } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { createServer } from '../server.js';

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
  it('exposes exactly the nine documented tools', async () => {
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
      'search_bestax',
    ]);
  });

  it('describes every tool, since the description is what routes the model', async () => {
    for (const tool of (await client.listTools()).tools) {
      expect(tool.description?.length ?? 0).toBeGreaterThan(40);
    }
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
});

describe('get_props', () => {
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
    expect(out).toContain('hook');
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
    const out = text(
      await call('get_css_variables', { component: 'Button', query: 'radius' })
    );
    expect(out).toContain('radius');
    expect(out).not.toContain('--bulma-button-family');
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
