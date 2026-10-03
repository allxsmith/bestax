// Globals jsdom lacks, installed before any test module loads.
//
// Under jsdom, jest resolves `react-dom/server` through its browser export
// condition, and React 18's browser server build needs `TextEncoder` as soon
// as it is evaluated. Without it, every jsdom suite that imports
// `react-dom/server` fails to load on React 18. Node's implementations fill
// the gap; the guards make this a no-op wherever the globals already exist,
// such as the node-environment SSR suites.
const { TextEncoder, TextDecoder } = require('node:util');

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}
