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
 *      the default tab — so the pnpm rendering is imported from the component's
 *      own `translate.mjs` rather than reimplemented here. A `command` may hold
 *      several `;`-separated lines.
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
import { renderCommand } from '../src/components/PackageManagerTabs/translate.mjs';

/** Heading level that a flattened `<TabItem label>` is promoted to. */
const TAB_HEADING = '####';

/** Sentinel wrapping masked code so a placeholder can never occur in prose. */
const NUL = String.fromCharCode(0);

/**
 * Emit a fenced block, indented to match the JSX tag it replaces.
 *
 * Every line needs the prefix, not just the opening fence. A component nested in
 * a list item whose body lands at column 0 terminates the list item: the command
 * becomes prose and the closing ``` opens a new block instead — and because
 * llms-full.txt is one concatenated document, that runs on into the next page.
 */
function fenced(indent, body) {
  const lines = body.split('\n').map(line => indent + line);
  return [`${indent}\`\`\`bash`, ...lines, `${indent}\`\`\``].join('\n');
}

/**
 * Quoted `command` only. A braced template — command={`add foo`} — is not
 * supported on purpose: its backticks are indistinguishable from an inline code
 * span, and code masking has to run first (see `outsideCode`), so the attribute
 * would be masked before this ever saw it. Author the prop as a plain string.
 *
 * Anchored to the start of a line so the tag's own indentation can be captured.
 * A tag sitting mid-sentence therefore doesn't match and survives as raw JSX —
 * loud and visible, rather than an inline fence that corrupts the document.
 *
 * The pnpm rendering comes from the component's own module, so llms.txt and the
 * default tab cannot drift apart.
 */
function flattenPackageManagerTabs(src) {
  return src.replace(
    /(^|\n)([ \t]*)<PackageManagerTabs\b[^>]*?\bcommand=(?:"([^"]*)"|'([^']*)')[^>]*?\/>/g,
    (_match, lead, indent, dq, sq) =>
      lead + fenced(indent, renderCommand((dq ?? sq).trim(), 'pnpm'))
  );
}

/**
 * Re-anchor a block of text to `indent`: strip the indentation its lines share,
 * then apply the target. Dedent-then-indent rather than prefixing, so a tab body
 * that already carries the source indentation doesn't end up doubly indented
 * (which at 4+ spaces would silently become a markdown code block). Identity
 * when there is nothing to strip and nothing to add.
 */
function reindentBlock(text, indent) {
  const lines = text.split('\n');
  const widths = lines
    .filter(line => line.trim() !== '')
    .map(line => line.match(/^[ \t]*/)[0].length);
  const shared = widths.length ? Math.min(...widths) : 0;

  if (shared === 0 && indent === '') return text;

  return lines
    .map(line => (line.trim() === '' ? '' : indent + line.slice(shared)))
    .join('\n');
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
  // Indentation is captured for the same reason as flattenPackageManagerTabs:
  // a `####` heading emitted at column 0 breaks out of an enclosing list item.
  return src.replace(
    /(^|\n)([ \t]*)<Tabs(?=[\s>])[^>]*>([\s\S]*?)<\/Tabs>/g,
    (_m, lead, indent, inner) => {
      const items = [
        ...inner.matchAll(/<TabItem\b([^>]*)>([\s\S]*?)<\/TabItem>/g),
      ];
      const reindent = text => reindentBlock(text, indent);

      if (items.length === 0) return lead + reindent(inner.trim());

      return (
        lead +
        items
          .map(([, attrs, body]) => {
            const label = attrLabel(attrs);
            const text = reindent(body.trim());
            return label ? `${indent}${TAB_HEADING} ${label}\n\n${text}` : text;
          })
          .join('\n\n')
      );
    }
  );
}

/**
 * Mask fenced code blocks, per CommonMark rather than by regex.
 *
 * A regex can't do this: fences are variable-length and come in two characters,
 * and the closing fence only has to be *at least* as long as the opening one.
 * `docs/api/helpers/theme.md` and `docs/tutorial-basics/markdown-features.mdx`
 * both wrap ``` examples in ```` fences, so mis-pairing is not hypothetical.
 */
function maskFences(src, hold, report) {
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
        open = {
          char: fence[1][0],
          len: fence[1].length,
          indent: line.match(/^[ \t]*/)[0].length,
        };
        buf = [line];
      } else {
        out.push(line);
      }
      continue;
    }

    buf.push(line);
    const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
    if (close && close[1][0] === open.char && close[1].length >= open.len) {
      // A fence opened inside a list item whose body or closer is *less*
      // indented than the opening fence. CommonMark still pairs the two (a
      // closer may sit at 0-3 spaces regardless), so parity looks fine — but the
      // under-indented lines have terminated the list item, ejecting the command
      // into prose and swallowing whatever followed. This is the exact signature
      // of a rewrite that forgot to carry the tag's indentation.
      if (report && open.indent > 0) {
        const dedented = buf
          .slice(1)
          .some(
            body =>
              body.trim() !== '' &&
              body.match(/^[ \t]*/)[0].length < open.indent
          );
        if (dedented) report.dedentedFenceBody = true;
      }
      out.push(hold(buf.join('\n')));
      open = null;
      buf = [];
    }
  }

  // An unterminated fence runs to end of document (CommonMark). Mask it: never
  // mutate content we can't confidently parse. Callers that are verifying rather
  // than transforming want to know, because in a generated artifact it means an
  // earlier rewrite emitted a fence line at the wrong indentation.
  if (open) {
    if (report) report.unterminatedFence = true;
    out.push(hold(buf.join('\n')));
  }

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
function outsideCode(src, fn, report) {
  const held = [];
  const hold = chunk => {
    held.push(chunk);
    return NUL + (held.length - 1) + NUL;
  };

  const masked = maskFences(src, hold, report).replace(
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

/**
 * Problems that mean a rewritten artifact is not fit to publish.
 *
 * Both failure modes here are silent by nature — the HTML site builds fine and
 * only the machine-readable artifacts are wrong — so `main` turns them into a
 * build failure rather than trusting review to spot them.
 *
 * - Surviving tab JSX outside code means a tag shape this script doesn't handle
 *   (a mid-line component, an unquoted prop) reached the artifact verbatim.
 * - A fence whose body is dedented below its opening fence is the signature of a
 *   rewrite that dropped the tag's indentation: CommonMark still pairs the
 *   fences, so nothing looks wrong, but the under-indented lines have terminated
 *   the enclosing list item and swallowed what followed.
 * - An unterminated fence corrupts everything after it in a concatenated
 *   artifact.
 */
export function verifyArtifact(src) {
  const problems = [];
  const report = {};
  const residual = new Set();

  outsideCode(
    src,
    chunk => {
      for (const [tag] of chunk.matchAll(
        /<PackageManagerTabs\b|<Tabs(?=[\s>])|<TabItem\b/g
      )) {
        residual.add(tag);
      }
      return chunk;
    },
    report
  );

  if (residual.size) {
    problems.push(
      `unflattened tab JSX outside code: ${[...residual].join(', ')}`
    );
  }
  if (report.dedentedFenceBody) {
    problems.push('fenced block dedented below its opening fence');
  }
  if (report.unterminatedFence) {
    problems.push('unterminated code fence');
  }
  return problems;
}

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
  const failures = [];

  for await (const file of walk(buildDir)) {
    if (!isLlmArtifact(file)) continue;
    const before = await readFile(file, 'utf8');
    if (!NEEDS_FLATTENING.test(before)) continue;
    const after = transform(before);
    if (after === before) continue;

    for (const problem of verifyArtifact(after)) {
      failures.push(`${path.relative(buildDir, file)}: ${problem}`);
    }
    await writeFile(file, after);
    changed += 1;
  }

  console.log(
    `flatten-llms-tabs: rewrote ${changed} file(s) under ${buildDir}`
  );

  // Fail the build. These artifacts are what agents consume, and both failure
  // modes are invisible in the rendered site.
  if (failures.length) {
    throw new Error(
      `${failures.length} artifact(s) failed verification:\n  ${failures.join('\n  ')}`
    );
  }
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
