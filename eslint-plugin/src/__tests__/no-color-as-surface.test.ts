/**
 * Pins where this opt-in rule must stay silent, which is most of what it does.
 *
 * Two silences were found the hard way, by linting the library's own docs:
 * an element with a real `is-<color>` modifier (`<Button color="primary">` is
 * a filled button), and an element that pairs `color` with an explicit
 * background (`<Box backgroundColor="light" color="dark">` is a deliberate,
 * correct pairing — surface from one prop, text from the other).
 */
import rule from '../rules/no-color-as-surface.js';
import { imported, ruleTester } from './helpers.js';

ruleTester.run('no-color-as-surface', rule, {
  valid: [
    // Elements whose `color` really is a filled variant.
    imported('Button', '<Button color="primary" />'),
    imported('Hero', '<Hero color="info" />'),
    imported('Notification', '<Notification color="warning" />'),
    imported('Progress', '<Progress color="danger" />'),
    // The unambiguous props, on an element that takes the alias.
    imported('Box', '<Box textColor="primary" bgColor="light" />'),
    // A deliberate pairing: the background is explicit, so `color` is plainly
    // the text half and there is nothing ambiguous left to report. This is
    // real usage lifted from the library's own margin-and-padding guide.
    imported('Box', '<Box backgroundColor="light" color="dark" p="2" />'),
    imported('Box', '<Box bgColor="primary" color="white" />'),
    // A compound part whose color is a real modifier, unlike its root.
    imported('Buttons', '<Buttons.Button color="primary" />'),
    // Not our Box.
    "const Box = 'div';\nconst x = <Box color='primary' />;\n",
    // No color prop at all.
    imported('Box', '<Box mt="4" />'),
  ],
  invalid: [
    {
      code: imported('Box', '<Box color="primary" />'),
      output: imported('Box', '<Box textColor="primary" />'),
      errors: [{ messageId: 'ambiguous' }],
    },
    {
      code: imported('Card', '<Card color="info" />'),
      output: imported('Card', '<Card textColor="info" />'),
      errors: [{ messageId: 'ambiguous' }],
    },
    {
      // The root of a compound whose parts differ from it.
      code: imported('Buttons', '<Buttons color="link" />'),
      output: imported('Buttons', '<Buttons textColor="link" />'),
      errors: [{ messageId: 'ambiguous' }],
    },
    {
      // textColor already wins, so color does nothing — removing it is the
      // author's call, so this reports without a fix.
      code: imported('Box', '<Box color="primary" textColor="info" />'),
      output: null,
      errors: [{ messageId: 'redundant' }],
    },
    {
      // An unreadable value still gets the rename; only the message text
      // needs the literal.
      code: imported('Box', '<Box color={tone} />'),
      output: imported('Box', '<Box textColor={tone} />'),
      errors: [{ messageId: 'ambiguous' }],
    },
  ],
});
