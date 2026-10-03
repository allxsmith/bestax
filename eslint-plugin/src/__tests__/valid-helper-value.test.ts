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

const VALID_GAPS =
  '`0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5`, `5.5`, `6`, `6.5`, `7`, `7.5`, `8`';
const SUGGEST_125 = '`1.5` or `0.5` or `2.5`';

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
    // The `BulmaOtherProps` family. These were the last helper props with no
    // tuple to check against, and the single-value one (`shadow`) is where an
    // off-by-one table entry would show up first.
    imported('Box', '<Box float="left" overflow="clipped" />'),
    imported('Box', '<Box float="right" interaction="unselectable" />'),
    imported('Box', '<Box interaction="clickable" cursor="pointer" />'),
    imported('Box', '<Box cursor="help" radius="radiusless" />'),
    imported('Box', '<Box shadow="shadowless" responsive="mobile" />'),
    imported('Box', '<Box responsive="narrow" />'),
    // `overflow` keeps `clipped` and takes the CSS keywords Bulma ships
    // helpers for; the per-axis props take the keywords alone.
    imported(
      'Box',
      '<Box overflow="scroll" overflowX="auto" overflowY="clip" />'
    ),
    // The radius sizes, which add a radius where `radiusless` removes one.
    imported('Box', '<Box radius="small" />'),
    imported('Box', '<Box radius="rounded" />'),
    // `pos` is the position helper; `relative` is still its boolean shortcut.
    imported('Box', '<Box pos="sticky" />'),
    imported('Box', '<Box pos="absolute" relative />'),
    imported('Box', '<Box aspectRatio="16by9" />'),
    imported('Box', '<Box aspectRatio="9by16" />'),
    // The gap steps, half steps included, as strings or as numbers: `Grid`
    // took its gaps as numbers before they were shared, so every gap prop
    // renders one.
    imported('Box', '<Box display="flex" gap="2" columnGap="0.5" />'),
    imported('Box', '<Box display="flex" rowGap="7.5" gap="8" />'),
    imported('Box', '<Box display="flex" gap={2} rowGap={1.5} />'),
    imported('Grid', '<Grid gap={3} columnGap={2} rowGap={1} />'),
    imported('Columns', '<Columns gap={4} />'),
    imported('Columns', '<Columns gap="2" />'),
    // `gapless` is a switch, like `overlay`.
    imported('Box', '<Box display="flex" gapless />'),
    // `columnGap` is the helper on `Theme` too, and a step renders it there.
    imported('Theme', '<Theme columnGap="2">x</Theme>'),
    // The boolean members of the same interface take no value, so they must
    // stay out of the table: a shorthand on one of them is correct usage.
    imported('Box', '<Box overlay skeleton clearfix relative fullHeight />'),
    // `radius` on `Theme` is the helper, as everywhere else, since #694 kept
    // it out of Theme's CSS-variable props.
    imported('Theme', '<Theme radius="radiusless">x</Theme>'),
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
            '`textColor="grey-lighte"` is not a value textColor accepts, so nothing renders. Did you mean `grey-light` or `grey-lighter`?',
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
      // A CSS overflow keyword Bulma ships no helper for.
      code: imported('Box', '<Box overflow="overlay" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // `clipped` is the both-axes helper only; the axis props have no class
      // for it, and `clip` is the keyword they do take.
      code: imported('Box', '<Box overflowX="clipped" />'),
      errors: [
        {
          messageId: 'invalidWithSuggestion',
          data: {
            prop: 'overflowX',
            value: 'clipped',
            suggestions: '`clip`',
          },
        },
      ],
    },
    {
      // The CSS spelling of a ratio rather than Bulma's.
      code: imported('Box', '<Box aspectRatio="16/9" />'),
      errors: [
        {
          messageId: 'invalidWithSuggestion',
          data: {
            prop: 'aspectRatio',
            value: '16/9',
            suggestions: '`16by9`',
          },
        },
      ],
    },
    {
      // A ratio Bulma does not ship, so no class exists for it. Its
      // neighbours on the scale are the suggestions.
      code: imported('Box', '<Box aspectRatio="4by1" />'),
      errors: [{ messageId: 'invalidWithSuggestion' }],
    },
    {
      // A CSS length is not a step: the gap helpers take Bulma's scale.
      code: imported('Box', '<Box gap="1rem" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A quarter step Bulma does not ship, answered with the neighbours it
      // does.
      code: imported('Box', '<Box rowGap="1.25" />'),
      errors: [
        {
          messageId: 'invalidWithSuggestion',
          data: { prop: 'rowGap', value: '1.25', suggestions: SUGGEST_125 },
        },
      ],
    },
    {
      // Columns' own `gap` is its whole-step gutter, so a report there lists
      // the whole steps, not the half steps that render nothing on it.
      code: imported('Columns', '<Columns gap="1rem" />'),
      errors: [
        {
          message:
            '`gap="1rem"` is not a value gap accepts, so nothing renders. Valid values: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`.',
        },
      ],
    },
    {
      // And a half step, which passes on every other element, is reported.
      code: imported('Columns', '<Columns gap={1.5} />'),
      errors: [
        {
          message:
            '`gap={1.5}` is not a step gap accepts, so nothing renders. Valid values: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`.',
        },
      ],
    },
    {
      // A number is a step here, so the quotes are not the fix; the step is.
      code: imported('Box', '<Box gap={9} />'),
      errors: [
        {
          message:
            '`gap={9}` is not a step gap accepts, so nothing renders. Valid values: `0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5`, `5.5`, `6`, `6.5`, `7`, `7.5`, `8`.',
        },
      ],
    },
    {
      code: imported('Grid', '<Grid columnGap={-1} />'),
      errors: [{ messageId: 'numericStepInvalid' }],
    },
    {
      // The bare shorthand is still `true`, which is no step at all.
      code: imported('Box', '<Box gap />'),
      errors: [{ messageId: 'shorthand' }],
    },
    {
      // A CSS position keyword with no Bulma helper.
      code: imported('Box', '<Box pos="inherit" />'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A near miss of `sticky`, answered with the suggestion.
      code: imported('Box', '<Box pos="stikcy" />'),
      errors: [{ messageId: 'invalidWithSuggestion' }],
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
      // Bulma's radius scale has no `medium` step.
      code: imported('Box', '<Box radius="medium" />'),
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
      // `radius` used to take only `radiusless` and got the message above.
      // It takes sizes that add a radius as well now, so the ordinary
      // remedy, listing every value, is the true one.
      code: imported('Box', '<Box radius />'),
      errors: [
        {
          message:
            '`radius` is `true` here, and radius is matched against strings, so nothing renders. Give it a value: `radiusless`, `small`, `normal`, `large`, `rounded`.',
        },
      ],
    },
    {
      // `Theme` routes its helper props through `useBulmaClasses` like any
      // other element, so a wrong spacing value reports as usual.
      code: imported('Theme', '<Theme m="9">x</Theme>'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // A string outside the tuple still sets `--bulma-radius` on `Theme`,
      // through a route the library keeps for old code and warns about
      // (#694). Worth reporting, and the ordinary message would say nothing
      // renders, which is false here. Pinned by message for that reason.
      code: imported('Theme', '<Theme radius="6px">x</Theme>'),
      errors: [
        {
          message:
            "`radius=\"6px\"` is not a value radius accepts, so on Theme it sets `--bulma-radius` instead, through a deprecated route. If a radius of `6px` is what you meant, write `bulmaVars={{ '--bulma-radius': '6px' }}`. Valid values: `radiusless`, `small`, `normal`, `large`, `rounded`.",
        },
      ],
    },
    {
      // Anything else that is not a near miss of `radiusless` takes the same
      // route in the library, a `var()` included, so it gets the same report.
      code: imported('Theme', '<Theme radius="var(--my-radius)">x</Theme>'),
      errors: [{ messageId: 'deprecatedVariable' }],
    },
    {
      // A near miss of `radiusless` is most likely that value mistyped, so it
      // gets the suggestion, as on every other element, rather than advice
      // to move the typo into `bulmaVars`. The message still says what the
      // value does on `Theme`, because the library sends it to the variable
      // too. Pinned by message for the same reason as the case above.
      code: imported('Theme', '<Theme radius="radiusles">x</Theme>'),
      errors: [
        {
          message:
            '`radius="radiusles"` is not a value radius accepts, so on Theme it sets `--bulma-radius` instead, through a deprecated route. Did you mean `radiusless`?',
        },
      ],
    },
    {
      // A length is no near miss of any value, so there is nothing to
      // suggest. What is true is the deprecated route: it sets the variable,
      // and the message lists the valid values and offers `bulmaVars` only
      // for the case where that radius was meant.
      code: imported('Theme', '<Theme radius="1rem">x</Theme>'),
      errors: [{ messageId: 'deprecatedVariable' }],
    },
    {
      // A near miss of a radius size gets the suggestion, as a near miss of
      // `radiusless` does.
      code: imported('Theme', '<Theme radius="roundd">x</Theme>'),
      errors: [{ messageId: 'deprecatedVariableWithSuggestion' }],
    },
    {
      // An empty string sets nothing on `Theme`, as in the library, so the
      // ordinary message is the true one.
      code: imported('Theme', '<Theme radius="">x</Theme>'),
      errors: [{ messageId: 'invalid' }],
    },
    {
      // The route keys on the RESOLVED element, so it follows an alias and a
      // namespace the same way the rest of the rule does, and the message
      // names the element rather than the tag as written.
      code:
        "import { Theme as T } from '@allxsmith/bestax-bulma';\n" +
        'const x = <T radius="6px">y</T>;\n',
      errors: [
        {
          messageId: 'deprecatedVariable',
          data: {
            prop: 'radius',
            value: '6px',
            element: 'Theme',
            cssVar: '--bulma-radius',
            valid: '`radiusless`, `small`, `normal`, `large`, `rounded`',
          },
        },
      ],
    },
    {
      code:
        "import * as B from '@allxsmith/bestax-bulma';\n" +
        'const x = <B.Theme radius="6px">y</B.Theme>;\n',
      errors: [{ messageId: 'deprecatedVariable' }],
    },
    {
      // Only a string reaches that route. `true` and a number go to the
      // helper on `Theme` too, where they render nothing, so the ordinary
      // messages are the true ones.
      code: imported('Theme', '<Theme radius>x</Theme>'),
      errors: [{ messageId: 'shorthand' }],
    },
    {
      code: imported('Theme', '<Theme radius={6}>x</Theme>'),
      errors: [{ messageId: 'numericInvalid' }],
    },
    {
      // `columnGap` on `Theme` used to set `--bulma-column-gap`, and a string
      // that is not a gap step still does, so the report says what renders.
      code: imported('Theme', '<Theme columnGap="1rem">x</Theme>'),
      errors: [
        {
          message:
            "`columnGap=\"1rem\"` is not a value columnGap accepts, so on Theme it sets `--bulma-column-gap` instead, through a deprecated route. If a columnGap of `1rem` is what you meant, write `bulmaVars={{ '--bulma-column-gap': '1rem' }}`. Valid values: `0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5`, `5.5`, `6`, `6.5`, `7`, `7.5`, `8`.",
        },
      ],
    },
    {
      // A number with a unit is a CSS length, not a mistyped step, so it gets
      // the `bulmaVars` remedy. Before, `8px` was two edits from `8` and was
      // answered with "did you mean `8`?", a 4rem gap.
      code: imported('Theme', '<Theme columnGap="8px">x</Theme>'),
      errors: [
        {
          messageId: 'deprecatedVariable',
          data: {
            prop: 'columnGap',
            value: '8px',
            element: 'Theme',
            cssVar: '--bulma-column-gap',
            valid: VALID_GAPS,
          },
        },
      ],
    },
    {
      code: imported('Theme', '<Theme columnGap="1em">x</Theme>'),
      errors: [{ messageId: 'deprecatedVariable' }],
    },
    {
      // A number goes to the helper on `Theme`, as for `radius`, so a number
      // that is no step gets the ordinary report.
      code: imported('Theme', '<Theme columnGap={12}>x</Theme>'),
      errors: [{ messageId: 'numericStepInvalid' }],
    },
    {
      // `gap` and `rowGap` never minted a Theme variable, so on `Theme` they
      // get the same report as anywhere else.
      code: imported('Theme', '<Theme rowGap="1rem">x</Theme>'),
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
      // `Theme` that is really `Box` gets the ordinary report, because the
      // route belongs to the element, not the name in the source.
      code:
        "import { Box as Theme } from '@allxsmith/bestax-bulma';\n" +
        'const x = <Theme radius="6px">y</Theme>;\n',
      errors: [{ messageId: 'invalid' }],
    },
  ],
});
