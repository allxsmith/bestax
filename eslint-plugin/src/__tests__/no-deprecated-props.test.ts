/**
 * Pins the renames the library carries, and the two shapes they come in.
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
  ],
  invalid: [
    {
      code: imported('Button', '<Button isFullWidth />'),
      output: imported('Button', '<Button isFullwidth />'),
      errors: [{ messageId: 'renamed' }],
    },
    {
      // Sidebar's own spelling of the same rename.
      code: imported('Sidebar', '<Sidebar fullWidth />'),
      output: imported('Sidebar', '<Sidebar isFullwidth />'),
      errors: [{ messageId: 'renamed' }],
    },
    {
      // Both deprecated spellings on Tabs, reported and fixed independently.
      code: imported('Tabs', '<Tabs isFullWidth fullwidth />'),
      output: imported('Tabs', '<Tabs isFullwidth isFullwidth />'),
      errors: [{ messageId: 'renamed' }, { messageId: 'renamed' }],
    },
    {
      // Already carries the replacement: report, but do not fix, because
      // rewriting would collapse two props into a duplicate.
      code: imported('Button', '<Button isFullWidth isFullwidth />'),
      output: null,
      errors: [{ messageId: 'renamed' }],
    },
    {
      code: imported('Columns', '<Columns gapSizeTablet="2" />'),
      output: imported('Columns', '<Columns gapTablet="2" />'),
      errors: [{ messageId: 'renamed' }],
    },
    {
      code: imported('Icon', '<Icon icon="rocket" />'),
      output: imported('Icon', '<Icon name="rocket" />'),
      errors: [{ messageId: 'renamed' }],
    },
    {
      // Retired outright: no CSS ever matched it, so there is nothing to
      // rename it to and no fix is offered.
      code: imported('Tabs', '<Tabs color="primary" />'),
      output: null,
      errors: [{ messageId: 'retired' }],
    },
    {
      code: imported('Tags', '<Tags isMultiline />'),
      output: null,
      errors: [{ messageId: 'retired' }],
    },
    {
      // A compound part carries its own table.
      code: imported('Buttons', '<Buttons.Button isFullWidth />'),
      output: imported('Buttons', '<Buttons.Button isFullwidth />'),
      errors: [{ messageId: 'renamed' }],
    },
  ],
});
