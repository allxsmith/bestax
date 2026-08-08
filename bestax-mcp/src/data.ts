/**
 * Loaders for the generated index in `data/`.
 *
 * Everything here is lazy and cached. A stdio server is spawned fresh by every
 * client, so startup cost is paid on every session: the catalog (~76 KB) is the
 * only file read eagerly, and a component's own file is pulled the first time a
 * tool asks for it.
 *
 * Nothing in this module is written by hand — regenerate with `pnpm gen:mcp`.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Bumped by the generator when the shape changes incompatibly. */
export const SUPPORTED_SCHEMA_VERSION = 1;

export interface PropRow {
  name: string;
  type: string;
  default: string | null;
  description: string;
  required: boolean;
  inherited: boolean;
  deprecated: boolean;
  deprecationNote?: string;
  /** Docs slug defining a value union too large to inline, e.g. Bulma colors. */
  valuesRef?: string;
}

export interface TypeDef {
  name: string;
  expansion: string;
  summary: string;
}

export interface Part {
  /** Dot-path: `Navbar`, `Navbar.Brand`. */
  path: string;
  summary: string;
  /** Set when the sub-component is also exported standalone. */
  component: string | null;
  props: PropRow[];
  extraProps: PropRow[];
  catchAll: string | null;
  types: TypeDef[];
}

export interface CssVar {
  css: string;
  sass: string | null;
  default: string;
  /** `component`: declared on the component's own selector. `global`: on :root. */
  scope: 'component' | 'global';
}

export interface Example {
  title: string;
  code: string;
}

export interface ComponentRecord {
  name: string;
  kind: 'component' | 'helper';
  category: string;
  slug: string;
  docsUrl: string;
  summary: string;
  import: string;
  examples: Example[];
  accessibility: string | null;
  related: string[];
  storybook: string | null;
  parts: Part[];
  cssVars: CssVar[];
  sourceFile?: string;
  rootClass?: string | null;
  /** Helper pages ship as prose — they have no props interface. */
  doc?: string;
}

export interface CatalogEntry {
  name: string;
  kind: 'component' | 'helper';
  category: string;
  purpose: string;
  slug: string;
  import: string;
  compound: boolean;
  propCount: number;
  exampleCount: number;
}

export interface Catalog {
  schemaVersion: number;
  generatedFrom: { package: string; version: string };
  docsBase: string;
  categories: { id: string; label: string; components: string[] }[];
  components: CatalogEntry[];
  cssVarIndex: Record<string, string>;
}

export interface SkillFile {
  id: string;
  file: string;
  bytes: number;
}

export interface Skill {
  name: string;
  description: string;
  /** `bestax-theming` -> `theming`, the name an MCP client shows for the prompt. */
  promptName: string;
  dir: string;
  references: SkillFile[];
  examples: SkillFile[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
/** `dist/data.js` and `src/data.ts` are both one level under the package root. */
export const DATA_DIR = join(HERE, '..', 'data');

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, 'utf8')) as T;

/**
 * The index and the server ship in the same tarball, so a mismatch here is a
 * broken build rather than a user running something stale. Fail loudly instead
 * of serving half of every field.
 */
export function assertSchema(catalog: Catalog): Catalog {
  if (catalog.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      `bestax-mcp: data/catalog.json is schema version ${catalog.schemaVersion}, ` +
        `but this server understands ${SUPPORTED_SCHEMA_VERSION}. Reinstall bestax-mcp.`
    );
  }
  return catalog;
}

let catalogPromise: Promise<Catalog> | null = null;

export function loadCatalog(): Promise<Catalog> {
  catalogPromise ??= readJson<Catalog>(join(DATA_DIR, 'catalog.json')).then(
    assertSchema
  );
  return catalogPromise;
}

const componentCache = new Map<string, Promise<ComponentRecord>>();

/**
 * Resolve a user-supplied name to a real component.
 *
 * Tolerant on purpose — a model asks for `navbar`, `<Button>` or
 * `Navbar.Brand`, and refusing any of those wastes a round trip when the
 * intent is unambiguous.
 */
export async function resolveName(input: string): Promise<string | null> {
  const catalog = await loadCatalog();
  const cleaned = input.trim().replace(/^<|\/?>$/g, '');
  const root = cleaned.split('.')[0];
  const exact = catalog.components.find(c => c.name === root);
  if (exact) return exact.name;
  const lower = root.toLowerCase();
  const ci = catalog.components.find(c => c.name.toLowerCase() === lower);
  return ci ? ci.name : null;
}

export function loadComponent(name: string): Promise<ComponentRecord> {
  let cached = componentCache.get(name);
  if (!cached) {
    cached = readJson<ComponentRecord>(
      join(DATA_DIR, 'components', `${name}.json`)
    );
    componentCache.set(name, cached);
  }
  return cached;
}

let skillsPromise: Promise<Skill[]> | null = null;

export function loadSkills(): Promise<Skill[]> {
  skillsPromise ??= readJson<{ skills: Skill[] }>(
    join(DATA_DIR, 'skills.json')
  ).then(d => d.skills);
  return skillsPromise;
}

/**
 * A skill's SKILL.md or one of its reference/example files.
 *
 * Bodies are copied into `data/skills/` at build time (see
 * `scripts/sync-skills.mjs`) rather than committed, so a source checkout that
 * has not been built has the manifest but no bodies. Say so rather than
 * surfacing an ENOENT — the fix is `pnpm --filter bestax-mcp build`.
 */
export async function loadSkillFile(
  dir: string,
  relative = 'SKILL.md'
): Promise<string> {
  // Defence in depth: `relative` reaches these loaders from tool arguments, and
  // the manifest is the only thing allowed to name a file.
  if (relative.includes('..') || relative.startsWith('/')) {
    throw new Error(`bestax-mcp: refusing to read "${relative}"`);
  }
  const path = join(DATA_DIR, 'skills', dir, relative);
  if (!existsSync(path)) {
    throw new Error(
      `bestax-mcp: ${dir}/${relative} is not in this build. Skill bodies are ` +
        `synced by \`pnpm --filter bestax-mcp build\`; a published tarball ` +
        `always carries them.`
    );
  }
  return readFile(path, 'utf8');
}

/** Test seam — the loaders memoise for the life of a stdio session. */
export function resetCaches(): void {
  catalogPromise = null;
  skillsPromise = null;
  componentCache.clear();
}
