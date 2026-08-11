/**
 * extras-usage.mjs — did a build actually USE a component, not merely import a name?
 *
 * The bug this exists to prevent, in full, because it invalidated a published headline:
 *
 *   `metrics.json`'s `bestax_import_list` records named imports. The ordinary way to use
 *   Toast is `import { ToastContainer, toast }` and then `toast.success('…')` — there is no
 *   symbol called `Toast` anywhere in that build. Scoring the slot by `includes('Toast')`
 *   therefore reported 0/10 for the skills arm and 6/10 for the MCP arm of runs-v2, when
 *   call-site counting shows both arms at 10/10, with 1 to 8 calls per run. The reported
 *   "Toast is the one place the MCP beats the skills" was an artifact of the counter, and
 *   a guidance change was written to close a gap that did not exist.
 *
 * So a slot is satisfied by EVIDENCE OF USE in the builder's own source, under either of the
 * component's two shapes:
 *
 *   - the component element   `<Toast …>`   (also matches `<Toast/>`)
 *   - the imperative API      `toast.success(…)`, `dialog.confirm(…)`
 *
 * Mounting a root container and never calling it is NOT use — `runs-v4/sk01` imported
 * `DialogContainer`, mounted it, then hand-built its confirm step out of `Modal`. Counting
 * that as a `Dialog` hit would credit the build for a component it declined to use, which is
 * the exact substitution rubric-v2 §9 exists to catch. Container names are therefore
 * deliberately absent from the patterns below.
 *
 * `bestax_import_list` remains the fallback when `app-src/` is unavailable (it is gitignored,
 * so a fresh clone has metrics but no sources). Callers get `basis: 'imports'` and must say
 * so — a fallback number is not comparable to a call-site number for aliased components.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Components whose normal usage imports no symbol of the same name. Each entry lists the
 * imperative call shapes that count as use. Extend this when a component gains an API of
 * this kind — a missing entry silently undercounts, which is how the original bug read.
 */
export const IMPERATIVE_APIS = {
  Toast: /\btoast\s*\.\s*(success|danger|warning|info|show)\s*\(/g,
  Dialog: /\bdialog\s*\.\s*(confirm|alert|show)\s*\(/g,
};

const SOURCE_RE = /\.(tsx|ts|jsx|js)$/;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory()
      ? walk(join(dir, e.name))
      : SOURCE_RE.test(e.name)
        ? [join(dir, e.name)]
        : []
  );
}

/** JSX element use of `name`: `<Name>`, `<Name/>`, `<Name\n  prop=…`. Not `<NameFoo>`. */
export function elementRe(name) {
  return new RegExp(`<${name}(?=[\\s/>])`, 'g');
}

/**
 * Count call sites for one slot in a builder's sources.
 * @returns {number} total element uses plus imperative calls.
 */
export function countUses(sources, slot) {
  let n = 0;
  const patterns = [elementRe(slot)];
  if (IMPERATIVE_APIS[slot]) patterns.push(IMPERATIVE_APIS[slot]);
  for (const text of sources) {
    for (const re of patterns) {
      re.lastIndex = 0;
      n += (text.match(re) || []).length;
    }
  }
  return n;
}

/**
 * Score every slot for one run directory.
 *
 * @param {string} runDir            e.g. runs-v2/sk03
 * @param {string[]} slots           slot names from the completeness addendum
 * @returns {{basis:'sources'|'imports', counts:Record<string,number>, used:Set<string>}}
 */
export function scoreRun(runDir, slots) {
  const files = walk(join(runDir, 'app-src', 'src'));
  if (files.length) {
    const sources = files.map(f => readFileSync(f, 'utf8'));
    const counts = {};
    for (const slot of slots) counts[slot] = countUses(sources, slot);
    return {
      basis: 'sources',
      counts,
      used: new Set(slots.filter(s => counts[s] > 0)),
    };
  }
  // Fallback: no sources on disk. Import presence over-counts a mounted-but-unused
  // container and under-counts an aliased API, so it is reported as a distinct basis.
  let imports = [];
  try {
    imports =
      JSON.parse(readFileSync(join(runDir, 'metrics.json'), 'utf8'))
        .bestax_import_list || [];
  } catch {
    return { basis: 'imports', counts: {}, used: new Set() };
  }
  const set = new Set(imports);
  return {
    basis: 'imports',
    counts: {},
    used: new Set(slots.filter(s => set.has(s))),
  };
}
