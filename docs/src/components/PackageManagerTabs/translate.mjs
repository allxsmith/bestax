/**
 * The package-manager vocabulary, in one place.
 *
 * Docs commands are authored in **pnpm's** verb vocabulary — `add`, `add -D`,
 * `install`, `remove`, `create`, `dlx`, `run` — and this module derives the npm,
 * yarn and bun equivalents. Authoring in pnpm terms (rather than npm's) is what
 * lets the pnpm rendering be a pure prefix: `renderCommand(cmd, 'pnpm')` is
 * always `pnpm ${cmd}`.
 *
 * That identity is load-bearing. `docs/scripts/flatten-llms-tabs.mjs` collapses
 * `<PackageManagerTabs>` to a single pnpm block in the published LLM artifacts,
 * and it imports this module rather than reimplementing the rule — so what an
 * agent copies out of llms.txt is byte-identical to what a reader sees on the
 * default tab.
 *
 * `.mjs`, not `.js`: `docs/package.json` has no `"type": "module"`, so node
 * would load a `.js` file as CommonJS and `node --test` could not import it.
 * Webpack resolves the explicit extension natively.
 *
 * A `command` may hold several lines separated by `;`. A segment whose first
 * token is a known verb gets translated; anything else (`cd my-app`, a `#`
 * comment) is emitted byte-identically in all four tabs.
 */

/** Tab order. pnpm is first, and therefore the default. */
export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'];

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
