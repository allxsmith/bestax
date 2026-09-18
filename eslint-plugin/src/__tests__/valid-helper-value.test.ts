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
    // `radius` on `Theme` is the CSS variable `--bulma-radius` at runtime and
    // the helper union in its type, and those disagree (#694). `6px` is how a
    // JSX consumer sets that variable, and `radiusless` is what this rule
    // would have called the fix while rendering
    // `--bulma-radius: radiusless`, which does nothing. Neither is
    // reportable, so the pair is skipped: both cases here, not just the first.
    imported('Theme', '<Theme radius="6px">x</Theme>'),
    imported('Theme', '<Theme radius="radiusless">x</Theme>'),
    // The exception keys on the RESOLVED element, so it follows an alias and
    // a namespace the same way the rest of the rule does. A tag-name check
    // would get these two wrong in opposite directions.
    'import { Theme as T } from \'@allxsmith/bestax-bulma\';\nconst x = <T radius="6px">y</T>;\n',
    'import * as B from \'@allxsmith/bestax-bulma\';\nconst x = <B.Theme radius="6px">y</B.Theme>;\n',
    // Not our element at all, whatever it is called.
    "const Theme = 'div';\nconst x = <Theme radius='6px'>y</Theme>;\n",
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
      // matched against strings, so nothing renders either way — and the
      // generic remedy would send the author to `shadowless`, which is the
      // opposite of what they asked for. Pinned by message, not messageId,
      // because the wording is the whole point of the separate case.
      code: imported('Box', '<Box shadow />'),
      errors: [
        {
          message:
            '`shadow` is `true` here, and shadow is matched against strings, so nothing renders. It is also not a switch: its only value `shadowless` REMOVES the shadow. Omit `shadow` to keep the shadow, or write `shadow="shadowless"` to remove it.',
        },
      ],
    },
    {
      // Same shape, and the reason the message names the thing rather than
      // the prop: "removes the border radius" reads, "removes the radius"
      // does not say which.
      code: imported('Box', '<Box radius />'),
      errors: [{ messageId: 'shorthandRemoves' }],
    },
    {
      // The exception is per element and per prop, not a blanket pass on
      // `Theme`: its other helper props still route through
      // `useBulmaClasses`, so a wrong spacing value still reports.
      code: imported('Theme', '<Theme m="9">x</Theme>'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // And `shadow` on `Theme` is still the helper prop, because
      // `--bulma-shadow` is deliberately kept out of Theme's variable map.
      code: imported('Theme', '<Theme shadow="none">x</Theme>'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // The other direction of the resolution point above: a tag spelled
      // `Theme` that is really `Box` gets no exception, because the exception
      // is about the element, not the name in the source.
      code:
        "import { Box as Theme } from '@allxsmith/bestax-bulma';\n" +
        'const x = <Theme radius="6px">y</Theme>;\n',
      errors: [{ messageId: 'invalid' }],
    },
  ],
});
