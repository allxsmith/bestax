#!/usr/bin/env node
// Guard for the extras usage rule. Run before and after touching it:
//
//   node eval/agent-loop/bin/test-extras-usage.mjs
//
// Exits non-zero on any failure. Every case below is a shape that either produced a wrong
// published number or would have. The import-name rule this replaced reported Toast at 0/10
// for an arm where all ten runs called `toast.success` — so the rule gets an executable
// guard rather than a careful read.
import { countUses, elementRe } from './lib/extras-usage.mjs';

// [label, source, slot, expected count]
const CASES = [
  // The bug, exactly: usage with no symbol of the component's name anywhere.
  [
    'imperative toast, no Toast symbol',
    `import { ToastContainer, toast } from '@allxsmith/bestax-bulma';
     const onCopy = () => toast.success('Copied');`,
    'Toast',
    1,
  ],
  [
    'every toast severity counts',
    `toast.success('a'); toast.danger('b'); toast.warning('c'); toast.info('d'); toast.show({});`,
    'Toast',
    5,
  ],
  ['dialog.confirm counts', `if (await dialog.confirm({})) go();`, 'Dialog', 1],

  // Mounting a container is NOT use — runs-v4/sk01 mounted DialogContainer and then built
  // its confirm step out of Modal. Counting that as a Dialog hit would credit the exact
  // substitution the category exists to catch.
  [
    'mounted container alone is not use',
    `<><ToastContainer position="top-right" /><DialogContainer /></>`,
    'Dialog',
    0,
  ],
  [
    'mounted ToastContainer alone is not use',
    `<ToastContainer position="top-right" />`,
    'Toast',
    0,
  ],

  // Element form still counts, both self-closing and with children.
  ['element with props', `<Toast message="hi" duration={0} />`, 'Toast', 1],
  ['element with children', `<Dialog isOpen>body</Dialog>`, 'Dialog', 1],
  ['newline after tag name', `<Toast\n  message="hi"\n/>`, 'Toast', 1],

  // Prefix collisions must not match: ToastContainer starts with Toast.
  [
    'no prefix collision on element',
    `<ToastContainer /><Toaster />`,
    'Toast',
    0,
  ],
  ['no prefix collision, Dialog', `<DialogContainer />`, 'Dialog', 0],

  // A slot with no imperative API uses the element rule only.
  [
    'plain component',
    `<LinkButton variant="ghost">x</LinkButton>`,
    'LinkButton',
    1,
  ],
  [
    'plain component, name in a string does not count',
    `const label = 'LinkButton';`,
    'LinkButton',
    0,
  ],

  // Spacing tolerance in the imperative form.
  ['spaced member call', `toast . success ('x')`, 'Toast', 1],

  // A different object's .success must not count.
  ['unrelated .success', `notifier.success('x')`, 'Toast', 0],
];

let failed = 0;
for (const [label, source, slot, want] of CASES) {
  const got = countUses([source], slot);
  if (got !== want) {
    console.error(`FAIL ${label}: ${slot} expected ${want}, got ${got}`);
    failed++;
  }
}

// elementRe must be usable repeatedly — a /g regex carries lastIndex between calls, which
// is a classic way to make the second run of an identical check silently return zero.
const re = elementRe('Toast');
const twice = `<Toast /> <Toast />`;
if ((twice.match(re) || []).length !== 2) {
  console.error('FAIL elementRe: expected 2 matches');
  failed++;
}
if (countUses([twice], 'Toast') !== countUses([twice], 'Toast')) {
  console.error('FAIL countUses is not idempotent — lastIndex leaked');
  failed++;
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log(`extras-usage: ${CASES.length + 2} cases pass`);
