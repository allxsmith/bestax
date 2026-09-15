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
      // Tabs deprecates BOTH spellings in favour of the same replacement, so
      // fixing both would emit `<Tabs isFullwidth isFullwidth />` — a
      // duplicate JSX attribute, which is TS17001 and does not compile. Both
      // report; only the first is rewritten, and a second pass then reports
      // the leftover against the now-present replacement and leaves it too.
      code: imported('Tabs', '<Tabs isFullWidth fullwidth />'),
      output: imported('Tabs', '<Tabs isFullwidth fullwidth />'),
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
      code: imported('Icon', '<Icon icon="rocket" />'),
      output: imported('Icon', '<Icon name="rocket" />'),
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
  ],
});
