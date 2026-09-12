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
];

const SOURCES: Array<[MigrationSource, string, Case[]]> = [
  [bloomer, 'bloomer', BLOOMER],
  [rbx, 'rbx', RBX],
  [reactBulmaComponents, 'react-bulma-components', RBC],
];

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

  it('never writes an href beside an `as` that is not an anchor', () => {
    // The compile check above is the real guard, but it only proves the pair
    // is gone from shapes bestax types strictly. State the rule directly so
    // a future loosening of those types cannot quietly re-admit it.
    const offenders: string[] = [];
    for (const [source, pkg, cases] of SOURCES) {
      for (const testCase of cases) {
        const output = migrate(source, pkg, testCase);
        const pairs = /<[A-Z][^>]*\sas="(?!a")[a-z0-9]+"[^>]*>/g;
        for (const tag of output.match(pairs) ?? []) {
          if (/\shref[=}]/.test(tag)) offenders.push(`${pkg}: ${tag}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
