/**
 * bestax's props follow `as`: an element takes the attributes of whatever tag
 * `as` names, and several components narrow `as` to a literal union. Every
 * source library here is looser, so a prop-for-prop rename can emit an `href`
 * beside a `<span>`, or an `as` the component does not offer — code the
 * user's project cannot compile (#662).
 *
 * The kitchen-sink e2e cannot guard this. It typechecks only the fixture
 * files that are TODO-free, and the whole point of the fix is that these
 * shapes now carry a TODO. So this migrates the colliding shapes directly and
 * hands the OUTPUT to tsc — TODOs and all. A regression here is a compile
 * error in this suite rather than in a migrated app.
 *
 * Keep the inputs realistic per source: bloomer's `tag`, rbx's `as`,
 * react-bulma-components' `renderAs` are three spellings of the same prop,
 * and all three reach the same pass.
 */

import { bloomer } from '../src/sources/bloomer/index.js';
import { rbx } from '../src/sources/rbx/index.js';
import { reactBulmaComponents } from '../src/sources/react-bulma-components/index.js';
import { runTransform } from '../src/runner.js';
import type { MigrationSource } from '../src/types.js';
import { typecheckTsxFiles } from './support/typecheck-tsx.js';

/** [imported names, JSX] — one migrated module each. */
type Case = [string, string];

const BLOOMER: Case[] = [
  // The switching components: bloomer read `props.href ? 'a' : tag`.
  ['Button', '<Button href="/x" tag="span">x</Button>'],
  ['Button', '<Button href={p.url} tag="span">x</Button>'],
  ['Button', '<Button href={p.url}>x</Button>'],
  ['Button', '<Button href="/x">x</Button>'],
  ['Button', '<Button href="" tag="span">x</Button>'],
  ['LevelItem', '<LevelItem href="/x" tag="p">x</LevelItem>'],
  ['LevelItem', '<LevelItem href={p.url} tag="p">x</LevelItem>'],
  ['NavbarItem', '<NavbarItem href="/x" tag="div">x</NavbarItem>'],
  ['NavbarItem', '<NavbarItem href={p.url} tag="div">x</NavbarItem>'],
  ['PanelBlock', '<PanelBlock href="/x" tag="div">x</PanelBlock>'],
  // MenuLink and NavbarLink rendered their `tag` whatever `href` said.
  ['MenuLink', '<MenuLink href="/x" tag="span">x</MenuLink>'],
  ['MenuLink', '<MenuLink href={p.url} tag="span">x</MenuLink>'],
  ['NavbarLink', '<NavbarLink href="/x" tag="span">x</NavbarLink>'],
  // A component that becomes plain markup, carrying an href it never used.
  ['TabLink', '<TabLink href="#one" tag="span">One</TabLink>'],
  ['TabLink', '<TabLink href="#one">One</TabLink>'],
  // `tag` values outside the union the bestax target narrows `as` to.
  ['Image', '<Image tag="span" src="/a.png" />'],
  ['Footer', '<Footer tag="section">x</Footer>'],
  ['Media', '<Media tag="section">x</Media>'],
  ['MediaLeft', '<MediaLeft tag="span">x</MediaLeft>'],
  ['Control', '<Control tag="span">x</Control>'],
  ['Title', '<Title tag="span">x</Title>'],
  ['Title', '<Title tag="h2">x</Title>'],
  ['LevelItem', '<LevelItem tag="span">x</LevelItem>'],
  // Targets that declare no `href` at any `as`.
  ['DropdownItem', '<DropdownItem href="/x" tag="span">x</DropdownItem>'],
  ['Delete', '<Delete href="/x" />'],
  ['CardHeaderIcon', '<CardHeaderIcon href="/x">x</CardHeaderIcon>'],
  ['CardFooterItem', '<CardFooterItem href="/x">x</CardFooterItem>'],
  // An `href` beside an `as` the target cannot render. The `as` goes, so the
  // element is the component's own -- and the href has to be judged against
  // that, not against the attribute the pass is about to delete.
  ['Title', '<Title tag="a" href="/x">x</Title>'],
  ['MediaLeft', '<MediaLeft tag="a" href="/x">x</MediaLeft>'],
  ['Control', '<Control tag="a" href="/x">x</Control>'],
  // Targets reached through a special rather than a `target:` line.
  ['Tab', '<Tab href="/x">One</Tab>'],
  ['CardImage', '<CardImage href="/x">x</CardImage>'],
  ['PageControl', '<PageControl href="/p">p</PageControl>'],
  // Statically falsy: bloomer took the `tag` branch for these, so the anchor
  // must not be forced. `literalValueOf` calls them expressions.
  ['Button', '<Button href={null} tag="span">x</Button>'],
  ['Button', '<Button href={undefined} tag="span">x</Button>'],
];

const RBX: Case[] = [
  ['Button', '<Button as="span" href="/x">x</Button>'],
  ['Button', '<Button href="/x">x</Button>'],
  ['Button', '<Button as="a" href="/x">x</Button>'],
  ['Menu', '<Menu.List.Item as="span" href="/x">x</Menu.List.Item>'],
  ['Navbar', '<Navbar.Item as="div" href="/x">x</Navbar.Item>'],
  ['Navbar', '<Navbar.Link as="span" href="/x">x</Navbar.Link>'],
  ['Level', '<Level.Item as="p" href="/x">x</Level.Item>'],
  ['Level', '<Level.Item as="span">x</Level.Item>'],
  ['Image', '<Image as="span" src="/a.png" />'],
  ['Control', '<Control as="span">x</Control>'],
  ['Footer', '<Footer as="section">x</Footer>'],
  ['Media', '<Media as="section">x</Media>'],
  // Targets that declare no `href` at any `as` — `as="a"` does not rescue it.
  ['Dropdown', '<Dropdown.Item as="a" href="/x">x</Dropdown.Item>'],
  ['Delete', '<Delete href="/x" />'],
  ['Card', '<Card.Header.Icon href="/x">x</Card.Header.Icon>'],
  ['Card', '<Card.Footer.Item href="/x">x</Card.Footer.Item>'],
  ['Title', '<Title as="a" href="/x">x</Title>'],
  ['Media', '<Media as="section" href="/x">x</Media>'],
  ['Footer', '<Footer as="a" href="/x">x</Footer>'],
  ['Tab', '<Tab href="/x">One</Tab>'],
  ['Media', '<Media.Item align="left" href="/x">x</Media.Item>'],
  // The link attributes beside the href are as invalid as it is, and just as
  // invalid without it -- so the check cannot be conditional on one.
  [
    'Navbar',
    '<Navbar.Link as="span" href="/x" target="_blank">x</Navbar.Link>',
  ],
  ['Navbar', '<Navbar.Link as="span" target="_blank">x</Navbar.Link>'],
  ['Button', '<Button as="span" download>x</Button>'],
  // Kept where the element really takes it: `referrerPolicy` on an <img>.
  ['Button', '<Button as="img" referrerPolicy="no-referrer" src="/a.png" />'],
  [
    'Menu',
    '<Menu.List.Item as="span" href="/x" rel="noopener">x</Menu.List.Item>',
  ],
  ['Button', '<Button as="area" href="/x">x</Button>'],
];

const RBC: Case[] = [
  ['Button', '<Button renderAs="span" href="/x">x</Button>'],
  ['Button', '<Button href="/x">x</Button>'],
  ['Menu', '<Menu.List.Item renderAs="span" href="/x">x</Menu.List.Item>'],
  ['Navbar', '<Navbar.Item renderAs="div" href="/x">x</Navbar.Item>'],
  ['Level', '<Level.Item renderAs="span">x</Level.Item>'],
  ['Footer', '<Footer renderAs="section">x</Footer>'],
  ['Media', '<Media renderAs="section">x</Media>'],
  // Targets that declare no `href` at any `as`.
  ['Dropdown', '<Dropdown.Item href="/x">x</Dropdown.Item>'],
  ['Card', '<Card.Header.Icon href="/x">x</Card.Header.Icon>'],
  ['Card', '<Card.Footer.Item href="/x">x</Card.Footer.Item>'],
  ['Media', '<Media renderAs="section" href="/x">x</Media>'],
];

const SOURCES: Array<[MigrationSource, string, Case[]]> = [
  [bloomer, 'bloomer', BLOOMER],
  [rbx, 'rbx', RBX],
  [reactBulmaComponents, 'react-bulma-components', RBC],
];

/** Output with the `// TODO(bestax-migrate): …` lines removed. */
function codeOf(output: string): string {
  return output
    .split('\n')
    .filter(l => !l.trim().startsWith('// TODO(bestax-migrate)'))
    .join('\n');
}

/** Migrate one case into a standalone module. */
function migrate(
  source: MigrationSource,
  pkg: string,
  [names, jsx]: Case
): string {
  const input =
    `import { ${names} } from '${pkg}';\n` +
    `export const A = (p: Record<string, string>) => (${jsx});\n`;
  const { output } = runTransform(source.transform, 'case.tsx', input, {
    add: () => {},
  });
  return output ?? input;
}

describe('migrated output typechecks where `as` and `href` collide', () => {
  it('compiles every colliding shape, across all three sources', () => {
    const files: Record<string, string> = {};
    for (const [source, pkg, cases] of SOURCES) {
      cases.forEach((testCase, i) => {
        files[`${pkg}-${i}`] = migrate(source, pkg, testCase);
      });
    }
    const { status, diagnostics } = typecheckTsxFiles(files, 'polymorphic');
    // A failure names `<pkg>-<n>.tsx`; `n` is the index into the list above.
    expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
  });

  it('keeps what the target does accept, and every live expression', () => {
    // Two shapes that cannot join the compile matrix above, because something
    // else in the output still does not typecheck — but the part this pass
    // owns has to be right, and both were wrong.
    //
    // `Panel.Block` takes a bare `href` and declares no `as` at all, so the
    // `as="span"` here is an earlier pass's TODO marker, not the element. A
    // rule that reads it deletes the prop that compiles and keeps the one
    // that does not.
    const panel = migrate(rbx, 'rbx', [
      'Panel',
      '<Panel.Block as="span" href="/x">x</Panel.Block>',
    ]);
    expect(panel).toContain('href="/x"');

    // bloomer took no `as`, so one in the source is the author's own
    // component riding along — and on a target generic over `as` it takes the
    // `href` with it. Rewriting it to `as="a"` swapped a router link for a
    // plain anchor and orphaned the import, with nothing said.
    const link = migrate(bloomer, 'bloomer', [
      'Button',
      '<Button href="/x" as={p.Link}>x</Button>',
    ]);
    expect(link).toContain('as={p.Link}');

    // `Level.Item` declares `href` at every `as`, so a bare one compiles --
    // and renders a <div> that drops the attribute. tsc cannot see that, so
    // it is asserted on the output instead.
    const bare = codeOf(
      migrate(rbx, 'rbx', ['Level', '<Level.Item href="/x">x</Level.Item>'])
    );
    expect(bare).not.toContain('href');
    const anchored = migrate(rbx, 'rbx', [
      'Level',
      '<Level.Item as="a" href="/x">x</Level.Item>',
    ]);
    expect(anchored).toContain('href="/x"');
  });

  it('tells the reader the remedy that works on this target', () => {
    // "drop the `as`" is a link only where the bare element is the anchor. On
    // `Button` it gives a <button> that does not compile, and on `Level.Item`
    // a <div> that compiles and quietly is not a link -- the same sentence
    // that was wrong in the rbx prop-map, written into the user's file.
    const button = migrate(rbx, 'rbx', [
      'Button',
      '<Button as="span" href="/x">x</Button>',
    ]);
    expect(button).toContain('set `as="a"`');
    expect(button).not.toContain('drop the `as` to make this a link');

    const level = migrate(rbx, 'rbx', [
      'Level',
      '<Level.Item as="p" href="/x">x</Level.Item>',
    ]);
    expect(level).toContain('set `as="a"`');

    // Where the bare element really is an anchor, dropping it is the advice.
    const menu = migrate(rbx, 'rbx', [
      'Menu',
      '<Menu.List.Item as="span" href="/x">x</Menu.List.Item>',
    ]);
    expect(menu).toContain('drop the `as`');
  });

  it('keeps a quoted value on one line, so the comment stays a comment', () => {
    // A `//` comment ends at the first newline. JSX allows one inside an
    // attribute value, and these messages quote the value they removed, so a
    // multiline expression used to put bare code on the next line and leave
    // the file unparseable -- a worse failure than the one being fixed.
    const out = migrate(bloomer, 'bloomer', [
      'MenuLink',
      '<MenuLink tag="span" href={\n  p.getUrl()\n}>x</MenuLink>',
    ]);
    const todo = out
      .split('\n')
      .filter(l => l.includes('TODO(bestax-migrate)'));
    expect(todo).toHaveLength(1);
    expect(todo[0]).toContain('p.getUrl()');
    // Nothing after the comment line may be a stray fragment of it.
    expect(codeOf(out)).not.toContain('getUrl');
  });

  it('gives every source the same advice for the same target', () => {
    // bloomer's navbar handler said the useful thing for its own source and
    // the other two got the generic line for the same target -- the sibling
    // drift `bestax-migrate/CLAUDE.md` warns about. Keyed by target now.
    const hint = 'put it on the `<Navbar.Link>` inside';
    expect(
      migrate(bloomer, 'bloomer', [
        'NavbarItem',
        '<NavbarItem hasDropdown href="/x">x</NavbarItem>',
      ])
    ).toContain(hint);
    expect(
      migrate(rbx, 'rbx', [
        'Navbar',
        '<Navbar.Item dropdown href="/x">x</Navbar.Item>',
      ])
    ).toContain(hint);
  });

  it('never writes an href beside an `as` that is not an anchor', () => {
    // The compile check above is the real guard, but it only proves the pair
    // is gone from shapes bestax types strictly. State the rule directly so
    // a future loosening of those types cannot quietly re-admit it.
    const offenders: string[] = [];
    for (const [source, pkg, cases] of SOURCES) {
      for (const testCase of cases) {
        const output = migrate(source, pkg, testCase);
        // `a` is the one these sources meant, but React types `href` onto
        // `area`, `link` and `base` too, and a target generic over `as` accepts
        // them -- so those are not offenders.
        const pairs =
          /<[A-Z][^>]*\sas="(?!(?:a|area|link|base)")[a-z0-9]+"[^>]*>/g;
        for (const tag of output.match(pairs) ?? []) {
          if (/\shref[=}]/.test(tag)) offenders.push(`${pkg}: ${tag}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
