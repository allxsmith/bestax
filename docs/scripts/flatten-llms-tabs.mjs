#!/usr/bin/env node
/**
 * Flatten MDX tab JSX in the generated LLM artifacts.
 *
 * `docusaurus-plugin-llms` reads the *source* markdown, not the rendered HTML,
 * and its only cleanup (`cleanMarkdownContent`) strips a fixed allowlist of
 * plain HTML tags. `<Tabs>` / `<TabItem>` are not in that list and its options
 * expose no transform hook, so tab JSX lands verbatim in llms.txt,
 * llms-full.txt and every per-page .md twin.
 *
 * This runs after `docusaurus build` and rewrites those artifacts only — the
 * HTML site is untouched. It cannot be a Docusaurus plugin: core runs every
 * plugin's `postBuild` under `Promise.all`, so a sibling plugin would race
 * docusaurus-plugin-llms nondeterministically.
 *
 * Two transforms, because there are two kinds of tabs:
 *
 *   1. `<PackageManagerTabs command="add foo" />` — four *equivalent* commands.
 *      Collapse to a single fenced pnpm block. What an agent copies out of
 *      llms.txt has to match what a reader sees on the default tab, and pnpm is
 *      the default tab.
 *
 *   2. `<Tabs>` / `<TabItem label="X">` — *complementary* content (the skills
 *      pages tab between ProfileCard.tsx, _profilecard.scss and Usage). Keep
 *      every body and promote the label to a heading. Keeping only the first
 *      tab here would silently delete documentation.
 *
 * Both transforms run only outside code — see `outsideCode` for why that is not
 * optional.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Heading level that a flattened `<TabItem label>` is promoted to. */
const TAB_HEADING = '####';

/** Sentinel wrapping masked code so a placeholder can never occur in prose. */
const NUL = String.fromCharCode(0);

/**
 * `command` is authored in pnpm's verb vocabulary (`add`, `create`, `dlx`), so
 * this is a passthrough. The npm/yarn/bun translations live in the React
 * component; duplicating them here would be a second source of truth.
 */
const toPnpm = command => `pnpm ${command}`.replace(/\s+/g, ' ').trim();

/**
 * Quoted `command` only. A braced template — command={`add foo`} — is not
 * supported on purpose: its backticks are indistinguishable from an inline code
 * span, and code masking has to run first (see `outsideCode`), so the attribute
 * would be masked before this ever saw it. Author the prop as a plain string.
 */
function flattenPackageManagerTabs(src) {
  return src.replace(
    /<PackageManagerTabs\b[^>]*?\bcommand=(?:"([^"]*)"|'([^']*)')[^>]*?\/>/g,
    (_match, dq, sq) => '```bash\n' + toPnpm((dq ?? sq).trim()) + '\n```'
  );
}

function attrLabel(attrs) {
  for (const key of ['label', 'value']) {
    const m = attrs.match(new RegExp(`\\b${key}=(?:"([^"]*)"|'([^']*)')`));
    if (m) return m[1] ?? m[2] ?? '';
  }
  return '';
}

function flattenGenericTabs(src) {
  // `<Tabs(?=[\s>])`, never `<Tabs\b` — \b matches inside `<Tabs.List>`, which
  // is bestax-bulma's own Tabs component as documented in docs/api/components.
  return src.replace(/<Tabs(?=[\s>])[^>]*>([\s\S]*?)<\/Tabs>/g, (_m, inner) => {
    const items = [
      ...inner.matchAll(/<TabItem\b([^>]*)>([\s\S]*?)<\/TabItem>/g),
    ];
    if (items.length === 0) return inner.trim();
    return items
      .map(([, attrs, body]) => {
        const label = attrLabel(attrs);
        const text = body.trim();
        return label ? `${TAB_HEADING} ${label}\n\n${text}` : text;
      })
      .join('\n\n');
  });
}

/**
 * Apply `fn` only outside code — fenced blocks *and* inline spans.
 *
 * Both exclusions are load-bearing: `docs/api/components/tabs.md` documents
 * bestax-bulma's own `<Tabs.List>` / `<Tabs.Item>` inside tsx fences, and the
 * migration guides mention the Tabs component inline in prose. Neither is a
 * Docusaurus theme tab and neither may be rewritten.
 *
 * Mask rather than split: a `<Tabs>` block *wraps* fenced code, so the document
 * has to stay contiguous for `<Tabs>…</Tabs>` to match across it.
 */
/**
 * Mask fenced code blocks, per CommonMark rather than by regex.
 *
 * A regex can't do this: fences are variable-length and come in two characters,
 * and the closing fence only has to be *at least* as long as the opening one.
 * `docs/api/helpers/theme.md` and `docs/tutorial-basics/markdown-features.mdx`
 * both wrap ``` examples in ```` fences, so mis-pairing is not hypothetical.
 */
function maskFences(src, hold) {
  const out = [];
  let open = null;
  let buf = [];

  for (const line of src.split('\n')) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

    if (!open) {
      // A backtick fence's info string may not itself contain a backtick.
      const validOpen =
        fence && !(fence[1][0] === '`' && fence[2].includes('`'));
      if (validOpen) {
        open = { char: fence[1][0], len: fence[1].length };
        buf = [line];
      } else {
        out.push(line);
      }
      continue;
    }

    buf.push(line);
    const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
    if (close && close[1][0] === open.char && close[1].length >= open.len) {
      out.push(hold(buf.join('\n')));
      open = null;
      buf = [];
    }
  }

  // An unterminated fence runs to end of document (CommonMark). Mask it: never
  // mutate content we can't confidently parse.
  if (open) out.push(hold(buf.join('\n')));

  return out.join('\n');
}

/**
 * Apply `fn` only outside code — fenced blocks *and* inline spans.
 *
 * Both exclusions are load-bearing: `docs/api/components/tabs.md` documents
 * bestax-bulma's own `<Tabs.List>` / `<Tabs.Item>` inside tsx fences, and the
 * migration guides mention the Tabs component inline in prose. Neither is a
 * Docusaurus theme tab and neither may be rewritten.
 *
 * Mask rather than split: a `<Tabs>` block *wraps* fenced code, so the document
 * has to stay contiguous for `<Tabs>…</Tabs>` to match across it.
 *
 * Inline spans are matched single-line only. CommonMark allows one to wrap, but
 * an unpaired backtick in prose would then swallow the rest of the document —
 * the failure mode of guessing wrong here is much worse than the miss.
 */
function outsideCode(src, fn) {
  const held = [];
  const hold = chunk => {
    held.push(chunk);
    return NUL + (held.length - 1) + NUL;
  };

  const masked = maskFences(src, hold).replace(
    /(`+)(?:(?!\1)[^\n])*?\1/g,
    hold
  );

  const restore = new RegExp(NUL + '(\\d+)' + NUL, 'g');
  return fn(masked).replace(restore, (_m, i) => held[Number(i)]);
}

/**
 * Rewrite one artifact's contents. Idempotent.
 *
 * Every rewrite happens inside `outsideCode` — including the import and blank
 * line cleanup. Running those after restoration would reach into fenced code and
 * strip `import Tabs …` lines out of examples, or collapse deliberate blank
 * lines in a code block.
 */
export function transform(src) {
  return outsideCode(src, chunk =>
    flattenGenericTabs(flattenPackageManagerTabs(chunk))
      .replace(/^[ \t]*import\s+(?:Tabs|TabItem|PackageManagerTabs)\b.*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
  );
}

/**
 * Cheap prefilter for `main`. Matches the imports too — `transform` strips
 * orphaned tab imports, so an artifact carrying only those still has work to do.
 */
export const NEEDS_FLATTENING =
  /<Tabs|<TabItem|<PackageManagerTabs|^[ \t]*import\s+(?:Tabs|TabItem|PackageManagerTabs)\b/m;

/** True when a file is one of the artifacts this script owns. */
export function isLlmArtifact(file) {
  const base = path.basename(file);
  if (base.endsWith('.md')) return true;
  return base.endsWith('.txt') && base.startsWith('llms');
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main(buildDir) {
  let changed = 0;
  for await (const file of walk(buildDir)) {
    if (!isLlmArtifact(file)) continue;
    const before = await readFile(file, 'utf8');
    if (!NEEDS_FLATTENING.test(before)) continue;
    const after = transform(before);
    if (after === before) continue;
    await writeFile(file, after);
    changed += 1;
  }
  console.log(
    `flatten-llms-tabs: rewrote ${changed} file(s) under ${buildDir}`
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const buildDir = process.argv[2] ?? 'build';
  main(buildDir).catch(error => {
    console.error(`flatten-llms-tabs: ${error.message}`);
    process.exitCode = 1;
  });
}
