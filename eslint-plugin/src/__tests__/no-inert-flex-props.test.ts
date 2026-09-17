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
  ],
});
