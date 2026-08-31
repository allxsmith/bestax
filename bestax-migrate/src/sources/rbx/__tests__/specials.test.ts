/**
 * Structural-handler coverage beyond the fixture pairs: the branches a
 * fixture would have to contort itself to reach — dynamic prop values, the
 * fall-back paths of the container collapses, and the handlers whose whole
 * job is to emit a TODO.
 */

import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos, rules: todos.map(t => t.rule) };
}

const imp = (names: string) => `import { ${names} } from 'rbx';\n`;

describe('rbx plain-element handlers', () => {
  it('turns Heading into a plain .heading paragraph', () => {
    const { output } = migrate(
      imp('Heading') + 'export const A = () => <Heading>x</Heading>;'
    );
    expect(output).toContain('<p className="heading">x</p>');
  });

  it('turns Help into a plain .help paragraph with its colour class', () => {
    const { output } = migrate(
      imp('Help') + 'export const A = () => <Help color="danger">x</Help>;'
    );
    expect(output).toContain('<p className="help is-danger">x</p>');
  });

  it('flags a dynamic Help colour instead of guessing a class', () => {
    const { output, rules } = migrate(
      imp('Help') +
        'export const A = ({ c }: { c: string }) => <Help color={c}>x</Help>;'
    );
    expect(rules).toContain('prop:color');
    expect(output).toContain('className="help"');
  });

  it('turns Label into a plain .label with size and disabled classes', () => {
    const { output } = migrate(
      imp('Label') +
        'export const A = () => <Label size="small" disabled>x</Label>;'
    );
    expect(output).toContain('<label className="label is-small is-disabled">');
  });

  it('merges an existing className into the plain element', () => {
    const { output } = migrate(
      imp('Help') + 'export const A = () => <Help className="mine">x</Help>;'
    );
    expect(output).toContain('className="help mine"');
  });

  it('flags a dynamic className it cannot merge', () => {
    const { output, rules } = migrate(
      imp('Help') +
        'export const A = ({ c }: { c: string }) => <Help className={c}>x</Help>;'
    );
    expect(rules).toContain('prop:className');
    expect(output).toContain('className="help"');
  });

  it('reports helper props dropped by a plain-element rewrite', () => {
    const { rules } = migrate(
      imp('Help') + 'export const A = () => <Help marginless>x</Help>;'
    );
    expect(rules).toContain('plain-element');
  });

  it('turns Select.Option into a plain option', () => {
    const { output } = migrate(
      imp('Select') +
        'export const A = () => <Select.Option value="a">A</Select.Option>;'
    );
    expect(output).toContain('<option value="a">A</option>');
  });

  it('turns Panel.Tab into a plain anchor, keeping is-active', () => {
    const { output } = migrate(
      imp('Panel') + 'export const A = () => <Panel.Tab active>All</Panel.Tab>;'
    );
    expect(output).toContain('<a className="is-active">All</a>');
  });

  it('flags a dynamic Panel.Tab active', () => {
    const { rules } = migrate(
      imp('Panel') +
        'export const A = ({ on }: { on: boolean }) => <Panel.Tab active={on}>x</Panel.Tab>;'
    );
    expect(rules).toContain('prop:active');
  });
});

describe('rbx value-chosen targets', () => {
  it.each([
    ['Level', 'Level.Item', 'align="left"', '<Level.Left>'],
    ['Level', 'Level.Item', 'align="right"', '<Level.Right>'],
    ['Level', 'Level.Item', '', '<Level.Item>'],
    ['Media', 'Media.Item', 'align="left"', '<Media.Left>'],
    ['Media', 'Media.Item', 'align="right"', '<Media.Right>'],
    ['Media', 'Media.Item', 'align="content"', '<Media.Content>'],
    ['Navbar', 'Navbar.Segment', 'align="start"', '<Navbar.Start>'],
    ['Navbar', 'Navbar.Segment', 'align="end"', '<Navbar.End>'],
    ['Pagination', 'Pagination.Step', 'align="next"', '<Pagination.Next>'],
    [
      'Pagination',
      'Pagination.Step',
      'align="previous"',
      '<Pagination.Previous>',
    ],
  ])('%s %s with %s → %s', (root, tag, attr, expected) => {
    const { output } = migrate(
      imp(root) +
        `export const A = () => <${[tag, attr].filter(Boolean).join(' ')}>x</${tag}>;`
    );
    expect(output).toContain(expected);
  });

  it('flags a dynamic align and falls back', () => {
    const { output, rules } = migrate(
      imp('Level') +
        'export const A = ({ s }: { s: "left" }) => <Level.Item align={s}>x</Level.Item>;'
    );
    expect(rules).toContain('prop:align');
    expect(output).toContain('<Level.Item>');
  });

  it('falls back on an unrecognised literal align', () => {
    const { output } = migrate(
      imp('Media') +
        'export const A = () => <Media.Item align="nope">x</Media.Item>;'
    );
    expect(output).toContain('<Media.Content>');
  });
});

describe('rbx container collapsing', () => {
  it('folds Select.Container onto its single Select child', () => {
    const { output } = migrate(
      imp('Select') +
        'export const A = () => (<Select.Container rounded fullwidth state="focused"><Select /></Select.Container>);'
    );
    expect(output).toContain('<Select isFullwidth isRounded isFocused />');
    expect(output).not.toMatch(/<Select[^/>]*>\s*<Select/);
  });

  it('falls back to plain Bulma markup when there is not a single child', () => {
    // bestax's Select renders exactly one <select>, so a container holding
    // several cannot become one; emit rbx's own div.select wrapper instead,
    // with the modifiers as classes rather than props on an intrinsic tag.
    const { output, rules } = migrate(
      imp('Select') +
        'export const A = () => (<Select.Container rounded><Select /><Select /></Select.Container>);'
    );
    expect(output).toContain('className="select is-rounded"');
    expect(output).not.toMatch(/<div[^>]*\sisRounded/);
    expect(rules).toContain('component:Select.Container');
  });

  it('flags a prop the child already sets when folding', () => {
    const { rules } = migrate(
      imp('Select') +
        'export const A = () => (<Select.Container size="small"><Select size="medium" /></Select.Container>);'
    );
    expect(rules).toContain('prop:size');
  });

  it('folds Image.Container and squares its numeric size', () => {
    const { output } = migrate(
      imp('Image') +
        'export const A = () => (<Image.Container size={64}><Image src="/a.png" /></Image.Container>);'
    );
    expect(output).toContain('size="64x64"');
    expect(output).not.toMatch(/<Image[^/>]*>\s*<Image/);
  });

  it('passes an Image.Container ratio string through unchanged', () => {
    const { output } = migrate(
      imp('Image') +
        'export const A = () => (<Image.Container size="16by9"><Image src="/a.png" /></Image.Container>);'
    );
    expect(output).toContain('size="16by9"');
  });

  it('flags a dynamic Image.Container size', () => {
    const { rules } = migrate(
      imp('Image') +
        'export const A = ({ n }: { n: number }) => (<Image.Container size={n}><Image src="/a.png" /></Image.Container>);'
    );
    expect(rules).toContain('prop:size');
  });

  it('maps Modal.Container onto Modal', () => {
    const { output } = migrate(
      imp('Modal') +
        'export const A = () => <Modal.Container active>x</Modal.Container>;'
    );
    expect(output).toContain('<Modal active>');
  });
});

describe('rbx Title / Icon / PageLoader / Navbar / Field', () => {
  it('splits Title and SubTitle, dropping spaced on a subtitle', () => {
    const { output } = migrate(
      imp('Title') + 'export const A = () => <Title subtitle spaced>x</Title>;'
    );
    expect(output).toContain('<SubTitle>x</SubTitle>');
    expect(output).not.toContain('isSpaced');
  });

  it('keeps a dynamic spaced as isSpaced on a Title', () => {
    const { output } = migrate(
      imp('Title') +
        'export const A = ({ s }: { s: boolean }) => <Title spaced={s}>x</Title>;'
    );
    expect(output).toContain('isSpaced={s}');
  });

  it('drops a falsy spaced', () => {
    const { output } = migrate(
      imp('Title') + 'export const A = () => <Title spaced={false}>x</Title>;'
    );
    expect(output).not.toContain('spaced');
  });

  it('flags a dynamic subtitle and stays on Title', () => {
    const { output, rules } = migrate(
      imp('Title') +
        'export const A = ({ s }: { s: boolean }) => <Title subtitle={s}>x</Title>;'
    );
    expect(rules).toContain('prop:subtitle');
    expect(output).toContain('<Title>');
  });

  it('reads an icon-font child into Icon name/library/variant', () => {
    const { output } = migrate(
      imp('Icon') +
        'export const A = () => (<Icon><i className="fas fa-home" /></Icon>);'
    );
    expect(output).toContain('name="home"');
    expect(output).toContain('library="fa"');
    expect(output).toContain('variant="solid"');
  });

  it('reads an mdi icon-font child', () => {
    const { output } = migrate(
      imp('Icon') +
        'export const A = () => (<Icon><i className="mdi mdi-home" /></Icon>);'
    );
    expect(output).toContain('name="home"');
    expect(output).toContain('library="mdi"');
  });

  it('flags an Icon whose child it cannot read', () => {
    const { rules } = migrate(
      imp('Icon') + 'export const A = () => (<Icon><Thing /></Icon>);'
    );
    expect(rules).toContain('component:Icon');
  });

  it('adds isFullPage to a PageLoader', () => {
    const { output } = migrate(
      imp('PageLoader') + 'export const A = () => <PageLoader active />;'
    );
    expect(output).toContain('<Loading active isFullPage />');
  });

  it('turns a dropdown Navbar.Item into Navbar.Dropdown', () => {
    const { output } = migrate(
      imp('Navbar') +
        'export const A = () => <Navbar.Item dropdown>x</Navbar.Item>;'
    );
    expect(output).toContain('<Navbar.Dropdown>');
  });

  it('flags a dynamic Navbar.Item dropdown', () => {
    const { rules } = migrate(
      imp('Navbar') +
        'export const A = ({ d }: { d: boolean }) => <Navbar.Item dropdown={d}>x</Navbar.Item>;'
    );
    expect(rules).toContain('prop:dropdown');
  });

  it('flags Navbar.Item props bestax has no home for', () => {
    const { rules } = migrate(
      imp('Navbar') +
        'export const A = () => <Navbar.Item up tab expanded>x</Navbar.Item>;'
    );
    expect(rules).toEqual(
      expect.arrayContaining(['prop:up', 'prop:tab', 'prop:expanded'])
    );
  });

  it('flags Navbar.Dropdown boxed and the Navbar containers', () => {
    const { rules } = migrate(
      imp('Navbar') +
        'export const A = () => (<Navbar.Container><Navbar.Dropdown boxed>x</Navbar.Dropdown></Navbar.Container>);'
    );
    expect(rules).toContain('prop:boxed');
    expect(rules).toContain('component:Navbar.Container');
  });

  it('flags every part of an rbx Dropdown', () => {
    const { rules } = migrate(
      imp('Dropdown') +
        'export const A = () => (<Dropdown><Dropdown.Trigger>t</Dropdown.Trigger><Dropdown.Menu><Dropdown.Content><Dropdown.Item>i</Dropdown.Item></Dropdown.Content></Dropdown.Menu></Dropdown>);'
    );
    expect(rules).toEqual(
      expect.arrayContaining([
        'component:Dropdown',
        'component:Dropdown.Trigger',
        'component:Dropdown.Menu',
        'component:Dropdown.Content',
      ])
    );
  });

  it('folds Field multiline into grouped="multiline", replacing kind', () => {
    const { output } = migrate(
      imp('Field') +
        'export const A = () => <Field kind="group" multiline>x</Field>;'
    );
    expect(output).toContain('grouped="multiline"');
    expect((output.match(/grouped/g) ?? []).length).toBe(1);
  });

  it('drops a falsy Field multiline', () => {
    const { output } = migrate(
      imp('Field') +
        'export const A = () => <Field kind="addons" multiline={false}>x</Field>;'
    );
    expect(output).toContain('hasAddons');
    expect(output).not.toContain('multiline');
  });

  it('flags a dynamic Field multiline', () => {
    const { rules } = migrate(
      imp('Field') +
        'export const A = ({ m }: { m: boolean }) => <Field multiline={m}>x</Field>;'
    );
    expect(rules).toContain('prop:multiline');
  });

  it('turns a Breadcrumb.Item into li > a', () => {
    const { output } = migrate(
      imp('Breadcrumb') +
        'export const A = () => <Breadcrumb.Item href="/a">A</Breadcrumb.Item>;'
    );
    expect(output).toContain('<li><a href="/a">A</a></li>');
  });

  it('flags a dynamic Breadcrumb.Item active', () => {
    const { rules } = migrate(
      imp('Breadcrumb') +
        'export const A = ({ on }: { on: boolean }) => <Breadcrumb.Item active={on}>A</Breadcrumb.Item>;'
    );
    expect(rules).toContain('prop:active');
  });
});
