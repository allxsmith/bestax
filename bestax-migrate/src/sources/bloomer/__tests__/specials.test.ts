/**
 * Structural-handler coverage beyond the fixture pairs: the branches a
 * fixture would have to contort itself to reach — dynamic prop values, the
 * fall-back paths, and the handlers whose whole job is to emit a TODO.
 */

import transform from '../transform.js';
import { runSpecial } from '../specials.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos, rules: todos.map(t => t.rule) };
}

/** The output without its TODO comment lines, for assertions about the JSX. */
const jsx = (s: string): string =>
  s
    .split('\n')
    .filter(l => !l.trimStart().startsWith('//'))
    .join('\n');

const imp = (names: string) => `import { ${names} } from 'bloomer';\n`;
const dyn = (names: string, jsx: string) =>
  imp(names) + `export const A = (p: Record<string, any>) => (${jsx});\n`;

describe('bloomer Button', () => {
  it('flags a dynamic isLink', () => {
    const { output, rules } = migrate(
      dyn('Button', '<Button isLink={p.x}>x</Button>')
    );
    expect(rules).toEqual(['prop:isLink']);
    expect(jsx(output)).not.toContain('isLink');
  });

  it('drops a false isLink silently', () => {
    const { output, rules } = migrate(
      dyn('Button', '<Button isLink={false}>x</Button>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Button>x</Button>');
  });

  it('does not add as="a" when the element already sets one', () => {
    const { output } = migrate(
      dyn('Button', '<Button href="/x" as="span">x</Button>')
    );
    expect(output).toContain('<Button href="/x" as="span">');
  });
});

describe('bloomer plain-element handlers', () => {
  it('honours a literal tag and flags a dynamic one', () => {
    const literal = migrate(dyn('Help', '<Help tag="div">x</Help>'));
    expect(literal.output).toContain('<div className="help">x</div>');
    const dynamic = migrate(dyn('Help', '<Help tag={p.t}>x</Help>'));
    expect(dynamic.output).toContain('<p className="help">x</p>');
    expect(dynamic.rules).toEqual(['prop:tag']);
  });

  it('flags a dynamic Help colour instead of guessing a class', () => {
    const { output, rules } = migrate(
      dyn('Help', '<Help isColor={p.c}>x</Help>')
    );
    expect(output).toContain('<p className="help">x</p>');
    expect(rules).toEqual(['prop:isColor']);
  });

  it('merges an existing className into the plain element', () => {
    const { output } = migrate(
      dyn('Label', '<Label isSize="small" className="mine">x</Label>')
    );
    expect(output).toContain(
      '<label className="label is-small mine">x</label>'
    );
  });

  it('gives render its own hint when the element becomes plain HTML', () => {
    const { output, rules } = migrate(
      dyn('Help', '<Help render={p.r}>x</Help>')
    );
    expect(rules).toEqual(['prop:render']);
    expect(output).not.toContain('render=');
  });

  it('drops helper props from a plain element with a TODO', () => {
    const { output, rules } = migrate(
      dyn(
        'PanelTab',
        '<PanelTab isActive={p.on} isHidden="mobile" isPulled="left">x</PanelTab>'
      )
    );
    expect(rules).toEqual(['prop:isActive', 'plain-element']);
    expect(output).toContain('<a>x</a>');
  });

  it('flags a dynamic BreadcrumbItem active state', () => {
    const { output, rules } = migrate(
      dyn(
        'BreadcrumbItem',
        '<BreadcrumbItem isActive={p.on}><a>x</a></BreadcrumbItem>'
      )
    );
    expect(rules).toEqual(['prop:isActive']);
    expect(output).toContain('<li><a>x</a></li>');
  });

  it('renders HeroVideo without the transparent modifier', () => {
    const { output } = migrate(
      dyn('HeroVideo', '<HeroVideo><video /></HeroVideo>')
    );
    expect(output).toContain('<div className="hero-video"><video /></div>');
  });
});

describe('bloomer Icon', () => {
  it('flags a dynamic isAlign', () => {
    const { output, rules } = migrate(
      dyn('Icon', '<Icon className="fas fa-home" isAlign={p.a} />')
    );
    expect(rules).toEqual(['prop:isAlign']);
    expect(output).toContain(
      '<Icon name="home" library="fa" variant="solid" />'
    );
  });

  it('keeps children it was given and says nothing', () => {
    const { output, rules } = migrate(dyn('Icon', '<Icon><svg /></Icon>'));
    expect(rules).toEqual([]);
    expect(output).toContain('<Icon><svg /></Icon>');
  });

  it('reads a PanelIcon child that the parser cannot name and keeps it', () => {
    const { output, rules } = migrate(
      dyn('PanelIcon', '<PanelIcon><svg /></PanelIcon>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Panel.Icon><svg /></Panel.Icon>');
  });

  it('flags an empty PanelIcon', () => {
    const { rules } = migrate(dyn('PanelIcon', '<PanelIcon />'));
    expect(rules).toEqual(['component:PanelIcon']);
  });

  it('flags a PanelIcon child whose classes are dynamic', () => {
    const { output, rules } = migrate(
      dyn('PanelIcon', '<PanelIcon><i className={p.c} /></PanelIcon>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Panel.Icon><i className={p.c} /></Panel.Icon>');
  });
});

describe('bloomer Control hasIcons', () => {
  it('drops a false value', () => {
    const { output, rules } = migrate(
      dyn('Control', '<Control hasIcons={false}>x</Control>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Control>x</Control>');
  });

  it('flags an unknown side, a dynamic entry and a dynamic value', () => {
    expect(
      migrate(dyn('Control', '<Control hasIcons="top">x</Control>')).rules
    ).toEqual(['prop:hasIcons']);
    expect(
      migrate(dyn('Control', '<Control hasIcons={["left", p.s]}>x</Control>'))
        .rules
    ).toEqual(['prop:hasIcons']);
    const dynamic = migrate(
      dyn('Control', '<Control hasIcons={p.s}>x</Control>')
    );
    expect(dynamic.rules).toEqual(['prop:hasIcons']);
    expect(dynamic.output).toContain('<Control>x</Control>');
  });
});

describe('bloomer Image', () => {
  it('flags an unknown or dynamic ratio', () => {
    expect(
      migrate(dyn('Image', '<Image isRatio="5:4" src="a" />')).rules
    ).toEqual(['prop:isRatio']);
    const dynamic = migrate(dyn('Image', '<Image isRatio={p.r} src="a" />'));
    expect(dynamic.rules).toEqual(['prop:isRatio']);
    expect(dynamic.output).toContain('<Image src="a" />');
  });
});

describe('bloomer navigation handlers', () => {
  it('flags a dynamic hasDropdown and a hoverable plain item', () => {
    const { output, rules } = migrate(
      dyn(
        'NavbarItem',
        '<NavbarItem hasDropdown={p.d} isHoverable>x</NavbarItem>'
      )
    );
    expect(rules).toEqual(['prop:hasDropdown', 'prop:isHoverable']);
    expect(output).toContain('<Navbar.Item>x</Navbar.Item>');
  });

  it('drops the tag of a dropdown container', () => {
    const { output, rules } = migrate(
      dyn('NavbarItem', '<NavbarItem hasDropdown tag="span">x</NavbarItem>')
    );
    expect(rules).toEqual(['prop:tag']);
    expect(output).toContain('<Navbar.Dropdown>x</Navbar.Dropdown>');
  });

  it('lets href win over tag where the target already renders an anchor', () => {
    const menu = migrate(
      dyn('MenuLink', '<MenuLink href="/x" tag="span">x</MenuLink>')
    );
    expect(menu.output).toContain('<Menu.Item href="/x">x</Menu.Item>');
    const item = migrate(
      dyn('NavbarItem', '<NavbarItem href="/x" tag="div">x</NavbarItem>')
    );
    expect(item.output).toContain('<Navbar.Item href="/x">x</Navbar.Item>');
    const block = migrate(
      dyn('PanelBlock', '<PanelBlock href="/x" tag="div">x</PanelBlock>')
    );
    expect(block.output).toContain('<Panel.Block href="/x">x</Panel.Block>');
    const level = migrate(
      dyn('LevelItem', '<LevelItem href="/x" tag="p">x</LevelItem>')
    );
    expect(level.output).toContain(
      '<Level.Item href="/x" as="a">x</Level.Item>'
    );
  });

  it('keeps a NavbarDropdown without isBoxed as the menu', () => {
    const { output, rules } = migrate(
      dyn('NavbarDropdown', '<NavbarDropdown>x</NavbarDropdown>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Navbar.DropdownMenu>x</Navbar.DropdownMenu>');
  });

  it('renames a non-left Pagination alignment and flags a dynamic one', () => {
    const right = migrate(
      dyn('Pagination', '<Pagination isAlign="right">x</Pagination>')
    );
    expect(right.output).toContain('<Pagination align="right">');
    const dynamic = migrate(
      dyn('Pagination', '<Pagination isAlign={p.a}>x</Pagination>')
    );
    expect(dynamic.rules).toEqual(['prop:isAlign']);
    expect(dynamic.output).toContain('<Pagination align={p.a}>');
  });

  it('flags a dynamic PageControl direction and drops isPrevious', () => {
    const { output, rules } = migrate(
      dyn('PageControl', '<PageControl isNext={p.n} isPrevious>x</PageControl>')
    );
    expect(rules).toEqual(['prop:isNext']);
    expect(output).toContain('<Pagination.Previous>x</Pagination.Previous>');
  });

  it('keeps a Page it cannot fold as a plain list item', () => {
    const { output, rules } = migrate(
      dyn('Page', '<Page tag="span"><b>1</b></Page>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<span><b>1</b></span>');
  });

  it('keeps a dropdown href and drops the tag beside it', () => {
    const { output, rules } = migrate(
      dyn('Dropdown', '<Dropdown href="/x" tag="span">x</Dropdown>')
    );
    expect(rules).toEqual(['component:Dropdown']);
    expect(output).toContain('<Dropdown href="/x">x</Dropdown>');
  });
});

describe('runSpecial', () => {
  it('refuses a handler name the mapping could only have misspelled', () => {
    expect(() =>
      runSpecial('no-such-handler', {} as never, {} as never, {})
    ).toThrow(/unknown special handler/);
  });
});
