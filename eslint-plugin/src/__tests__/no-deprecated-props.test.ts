/**
 * Pins the renames the library carries, and which of them can be fixed.
 *
 * The cases that matter are the irregular ones: `Sidebar` spells the old prop
 * `fullWidth` where five others spell it `isFullWidth`, `Tabs` deprecates two
 * spellings at once, and the retired props (`Tabs.color`, `Tags.isMultiline`)
 * have no replacement so must report without offering a fix.
 */
import rule from '../rules/no-deprecated-props.js';
import { imported, ruleTester } from './helpers.js';

ruleTester.run('no-deprecated-props', rule, {
  valid: [
    // The current spelling.
    imported('Button', '<Button isFullwidth />'),
    imported('Columns', '<Columns gap="3" gapMobile="1" />'),
    imported('Icon', '<Icon name="rocket" />'),
    // A deprecated name on a component that does not have that prop.
    imported('Box', '<Box isFullWidth />'),
    // Same tag name, not our import.
    "const Button = 'button';\nconst x = <Button isFullWidth />;\n",
    // A compound part that carries no deprecation.
    imported('Navbar', '<Navbar.Brand />'),
    // Object.prototype members are not deprecations. A plain `table[name]`
    // read resolved these and reported a deprecation with an empty note.
    imported('Icon', '<Icon valueOf="x" hasOwnProperty="y" />'),
    imported('Button', '<Button constructor="x" toString="y" />'),
    // A shadow does not have to be a plain identifier; both reviewers found
    // this hole independently.
    'const { require } = shim;\n' +
      "const { Button } = require('@allxsmith/bestax-bulma');\n" +
      'const x = <Button isFullWidth />;\n',
    // A module that declares its own `require` is not calling the CommonJS
    // one, so a call to it says nothing about our package.
    "const require = (s) => ({ Button: 'button' });\n" +
      "const { Button } = require('@allxsmith/bestax-bulma');\n" +
      'const x = <Button isFullWidth />;\n',
    // A local that shadows the import is not the library's Button.
    "import { Button } from '@allxsmith/bestax-bulma';\n" +
      "function f() { const Button = 'button'; return <Button isFullWidth />; }\n",
  ],
  invalid: [
    {
      code: imported('Button', '<Button isFullWidth />'),
      output: imported('Button', '<Button isFullwidth />'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // Sidebar's own spelling of the same rename.
      code: imported('Sidebar', '<Sidebar fullWidth />'),
      output: imported('Sidebar', '<Sidebar isFullwidth />'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // Tabs deprecates BOTH spellings in favour of the same replacement, and
      // the library picks between them in a fixed order:
      // `isFullwidth ?? isFullWidth ?? fullwidth`. Renaming whichever appears
      // first promotes it past the one that was winning, so
      // `<Tabs fullwidth isFullWidth={false} />` (not fullwidth) became
      // `<Tabs isFullwidth isFullWidth={false} />` (fullwidth). Both report,
      // neither is fixed.
      code: imported('Tabs', '<Tabs isFullWidth fullwidth />'),
      output: null,
      errors: [{ messageId: 'deprecated' }, { messageId: 'deprecated' }],
    },
    {
      // The same name written twice. Fixing one occurrence left the other
      // behind, so the output still carried a deprecated prop: report, do not
      // edit.
      code: imported('Tabs', '<Tabs isFullWidth isFullWidth />'),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // The precedence case that made it a behaviour change rather than a
      // duplicate-attribute crash.
      code: imported('Tabs', '<Tabs fullwidth isFullWidth={false} />'),
      output: null,
      errors: [{ messageId: 'deprecated' }, { messageId: 'deprecated' }],
    },
    {
      // A spread may hold the replacement, so the rename would let the
      // explicit attribute shadow a value the author meant to keep. Report
      // without a fix.
      code: imported('Button', '<Button {...rest} isFullWidth />'),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // Already carries the replacement: report, but do not fix, because
      // rewriting would collapse two props into a duplicate.
      code: imported('Button', '<Button isFullWidth isFullwidth />'),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: imported('Columns', '<Columns gapSizeTablet="2" />'),
      output: imported('Columns', '<Columns gapTablet="2" />'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // `icon` and `name` do not share a value grammar: the library keeps only
      // the LAST space-separated segment of `icon` as the glyph, and never
      // splits `name`. So a bare rename turns
      // `icon="material-symbols-outlined home"` from the `home` ligature into
      // that string rendered as text. Single-segment values would be safe, but
      // the rule cannot tell a safe one from the general case without knowing
      // both grammars, so no `icon` rename is fixed.
      code: imported('Icon', '<Icon icon="rocket" />'),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: imported(
        'Icon',
        '<Icon library="material-symbols" icon="material-symbols-outlined home" />'
      ),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // Retired outright: no CSS ever matched it, so there is nothing to
      // rename it to and no fix is offered.
      code: imported('Tabs', '<Tabs color="primary" />'),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      code: imported('Tags', '<Tags isMultiline />'),
      output: null,
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // A note naming TWO replacements parses to no single one, so no fix is
      // offered. It must still read as a deprecation, not as a prop that was
      // retired for never having worked.
      code: imported('Icon', '<Icon libraryFeatures="x" />'),
      output: null,
      errors: [
        {
          message:
            '`libraryFeatures` is deprecated on `Icon`. Use `variant` and `features` instead.',
        },
      ],
    },
    {
      // A compound part carries its own table.
      code: imported('Buttons', '<Buttons.Button isFullWidth />'),
      output: imported('Buttons', '<Buttons.Button isFullwidth />'),
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // The CommonJS shape. `.cjs` is in the preset's glob and parses as
      // sourceType commonjs, where `import` is a syntax error, so without a
      // `require` collector every rule was silent on those files.
      code:
        "const { Button } = require('@allxsmith/bestax-bulma');\n" +
        'const x = <Button isFullWidth />;\n',
      output:
        "const { Button } = require('@allxsmith/bestax-bulma');\n" +
        'const x = <Button isFullwidth />;\n',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // JSX nested two scopes below the import, which is the shape essentially
      // all real consumer code takes and which no imported() fixture reaches.
      code:
        "import { Button } from '@allxsmith/bestax-bulma';\n" +
        'export function App() {\n  const Inner = () => <Button isFullWidth />;\n  return Inner;\n}\n',
      output:
        "import { Button } from '@allxsmith/bestax-bulma';\n" +
        'export function App() {\n  const Inner = () => <Button isFullwidth />;\n  return Inner;\n}\n',
      errors: [{ messageId: 'deprecated' }],
    },
    {
      // The import BELOW the JSX. Imports hoist, so this is legal and used to
      // be silent; nothing in imported() can express it.
      code:
        'const x = <Button isFullWidth />;\n' +
        "import { Button } from '@allxsmith/bestax-bulma';\n",
      output:
        'const x = <Button isFullwidth />;\n' +
        "import { Button } from '@allxsmith/bestax-bulma';\n",
      errors: [{ messageId: 'deprecated' }],
    },
  ],
});
