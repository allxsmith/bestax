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

  it('carries a spread through a plain-element rewrite and a fold', () => {
    const help = migrate(
      dyn('Help', '<Help isColor="danger" {...p.rest}>x</Help>')
    );
    expect(help.output).toContain(
      '<p className="help is-danger" {...p.rest}>x</p>'
    );
    const page = migrate(
      "import { Page, PageLink } from 'bloomer';\nexport const A = (p: Record<string, any>) => <Page {...p.li}><PageLink>1</PageLink></Page>;\n"
    );
    expect(page.output).toContain(
      '<Pagination.Link {...p.li}>1</Pagination.Link>'
    );
  });

  it('names the Page attributes a fold moves onto the link', () => {
    const { output, rules } = migrate(
      dyn(
        'Page, PageLink',
        '<Page className="mine" id="p1" key="k"><PageLink>1</PageLink></Page>'
      )
    );
    expect(rules).toEqual(['component:Page']);
    expect(output).toContain(
      '<Pagination.Link className="mine" id="p1" key="k">1</Pagination.Link>'
    );
    const bare = migrate(
      dyn('Page, PageLink', '<Page key="k"><PageLink>1</PageLink></Page>')
    );
    expect(bare.rules).toEqual([]);
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

  it('keeps children bloomer never rendered, and says so', () => {
    const { output, rules } = migrate(dyn('Icon', '<Icon><svg /></Icon>'));
    expect(rules).toEqual(['component:Icon']);
    expect(output).toContain('<Icon><svg /></Icon>');
  });

  it('reads PanelIcon classes from its own className, like Icon', () => {
    const fa6 = migrate(
      dyn('PanelIcon', '<PanelIcon className="fas fa-book" />')
    );
    expect(fa6.rules).toEqual([]);
    expect(fa6.output).toContain(
      '<Panel.Icon name="book" library="fa" variant="solid" />'
    );
    const fa4 = migrate(
      dyn('PanelIcon', '<PanelIcon className="fa fa-book" />')
    );
    expect(fa4.rules).toEqual(['component:PanelIcon']);
    expect(fa4.output).toContain(
      '<Panel.Icon><i className="fa fa-book" aria-hidden="true" /></Panel.Icon>'
    );
    const dynamic = migrate(dyn('PanelIcon', '<PanelIcon className={p.c} />'));
    expect(dynamic.rules).toEqual(['component:PanelIcon']);
    expect(dynamic.output).toContain(
      '<Panel.Icon><i className={p.c} aria-hidden="true" /></Panel.Icon>'
    );
  });

  it('gives an empty Icon an inert child so it still compiles', () => {
    const { output, rules } = migrate(dyn('PanelIcon', '<PanelIcon />'));
    expect(rules).toEqual(['component:PanelIcon']);
    expect(output).toContain(
      '<Panel.Icon><i aria-hidden="true" /></Panel.Icon>'
    );
  });

  it('does not crash on a valueless or boolean className', () => {
    const bare = migrate(dyn('Icon', '<Icon className />'));
    expect(bare.rules).toEqual(['prop:className']);
    expect(bare.output).toContain('<Icon><i aria-hidden="true" /></Icon>');
    const bool = migrate(
      dyn('Icon', '<Icon className={true} isSize="small" />')
    );
    expect(bool.rules).toEqual(['prop:className']);
    expect(jsx(bool.output)).not.toContain('className');
  });

  it('carries icon modifiers as features and keeps an app class on the glyph', () => {
    const one = migrate(
      dyn('Icon', '<Icon className="fas fa-spinner fa-spin" />')
    );
    expect(one.output).toContain(
      '<Icon name="spinner" library="fa" variant="solid" features="fa-spin" />'
    );
    const many = migrate(
      dyn('Icon', '<Icon className="fa-solid fa-lg fa-cog fa-fw" />')
    );
    expect(many.output).toContain('features={["fa-lg", "fa-fw"]}');
    const mdi = migrate(
      dyn('Icon', '<Icon className="mdi mdi-24px mdi-account" />')
    );
    expect(mdi.output).toContain(
      '<Icon name="account" library="mdi" features="mdi-24px" />'
    );
    const own = migrate(
      dyn('Icon', '<Icon className="fas fa-home brand-glyph" />')
    );
    expect(own.rules).toEqual(['component:Icon']);
    expect(own.output).toContain(
      '<i className="fas fa-home brand-glyph" aria-hidden="true" />'
    );
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
    expect(output).toContain('<Navbar.Item as="div">x</Navbar.Item>');
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

  it('keeps a bare NavbarItem and DropdownItem a <div>, as bloomer rendered them', () => {
    const item = migrate(dyn('NavbarItem', '<NavbarItem>x</NavbarItem>'));
    expect(item.output).toContain('<Navbar.Item as="div">x</Navbar.Item>');
    const tagged = migrate(
      dyn('NavbarItem', '<NavbarItem tag="span">x</NavbarItem>')
    );
    expect(tagged.output).toContain('<Navbar.Item as="span">x</Navbar.Item>');
    const drop = migrate(
      dyn('DropdownItem', '<DropdownItem isActive>x</DropdownItem>')
    );
    expect(drop.output).toContain(
      '<Dropdown.Item active as="div">x</Dropdown.Item>'
    );
    const link = migrate(
      dyn('DropdownItem', '<DropdownItem href="/x" tag="span">x</DropdownItem>')
    );
    expect(link.output).toContain('<Dropdown.Item href="/x">x</Dropdown.Item>');
  });

  it('keeps a PanelBlock without href as the plain block bloomer rendered', () => {
    const plain = migrate(
      dyn('PanelBlock', '<PanelBlock isActive isWrapped>x</PanelBlock>')
    );
    expect(plain.rules).toEqual([]);
    expect(plain.output).toContain(
      '<div className="panel-block is-active is-wrapped">x</div>'
    );
    const label = migrate(
      dyn(
        'PanelBlock',
        '<PanelBlock tag="label" isActive={p.on}>x</PanelBlock>'
      )
    );
    expect(label.rules).toEqual(['prop:isActive']);
    expect(label.output).toContain('<label className="panel-block">x</label>');
    const anchor = migrate(
      dyn('PanelBlock', '<PanelBlock href="/x" isWrapped>x</PanelBlock>')
    );
    expect(anchor.rules).toEqual(['prop:isWrapped']);
    expect(anchor.output).toContain(
      '<Panel.Block href="/x" isWrapped>x</Panel.Block>'
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

  it('drops a Page tag the folded child cannot honour, flagging a non-li one', () => {
    const li = migrate(
      dyn('Page, PageLink', '<Page tag="li"><PageLink>1</PageLink></Page>')
    );
    expect(li.rules).toEqual([]);
    expect(li.output).toContain('<Pagination.Link>1</Pagination.Link>');
    const span = migrate(
      dyn('Page, PageLink', '<Page tag="span"><PageLink>1</PageLink></Page>')
    );
    expect(span.rules).toEqual(['prop:tag']);
    expect(span.output).toContain('<Pagination.Link>1</Pagination.Link>');
  });

  it('keeps Subtitle an <h2> unless told otherwise', () => {
    const bare = migrate(dyn('Subtitle', '<Subtitle isSize={4}>x</Subtitle>'));
    expect(bare.output).toContain('<SubTitle size={4} as="h2">x</SubTitle>');
    const tagged = migrate(dyn('Subtitle', '<Subtitle tag="p">x</Subtitle>'));
    expect(tagged.output).toContain('<SubTitle as="p">x</SubTitle>');
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
