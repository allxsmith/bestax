/**
 * The package-manager vocabulary, in one place.
 *
 * Docs commands are authored in **pnpm's** verb vocabulary — `add`, `add -D`,
 * `install`, `remove`, `create`, `dlx`, `run` — and this module derives the npm,
 * yarn and bun equivalents. Authoring in pnpm terms (rather than npm's) is what
 * lets the pnpm rendering be a pure prefix: `renderCommand(cmd, 'pnpm')` is
 * always `pnpm ${cmd}`.
 *
 * That identity is load-bearing, and it runs in both directions. Pages author the
 * pnpm form as a real code fence inside `<PackageManagerTabs>`; the component
 * strips the `pnpm ` prefix line-wise to recover the authored command, then
 * derives the other three from it. Because the fence is ordinary markdown, it is
 * also exactly what survives into llms.txt — so what an agent copies out of the
 * artifact is byte-identical to what a reader sees on the default tab, without
 * anything having to keep the two in sync.
 *
 * `.mjs`, not `.js`: `docs/package.json` has no `"type": "module"`, so node
 * would load a `.js` file as CommonJS and `node --test` could not import it.
 * Webpack resolves the explicit extension natively.
 *
 * A `command` may hold several lines separated by `;`. A segment whose first
 * token is a known verb gets translated; anything else (`cd my-app`, a `#`
 * comment) is a passthrough — emitted identically across all four tabs.
 *
 * Every segment is whitespace-normalized first (trimmed, runs of spaces
 * collapsed), so authoring can pad around the `;` separators freely. Passthrough
 * means "the same on every tab", not "byte-identical to the source" — don't rely
 * on internal alignment surviving.
 */

/** Tab order. */
export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'];

/**
 * The tab selected when the reader has no stored preference.
 *
 * Named rather than taken as `PACKAGE_MANAGERS[0]` so tab *order* and the
 * *default* can move independently — and because this value is not merely
 * cosmetic: pages author the pnpm form, and that fence is what survives into
 * llms.txt, so the default tab is what makes the page a reader sees agree with
 * the artifact an agent reads. Changing it desyncs the two.
 */
export const DEFAULT_PACKAGE_MANAGER = 'pnpm';

/**
 * The `groupId` of the Docusaurus `<Tabs>` group, and the localStorage key it
 * derives — `tabsUtils.js` builds the key as `docusaurus.tab.${groupId}`.
 *
 * Both live here because two separate surfaces have to agree on them: the tab
 * group in this directory's index.js, and the homepage hero switcher in
 * src/pages/index.js, which reads the slot directly via `useStorageSlot` to
 * stay in sync with the docs. Hardcoding the strings in both places means a
 * rename silently degrades to "hero and docs no longer share a choice", with
 * nothing failing.
 */
export const TAB_GROUP_ID = 'package-manager';
export const TAB_STORAGE_KEY = `docusaurus.tab.${TAB_GROUP_ID}`;

/** Verbs we know how to translate. Anything else is a passthrough line. */
const VERBS = new Set(['add', 'install', 'remove', 'create', 'dlx', 'run']);

/**
 * Split a `command` into one segment per rendered line. Blank segments are
 * dropped so a trailing `;` or padded separators can't emit an empty line.
 */
export function splitSegments(command) {
  return String(command)
    .split(';')
    .map(segment => segment.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

/**
 * Translate one segment for one package manager.
 *
 * Three rules go beyond swapping the prefix:
 * - `dlx` is a whole-prefix replacement (`npx`, `bunx`), not a verb swap.
 * - bun spells the dev-dependency flag `-d`, not `-D`.
 * - npm needs `--` to pass flags through a `create` scaffolder; yarn and bun
 *   forward arguments directly and would hand the `--` to the scaffolder.
 */
export function translateSegment(segment, manager) {
  const tokens = segment.split(' ');
  const [verb, ...rest] = tokens;

  if (!VERBS.has(verb)) return segment;
  if (manager === 'pnpm') return `pnpm ${segment}`;

  const join = parts => parts.filter(Boolean).join(' ');
  const withoutDoubleDash = () => rest.filter(token => token !== '--');
  const bunFlags = () => rest.map(token => (token === '-D' ? '-d' : token));

  switch (manager) {
    case 'npm':
      switch (verb) {
        case 'add':
          return join(['npm', 'install', ...rest]);
        case 'remove':
          return join(['npm', 'uninstall', ...rest]);
        case 'dlx':
          return join(['npx', ...rest]);
        default:
          // install / create / run keep npm's own verb, and `create` keeps `--`.
          return join(['npm', verb, ...rest]);
      }
    case 'yarn':
      switch (verb) {
        case 'install':
          // Bare `yarn` is the idiomatic install; with flags it needs the verb.
          return rest.length ? join(['yarn', 'install', ...rest]) : 'yarn';
        case 'create':
          return join(['yarn', 'create', ...withoutDoubleDash()]);
        case 'run':
          // `yarn dev`, not `yarn run dev`.
          return join(['yarn', ...rest]);
        case 'dlx':
          // Yarn Berry. Yarn Classic has no `dlx`.
          return join(['yarn', 'dlx', ...rest]);
        default:
          return join(['yarn', verb, ...rest]);
      }
    case 'bun':
      switch (verb) {
        case 'add':
          return join(['bun', 'add', ...bunFlags()]);
        case 'create':
          return join(['bun', 'create', ...withoutDoubleDash()]);
        case 'dlx':
          return join(['bunx', ...rest]);
        default:
          return join(['bun', verb, ...rest]);
      }
    default:
      throw new Error(`Unknown package manager: ${manager}`);
  }
}

/** Render a whole `command` — every segment, one per line — for one manager. */
export function renderCommand(command, manager) {
  return splitSegments(command)
    .map(segment => translateSegment(segment, manager))
    .join('\n');
}

/**
 * Authoring mistakes that render identically on all four tabs, and so would
 * otherwise ship unnoticed. Surfaced as a dev-only warning by the component.
 */
export function lintCommand(command) {
  const warnings = [];
  for (const segment of splitSegments(command)) {
    const verb = segment.split(' ')[0];
    if (PACKAGE_MANAGERS.includes(verb) || verb === 'npx' || verb === 'bunx') {
      warnings.push(
        `"${segment}" already names a package manager — author the pnpm verb alone, e.g. "add foo" not "pnpm add foo".`
      );
    }
  }
  return warnings;
}
