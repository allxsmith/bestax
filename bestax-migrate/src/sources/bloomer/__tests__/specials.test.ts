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
    // The spread goes first so the Bulma class the element exists for wins,
    // and the possible className inside the spread is named.
    expect(help.rules).toEqual(['plain-element']);
    expect(help.output).toContain(
      '<p {...p.rest} className="help is-danger">x</p>'
    );
    // …while every other attribute keeps its place, and so its precedence.
    const ordered = migrate(
      dyn('Help', '<Help id="first" {...p.rest} title="t">x</Help>')
    );
    expect(ordered.output).toContain(
      '<p id="first" {...p.rest} className="help" title="t">x</p>'
    );
    const page = migrate(
      "import { Page, PageLink } from 'bloomer';\nexport const A = (p: Record<string, any>) => <Page {...p.li}><PageLink>1</PageLink></Page>;\n"
    );
    expect(page.output).toContain(
      '<Pagination.Link {...p.li}>1</Pagination.Link>'
    );
    expect(page.rules).toEqual(['component:Page']);
  });

  it('keeps several wrapper spreads in source order when folding', () => {
    const page = migrate(
      "import { Page, PageLink } from 'bloomer';\nexport const A = (p: Record<string, any>) => <Page {...p.first} {...p.second}><PageLink>1</PageLink></Page>;\n"
    );
    expect(page.output).toContain(
      '<Pagination.Link {...p.first} {...p.second}>1</Pagination.Link>'
    );
    const menu = migrate(
      'import { MenuLink } from \'bloomer\';\nexport const A = (p: Record<string, any>) => <li {...p.first} {...p.second} id="x"><MenuLink href="/">h</MenuLink></li>;\n'
    );
    expect(menu.output).toContain(
      '<Menu.Item {...p.first} {...p.second} href="/" id="x">h</Menu.Item>'
    );
    expect(menu.rules).toEqual(['component:MenuLink']);
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
    // bloomer's MenuLink rendered its tag whatever href said.
    expect(menu.output).toContain(
      '<Menu.Item href="/x" as="span">x</Menu.Item>'
    );
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

  it('treats an empty or false href the way bloomer did — no anchor', () => {
    const empty = migrate(dyn('Button', '<Button href="">x</Button>'));
    expect(empty.rules).toEqual([]);
    expect(empty.output).toContain('<Button>x</Button>');
    const off = migrate(
      dyn(
        'DropdownItem',
        '<DropdownItem href={false} tag="span">x</DropdownItem>'
      )
    );
    expect(jsx(off.output)).toContain(
      '<Dropdown.Item as="span">x</Dropdown.Item>'
    );
    const bare = migrate(
      dyn('NavbarItem', '<NavbarItem href={0}>x</NavbarItem>')
    );
    expect(jsx(bare.output)).toContain('<Navbar.Item as="div">x</Navbar.Item>');
  });

  it('merges helpers on a helperless target into className, dropping false ones', () => {
    const { output, rules } = migrate(
      dyn(
        'PageControl',
        '<PageControl href="#" isMarginless={false} isHidden={false} isPulled="right">p</PageControl>'
      )
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      '<Pagination.Previous href="#" className="is-pulled-right">p</Pagination.Previous>'
    );
  });

  it('flags a dynamic href instead of guessing the anchor', () => {
    const { output, rules } = migrate(
      dyn('Button', '<Button href={p.url} tag="span">x</Button>')
    );
    expect(rules).toEqual(['prop:href', 'prop:tag']);
    expect(jsx(output)).toContain('<Button href={p.url} tag="span">x</Button>');
    const level = migrate(
      dyn('LevelItem', '<LevelItem href={p.url}>x</LevelItem>')
    );
    expect(level.rules).toEqual(['prop:href']);
    expect(level.output).toContain('<Level.Item href={p.url}>x</Level.Item>');
  });

  it('moves an href off the Navbar.Dropdown container with a hint', () => {
    const { output, rules } = migrate(
      dyn('NavbarItem', '<NavbarItem hasDropdown href="/x">x</NavbarItem>')
    );
    expect(rules).toEqual(['prop:href']);
    expect(output).toContain('<Navbar.Dropdown>x</Navbar.Dropdown>');
  });

  it('keeps a PageControl tag as bloomer did, beside its href', () => {
    const { output } = migrate(
      dyn(
        'PageControl',
        '<PageControl isNext tag="span" href="/n">n</PageControl>'
      )
    );
    // bestax's Pagination.Next has no `as`, so the tag stays, flagged.
    expect(jsx(output)).toContain(
      '<Pagination.Next tag="span" href="/n">n</Pagination.Next>'
    );
  });

  it('names the MenuLink attributes that change element under Menu.Item', () => {
    const link = migrate(
      dyn(
        'MenuLink',
        '<MenuLink id="x" style={p.s} className="c" href="/">h</MenuLink>'
      )
    );
    expect(link.rules).toEqual(['component:MenuLink']);
    expect(link.output).toContain(
      '<Menu.Item id="x" style={p.s} className="c" href="/">h</Menu.Item>'
    );
    const li = migrate(
      dyn(
        'MenuLink',
        '<li className="mine" id="y"><MenuLink href="/">h</MenuLink></li>'
      )
    );
    expect(li.rules).toEqual(['component:MenuLink']);
    expect(li.output).toContain(
      '<Menu.Item href="/" className="mine" id="y">h</Menu.Item>'
    );
  });

  it('folds the literal <li> bloomer wrote around a MenuLink', () => {
    const one = migrate(
      dyn(
        'MenuList, MenuLink',
        '<MenuList><li className="x"><MenuLink isActive href="/">Home</MenuLink></li></MenuList>'
      )
    );
    expect(one.rules).toEqual(['component:MenuLink']);
    expect(one.output).toContain(
      '<Menu.List><Menu.Item active href="/" className="x">Home</Menu.Item></Menu.List>'
    );
    const shared = migrate(
      dyn('MenuLink', '<li><MenuLink>Home</MenuLink><span>x</span></li>')
    );
    expect(shared.rules).toEqual(['component:MenuLink']);
    expect(shared.output).toContain(
      '<li><Menu.Item>Home</Menu.Item><span>x</span></li>'
    );
  });

  it('folds the literal <ul> bloomer wrote inside a Breadcrumb', () => {
    const plain = migrate(
      dyn(
        'Breadcrumb, BreadcrumbItem',
        '<Breadcrumb><ul><BreadcrumbItem isActive><a>Here</a></BreadcrumbItem></ul></Breadcrumb>'
      )
    );
    expect(plain.rules).toEqual([]);
    expect(plain.output).toContain(
      '<Breadcrumb><li className="is-active"><a>Here</a></li></Breadcrumb>'
    );
    const attrs = migrate(
      dyn(
        'Breadcrumb',
        '<Breadcrumb><ul id="crumbs"><li>x</li></ul></Breadcrumb>'
      )
    );
    expect(attrs.rules).toEqual(['component:Breadcrumb']);
    expect(attrs.output).toContain('<Breadcrumb><li>x</li></Breadcrumb>');
  });

  it('warns when a Page wraps a link it cannot fold', () => {
    const { output, rules } = migrate(
      dyn(
        'Page, PageLink',
        '<Page key="k">{p.on ? <PageLink isCurrent>1</PageLink> : <PageLink>1</PageLink>}</Page>'
      )
    );
    expect(rules).toEqual(['component:Page']);
    expect(output).toContain('<li key="k">');
    expect(output).toContain('<Pagination.Link active>1</Pagination.Link>');
  });

  it('honours a literal tag on Label', () => {
    const { output, rules } = migrate(
      dyn('Label', '<Label tag="span" isSize="small">x</Label>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<span className="label is-small">x</span>');
  });

  it('keeps a name bloomer forwarded rather than writing a second one', () => {
    const { output, rules } = migrate(
      dyn('Icon', '<Icon className="fas fa-home" name="glyph" />')
    );
    expect(rules).toEqual(['prop:className']);
    expect(jsx(output)).toContain(
      '<Icon name="glyph" library="fa" variant="solid" />'
    );
  });

  it('names the children a className-driven Icon removes', () => {
    const { output, rules } = migrate(
      dyn('Icon', '<Icon className="fas fa-home"><span>fallback</span></Icon>')
    );
    expect(rules).toEqual(['component:Icon']);
    expect(output).toContain(
      '<Icon name="home" library="fa" variant="solid" />'
    );
  });

  it('refuses to write two size props onto a Hero', () => {
    const { output, rules } = migrate(
      dyn('Hero', '<Hero isFullHeight isSize="large">x</Hero>')
    );
    expect(rules).toEqual(['prop:isSize']);
    expect(jsx(output)).toContain(
      '<Hero isSize="large" size="fullheight">x</Hero>'
    );
  });

  it('turns helpers on HTML-attribute-only targets into classes, or a hint', () => {
    const { output, rules } = migrate(
      dyn(
        'PageControl',
        '<PageControl href="#" isPulled="right" isMarginless isHidden="mobile" className="x">p</PageControl>'
      )
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      '<Pagination.Previous href="#" className="x is-pulled-right m-0 is-hidden-mobile">p</Pagination.Previous>'
    );
    const dynamic = migrate(
      dyn(
        'PageControl',
        '<PageControl isHidden={p.h} isDisplay={["flex"]}>p</PageControl>'
      )
    );
    expect(dynamic.rules).toEqual(['prop:isHidden', 'prop:isDisplay']);
    expect(dynamic.output).toContain(
      '<Pagination.Previous>p</Pagination.Previous>'
    );
  });

  it('turns a modifier bestax has no prop for into its Bulma class', () => {
    const hero = migrate(
      dyn('Hero', '<Hero isBold isHalfHeight className="mine">x</Hero>')
    );
    expect(hero.rules).toEqual([]);
    expect(hero.output).toContain(
      '<Hero className="mine is-bold is-halfheight">x</Hero>'
    );
    const media = migrate(dyn('Media', '<Media isSize="large">x</Media>'));
    expect(media.output).toContain('<Media className="is-large">x</Media>');
    const off = migrate(dyn('Hero', '<Hero isBold={false}>x</Hero>'));
    expect(off.rules).toEqual([]);
    expect(off.output).toContain('<Hero>x</Hero>');
    const dyn1 = migrate(dyn('Hero', '<Hero isBold={p.b}>x</Hero>'));
    expect(dyn1.rules).toEqual(['prop:isBold']);
    const dynClass = migrate(
      dyn('Hero', '<Hero isBold className={p.c}>x</Hero>')
    );
    expect(dynClass.rules).toEqual(['prop:isBold']);
    expect(dynClass.output).toContain('<Hero className={p.c}>x</Hero>');
    const input = migrate(dyn('Input', '<Input isActive isSize="small" />'));
    expect(input.output).toContain(
      '<InputBase size="small" className="is-active" />'
    );
    const menu = migrate(
      dyn('NavbarDropdown', '<NavbarDropdown isBoxed>x</NavbarDropdown>')
    );
    expect(menu.rules).toEqual([]);
    expect(menu.output).toContain(
      '<Navbar.DropdownMenu className="is-boxed">x</Navbar.DropdownMenu>'
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

  it('treats a falsy PanelBlock href as no anchor', () => {
    const { output, rules } = migrate(
      dyn('PanelBlock', '<PanelBlock href="" isActive>x</PanelBlock>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<div className="panel-block is-active">x</div>');
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
    expect(anchor.rules).toEqual([]);
    expect(anchor.output).toContain(
      '<Panel.Block href="/x" className="is-wrapped">x</Panel.Block>'
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

  it('keeps a Dropdown tag beside its href, as bloomer did', () => {
    const { output, rules } = migrate(
      dyn('Dropdown', '<Dropdown href="/x" tag="span">x</Dropdown>')
    );
    // bestax's Dropdown has no `as`, so the tag stays, flagged.
    expect(rules).toEqual(['component:Dropdown', 'prop:tag']);
    expect(jsx(output)).toContain(
      '<Dropdown href="/x" tag="span">x</Dropdown>'
    );
  });
});

describe('runSpecial', () => {
  it('refuses a handler name the mapping could only have misspelled', () => {
    expect(() =>
      runSpecial('no-such-handler', {} as never, {} as never, {})
    ).toThrow(/unknown special handler/);
  });
});
