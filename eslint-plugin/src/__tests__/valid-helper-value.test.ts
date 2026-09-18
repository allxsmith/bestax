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
    // A boolean prop's shorthand is correct usage; only value props are wrong
    // without one.
    imported('Button', '<Button isFullwidth />'),
    // `{false}` reads as switching the prop off, and the library skips a falsy
    // value either way, so reporting it would be noise.
    imported('Box', '<Box mt={false} />'),
    // A spread AFTER the attribute can overwrite it, and JSX is last-wins
    // throughout, so the written value is not necessarily what renders. The
    // shorthand "an explicit attribute wins over a spread" is only true of a
    // spread that comes first.
    imported('Box', '<Box textAlign="center" {...rest} />'),
    // Duplicate JSX attributes are legal JavaScript and React resolves them
    // last-wins, so only the winner is judged. This renders `m="4"`.
    imported('Box', '<Box m="bogus" m="4" />'),
    // The `BulmaOtherProps` family, every accepted value. These were the last
    // helper props with no tuple to check against, and the single-value ones
    // (`overflow`, `radius`, `shadow`) are where an off-by-one table entry
    // would show up first.
    imported('Box', '<Box float="left" overflow="clipped" />'),
    imported('Box', '<Box float="right" interaction="unselectable" />'),
    imported('Box', '<Box interaction="clickable" cursor="pointer" />'),
    imported('Box', '<Box cursor="help" radius="radiusless" />'),
    imported('Box', '<Box shadow="shadowless" responsive="mobile" />'),
    imported('Box', '<Box responsive="narrow" />'),
    // The boolean members of the same interface take no value, so they must
    // stay out of the table: a shorthand on one of them is correct usage.
    imported('Box', '<Box overlay skeleton clearfix relative fullHeight />'),
  ],
  invalid: [
    {
      // The CSS spelling, not Bulma's. The single most likely typo.
      code: imported('Box', '<Box textAlign="center" />'),
      errors: [{ messageId: 'invalidWithSuggestion' }],
    },
    {
      // A spread BEFORE the attribute cannot overwrite it, so this still
      // reports — the other half of the last-wins rule.
      code: imported('Box', '<Box {...rest} textAlign="center" />'),
      errors: [{ messageId: 'invalidWithSuggestion' }],
    },
    {
      // The losing duplicate is correct and the winner is not, which is the
      // permutation that must still report.
      code: imported('Box', '<Box m="4" m="bogus" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A bare attribute reaches the library as `true`, which matches none of
      // the strings the prop accepts, so nothing renders. Same argument as the
      // numeric case, one type further out.
      code: imported('Box', '<Box mt />'),
      errors: [{ messageId: 'shorthand' }],
    },
    {
      // The explicit spelling of the same value. Both reach the library as
      // `true`; only the bare one was reported.
      code: imported('Box', '<Box mt={true} />'),
      errors: [{ messageId: 'shorthand' }],
    },
    {
      // A number never matches a tuple of strings, so it renders nothing
      // however plausible it looks — and the fix is the quotes, not the value.
      code: imported('Box', '<Box m={2} />'),
      errors: [{ messageId: 'numeric' }],
    },
    {
      // `m={-1}` is a unary minus over a literal, not a negative literal, and
      // the spacing scale is exactly where someone reaches for a negative.
      code: imported('Box', '<Box m={-1} />'),
      errors: [{ messageId: 'numericInvalid' }],
    },
    {
      // Two near-misses at the same distance: pins the ranking and the " or "
      // joining, which only a multi-candidate value reaches. Both `grey-light`
      // and `grey-lighter` are one edit away.
      code: imported('Box', '<Box textColor="grey-lighte" />'),
      errors: [
        {
          message:
            '`textColor="grey-lighte"` is not a value textColor accepts, so the class is never emitted and nothing renders. Did you mean `grey-light` or `grey-lighter`?',
        },
      ],
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
    {
      // The CSS value rather than Bulma's, on the prop whose name is the CSS
      // property. `useOtherClasses` drops it and renders no float at all.
      code: imported('Box', '<Box float="center" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // `overflow` takes only the one value Bulma ships a helper for, so
      // every CSS overflow keyword renders nothing.
      code: imported('Box', '<Box overflow="scroll" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      code: imported('Box', '<Box interaction="hover" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A CSS cursor keyword. `cursor` accepts the two Bulma has classes for,
      // and those two share no class stem, which is why the library maps them
      // rather than building the class from the value.
      code: imported('Box', '<Box cursor="grab" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // Reads as "round the corners" and does the opposite of nothing: the
      // prop exists only to REMOVE the radius.
      code: imported('Box', '<Box radius="rounded" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A viewport name, which `responsive` is not: it takes the two column
      // and table modifiers, and `validViewports` is a different axis.
      code: imported('Box', '<Box responsive="tablet" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // The shape these props invite, because their one value reads like a
      // boolean. `<Box shadow />` looks like a request for a shadow and is
      // matched against strings, so nothing renders either way.
      code: imported('Box', '<Box shadow />'),
      errors: [{ messageId: 'shorthand' }],
    },
  ],
});
