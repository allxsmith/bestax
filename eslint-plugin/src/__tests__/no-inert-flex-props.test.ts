/**
 * Pins the gate in useFlexboxClasses: the five container props emit no class
 * unless a `display*` prop is a flex value, so `<Box justifyContent="center">`
 * silently does nothing.
 *
 * The valid cases guard the two ways this rule could go wrong — flagging the
 * flex CHILD props, which always emit, and flagging an element whose display
 * it simply cannot see.
 */
import rule from '../rules/no-inert-flex-props.js';
import { imported, ruleTester } from './helpers.js';

ruleTester.run('no-inert-flex-props', rule, {
  valid: [
    // A flex display is present, so the container props apply.
    imported('Box', '<Box display="flex" justifyContent="center" />'),
    imported('Box', '<Box display="inline-flex" alignItems="center" />'),
    // A responsive band supplies the flex display.
    imported('Box', '<Box displayTablet="flex" flexDirection="column" />'),
    // Child props always emit; their container is somewhere else.
    imported('Box', '<Box flexGrow="1" flexShrink="0" alignSelf="center" />'),
    // No container props at all.
    imported('Box', '<Box display="block" mt="4" />'),
    // The display value is not readable, so it could be flex.
    imported('Box', '<Box display={mode} justifyContent="center" />'),
    // A spread could carry the display prop.
    imported('Box', '<Box {...rest} justifyContent="center" />'),
    // Not our element.
    "const Box = 'div';\nconst x = <Box justifyContent='center' />;\n",
    // A flex container by its own CSS needs no display prop.
    imported('Stack', '<Stack alignItems="center" justifyContent="end" />'),
    imported('Group', '<Group justifyContent="space-between" />'),
    imported('Center', '<Center alignItems="flex-start" />'),
    imported(
      'Flex',
      '<Flex flexDirection="column" flexWrap="wrap" alignContent="center" />'
    ),
    // A flex display keeps it one, inline or not.
    imported('Center', '<Center display="inline-flex" alignItems="end" />'),
    imported('Stack', '<Stack display="flex" alignItems="center" />'),
    // A viewport's display leaves it a flex container at the other widths.
    imported('Group', '<Group displayMobile="block" alignItems="baseline" />'),
    // A display it cannot read could be a flex one.
    imported('Flex', '<Flex display={mode} flexDirection="column" />'),
    // So could one a spread carries.
    imported(
      'Stack',
      '<Stack {...rest} display="block" alignItems="center" />'
    ),
    // A flex display at some width, beside a `display` that isn't.
    imported(
      'Stack',
      '<Stack display="block" displayTablet="flex" alignItems="center" />'
    ),
    // The library ignores `display` once a viewport display is set, so this
    // may render no display class at all.
    imported(
      'Group',
      '<Group display="grid" displayMobile="block" justifyContent="center" />'
    ),
    // `viewport` limits `display` to one width.
    imported(
      'Stack',
      '<Stack display="block" viewport="mobile" alignItems="center" />'
    ),
    // A value outside the library's displays emits no display class, and
    // `none` hides the element rather than making it a block.
    imported('Center', '<Center display={true} alignItems="center" />'),
    imported('Center', '<Center display="" alignItems="center" />'),
    imported('Flex', '<Flex display="table" flexDirection="column" />'),
    imported('Flex', '<Flex display="none" flexDirection="column" />'),
    // The miss accepted: every viewport says block, which would take
    // modelling the visibility hook to see.
    imported(
      'Stack',
      '<Stack displayMobile="block" displayTablet="block" displayDesktop="block" displayWidescreen="block" displayFullhd="block" alignItems="center" />'
    ),
  ],
  invalid: [
    {
      // No display prop whatsoever.
      code: imported('Box', '<Box justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      // A `true` display is not an unreadable one: bare or explicit, it is
      // knowably not `flex`, so it must not buy the element silence. The
      // display itself is reported separately by `valid-helper-value`.
      code: imported('Box', '<Box display justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      code: imported('Box', '<Box display={true} justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      // Neither can a number or `{false}` be `flex`, so neither may buy
      // silence. Readable-but-wrong is not the same as unreadable.
      code: imported('Box', '<Box display={2} justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      code: imported('Box', '<Box display={false} justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      // A display that is present but not flex.
      code: imported('Box', '<Box display="block" alignItems="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      // Every container prop on the element reports.
      code: imported(
        'Box',
        '<Box flexDirection="row" flexWrap="wrap" alignContent="center" />'
      ),
      errors: [
        { messageId: 'inert' },
        { messageId: 'inert' },
        { messageId: 'inert' },
      ],
    },
    {
      // A grid display is not a flex display.
      code: imported('Box', '<Box display="grid" justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      // Child props are fine; only the container prop reports.
      code: imported('Box', '<Box flexGrow="1" justifyContent="center" />'),
      errors: [{ messageId: 'inert' }],
    },
    {
      // A flex container by its own CSS stops being one when `display` makes
      // it something else: Bulma's `is-block` is `!important`.
      code: imported('Stack', '<Stack display="block" alignItems="center" />'),
      errors: [
        {
          message:
            '`alignItems` does nothing here: `Stack` is a flex container by its own styles, but its `display` prop makes it something else. Drop `display`, or drop `alignItems`.',
        },
      ],
    },
    {
      // Any of the library's non-flex displays, and every container prop.
      code: imported(
        'Group',
        '<Group display="grid" justifyContent="center" flexWrap="nowrap" />'
      ),
      errors: [{ messageId: 'notFlex' }, { messageId: 'notFlex' }],
    },
    {
      code: imported(
        'Flex',
        "<Flex display={'inline'} flexDirection='column' />"
      ),
      errors: [{ messageId: 'notFlex' }],
    },
  ],
});
