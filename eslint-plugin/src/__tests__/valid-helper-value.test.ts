/**
 * Pins the defect this rule exists for: `useBulmaClasses` drops an
 * unrecognised value silently, so a typo renders nothing and says nothing.
 *
 * The invalid cases are values that look plausible and are wrong; the valid
 * cases are the ones a naive "is it in the tuple" check would wrongly report —
 * the documented extras, and anything the rule cannot read.
 */
import rule from '../rules/valid-helper-value.js';
import { imported, ruleTester } from './helpers.js';

// RuleTester emits its own describe/it, so it runs at the top level.
ruleTester.run('valid-helper-value', rule, {
  valid: [
    // Ordinary correct usage across the prop families.
    imported('Box', '<Box mt="4" textColor="primary" />'),
    imported('Box', '<Box textSize="3" textAlign="centered" />'),
    imported('Box', '<Box display="flex" justifyContent="center" />'),
    imported('Box', '<Box m="auto" p="0" />'),
    // The documented extras: `none` for display, the CSS-wide keywords
    // for the colour props, and the scheme colours for bgColor.
    imported('Box', '<Box display="none" />'),
    imported('Box', '<Box textColor="inherit" bgColor="current" />'),
    imported('Box', '<Box bgColor="scheme-main-bis" />'),
    // Responsive bands carry the same value sets as their base prop.
    imported('Box', '<Box textSizeMobile="7" displayTabletOnly="grid" />'),
    // `color` is component-specific and deliberately not checked here:
    // Button really does accept `ghost`.
    imported('Button', '<Button color="ghost" />'),
    // Values the rule cannot read are left alone rather than guessed at.
    imported('Box', '<Box mt={spacing} />'),
    imported('Box', '<Box textColor={cond ? "primary" : "info"} />'),
    // Not our element, even though the prop and value look like ours.
    "const Box = 'div';\nconst x = <Box textColor='nonsense' />;\n",
    // Not a helper prop at all.
    imported('Box', '<Box className="whatever" id="nope" />'),
  ],
  invalid: [
    {
      // The CSS spelling, not Bulma's. The single most likely typo.
      code: imported('Box', '<Box textAlign="center" />'),
      errors: [{ messageId: 'invalidWithSuggestion' }],
    },
    {
      // Off the end of the 1-7 scale.
      code: imported('Box', '<Box textSize="8" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // Not a Bulma colour name.
      code: imported('Box', '<Box textColor="blue" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // Spacing scale is 0-6 plus auto, not rem values.
      code: imported('Box', '<Box mt="1rem" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A single-quasi template literal is readable, so it is judged.
      code: imported('Box', '<Box textColor={`blue`} />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // Aliased import still resolves to the library element.
      code:
        "import { Box as Surface } from '@allxsmith/bestax-bulma';\n" +
        'const x = <Surface textWeight="heavy" />;\n',
      errors: [{ messageId: 'invalid' }],
    },
    {
      // Namespace import, and a compound part.
      code:
        "import * as B from '@allxsmith/bestax-bulma';\n" +
        'const x = <B.Navbar.Brand justifyContent="middle" />;\n',
      errors: [{ messageId: 'invalid' }],
    },
    {
      // Two bad props on one element report twice.
      code: imported('Box', '<Box mt="huge" textSize="0" />'),
      errors: [{ messageId: 'invalid' }, { messageId: 'invalid' }],
    },
  ],
});
