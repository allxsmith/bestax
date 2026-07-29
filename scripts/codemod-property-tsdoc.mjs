#!/usr/bin/env node
/**
 * ONE-TIME migration: move prop documentation from the `@property` block above
 * each `<X>Props` interface onto the interface members as inline TSDoc.
 *
 *   /**                                    /**
 *    * Props for the Footer component.      * Props for the Footer component.
 *    *                                      *\/
 *    * @property {string} [className] -     export interface FooterProps … {
 *    *   Additional CSS classes.              /** Additional CSS classes. *\/
 *    *\/                                       className?: string;
 *
 * Why bother: `@property` is a comment ABOUT the interface. TypeScript cannot
 * check it, so its hand-typed `{Type}` drifts from the real member type, and it
 * never reaches a user's editor. Inline TSDoc is verifiable by position, shows
 * up in IntelliSense, and is what `scripts/lib/props-extract.mjs` reads.
 *
 * Three rules that matter:
 *
 * 1. DESCRIPTIONS COME FROM THE DOCS PAGE FIRST. The hand-written tables in
 *    docs/docs/api are consistently richer than the `@property` lines
 *    (button.md explains what `ghost` and `text` render as; the source comment
 *    just says "Bulma color modifier"). Migrating from the source would quietly
 *    downgrade the docs.
 * 2. MERGE, NEVER OVERWRITE. 21 modules already carry some inline member TSDoc
 *    and 6 are mixed; a member that already has a comment is left alone.
 * 3. ORPHAN `@property` LINES ARE NOT DROPPED. 38 of them name props that live
 *    on a DOM base type rather than the interface. Those are rewritten as
 *    `@extraProp`, which props-extract renders as its own rows.
 *
 * Usage:
 *   node scripts/codemod-property-tsdoc.mjs --category=layout [--dry-run]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { extractComponent } from './lib/props-extract.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const ts = require('typescript');
const prettier = require('prettier');

/**
 * Every prop name the generator will already emit for a component — own
 * members, everything pulled in through `Omit<ButtonProps, …>`-style heritage,
 * the named DOM commons, sub-component tables, and any `@extraProp` already
 * parked. Parking a prop the generator emits anyway would put it on the page
 * twice: `LinkButton` documents 14 props it inherits from `ButtonProps`, and
 * `table.md`'s sub-tables document `isSelected` under `Table.Tr`.
 *
 * Read before any file is written, so it describes the pre-codemod source —
 * which is what we want, since the codemod only adds comments.
 */
const coveredCache = new Map();
const derivedDefaults = new Map(); // component -> prop -> default the AST found
function coveredProps(component) {
  if (coveredCache.has(component)) return coveredCache.get(component);
  let set = new Set();
  try {
    const info = extractComponent(component);
    // Synthetic DOM rows do not count as covered: a page that wrote its own
    // description for `ref` or `children` still needs that text parked.
    set = new Set(
      info.tables.flatMap(t => [
        ...t.rows.filter(r => !r.synthetic).map(r => r.name),
        ...t.extraProps.map(e => e.name),
      ])
    );
    const seen = new Map();
    for (const t of info.tables) {
      for (const r of t.rows)
        if (!seen.has(r.name)) seen.set(r.name, r.default);
    }
    derivedDefaults.set(component, seen);
  } catch {
    // Not an exported component (a sub-component interface with no page of its
    // own). Its `docs` map is empty anyway, so nothing is parked either way.
  }
  coveredCache.set(component, set);
  return set;
}

// ---------------------------------------------------------------------------
// Existing docs tables — the preferred description source.
// ---------------------------------------------------------------------------

function frontmatterTitle(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
}

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * prop name -> description, from every markdown table on the page.
 *
 * Handles all the shapes in the wild: `| Prop | Type | Default | Description |`,
 * `| Prop | Type | Description |`, and footer.md's `| Field | … |`. The
 * description is always the last column; the prop name is always the first.
 */
function parseDocsDescriptions(md) {
  const out = new Map();
  const defaults = new Map();
  const types = new Map();
  const lines = md.split(/\r?\n/);
  let headers = null;
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      headers = null;
      continue;
    }
    const cells = t
      .replace(/^\||\|$/g, '')
      .split(/(?<!\\)\|/)
      .map(c => c.trim());
    if (!headers) {
      if (/^(prop|field|name)$/i.test(cells[0])) headers = cells;
      continue;
    }
    if (/^-{2,}/.test(cells[0])) continue;
    const name = cells[0].replace(/`/g, '').trim();
    // A leading "**Deprecated.** …" clause is NOT part of the description: the
    // generator synthesises it from the member's `@deprecated` tag, so keeping
    // it here would double it, and a row that says nothing else would replace a
    // perfectly good comment with the deprecation notice alone.
    const desc = cells[cells.length - 1]
      .replace(/^\*\*Deprecated\.?\*\*[^.]*\.\s*/i, '')
      .trim();
    const ti = headers.findIndex(h => /^type$/i.test(h));
    const ty = ti >= 0 ? (cells[ti] ?? '').replace(/\\\|/g, '|').trim() : '';
    if (name && ty && ty !== '—' && !types.has(name)) types.set(name, ty);
    const di = headers.indexOf('Default');
    const def = di >= 0 ? (cells[di] ?? '').replace(/`/g, '').trim() : '';
    if (name && def && def !== '—' && !defaults.has(name)) {
      defaults.set(name, def);
    }
    if (!name || name === '...' || !desc || desc === '—') continue;
    if (!out.has(name)) out.set(name, desc.replace(/\\\|/g, '|'));
  }
  out.defaults = defaults;
  out.types = types;
  return out;
}

// ---------------------------------------------------------------------------
// @property parsing
// ---------------------------------------------------------------------------

/**
 * Parse `@property {Type} [name] - description` lines out of a raw JSDoc
 * comment. `{Type}` is discarded — the interface is the type source of truth.
 * Continuation lines (prettier wraps long descriptions) are folded in.
 */
function parsePropertyTags(comment) {
  const body = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*\*\s?/, ''));

  const tags = [];
  let current = null;
  const summary = [];
  for (const line of body) {
    // `line` never contains a newline (body is split above), so `[^}]` is both
    // equivalent to a lazy `[\s\S]+?` here and free of the backtracking that
    // lazy-quantifier-before-a-literal produces.
    // `[name='h1']` — the optional-with-default JSDoc form. The `=…` part is
    // dropped: the destructured default is the source of truth and is read
    // straight off the component, so keeping it here would be a second copy
    // free to drift. Without this branch `='h1']` leaks into the description.
    const m = line.match(
      /^\s*@property\s+(?:\{([^}]+)\}\s*)?\[?([\w'"$-]+)(?:=[^\]]*)?\]?\s*(?:-\s*)?(.*)$/
    );
    if (m) {
      if (current) tags.push(current);
      current = {
        type: m[1] ?? null,
        name: m[2].replace(/^['"]|['"]$/g, ''),
        desc: (m[3] ?? '').trim(),
      };
      continue;
    }
    if (/^\s*@/.test(line)) {
      if (current) tags.push(current);
      current = null;
      continue;
    }
    if (current) {
      if (line.trim()) current.desc += ` ${line.trim()}`;
      continue;
    }
    if (!tags.length) summary.push(line);
  }
  if (current) tags.push(current);
  for (const t of tags) t.desc = t.desc.replace(/\s+/g, ' ').trim();
  return { tags, summary: summary.join('\n').trim() };
}

/**
 * Combine the two hand-written sources for a prop's description, page first.
 *
 * Containment decides: where one already says everything the other does, keep
 * the longer. Otherwise keep BOTH. Picking the longer of two genuinely
 * different sentences drops whatever the shorter one alone knew — breadcrumb.md
 * says "`<li>`s with `<a>` or `<span>`" where the source says "e.g., \"a\" or
 * \"span\" html elements", and neither is a superset of the other.
 */
/**
 * Drop a trailing parenthetical that only restates the type — "(Bulma color,
 * 'inherit', or 'current')" says exactly what the Type column already shows,
 * and carrying it into the merge produced 40 rows reading "Text color helper.
 * Text color (Bulma color, 'inherit', or 'current')." Nothing is lost: the same
 * words remain in the row, in the cell that is meant to hold them.
 */
function stripTypeRestatement(text) {
  return text
    .replace(
      /\s*\((?:Bulma\s+(?:color|size),?\s*)?(?:'[^']*'|,|\s|or)+\)(?=[.,]?$)/i,
      ''
    )
    .trim();
}

function mergeDescriptions(fromDocs, other, onDiscard) {
  if (!fromDocs) return other;
  if (!other || fromDocs === other) return fromDocs;
  if (stripTypeRestatement(other) !== other) {
    other = stripTypeRestatement(other).replace(/\.?$/, '.');
  }
  if (fromDocs === other) return fromDocs;
  const norm = t => t.toLowerCase().replace(/[.\s]+$/, '');
  // The page text is intact inside the comment, which only adds a tail — take
  // the fuller one, nothing of the page's wording is lost.
  if (norm(other).includes(norm(fromDocs))) return other;
  if (norm(fromDocs).includes(norm(other))) return fromDocs;

  // Otherwise the two disagree on WORDING, and the page wins. Its sentences
  // were hand-corrected; the comment they are merged with may predate that
  // correction, and silently promoting it would undo the edit — which is the
  // one thing a docs generator must never do. What the comment said is
  // reported instead, so the difference is reviewed rather than lost.
  onDiscard?.(other);
  return fromDocs;
}

function memberName(member) {
  return member.name?.getText().replace(/^['"]|['"]$/g, '') ?? null;
}

function memberJsDoc(member) {
  const docs = ts
    .getJSDocCommentsAndTags(member)
    .filter(d => ts.isJSDoc(d) && d.comment);
  return docs[docs.length - 1] ?? null;
}

function hasOwnJsDoc(member) {
  return memberJsDoc(member) != null;
}

/**
 * All prop-carrying declarations in the file, indexed by name for base lookups.
 * Type aliases are included: `ControlProps` and `SliderProps` are unions, and
 * skipping them left `as` and `ref` with no description anywhere.
 */
function interfaceIndex(sf) {
  const map = new Map();
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) {
      map.set(stmt.name.text, stmt);
    }
  }
  return map;
}

/**
 * The members a declaration can carry TSDoc on. An interface's are its own; a
 * type alias's live in the inline `{ as?: 'div' }` literals of its union and
 * intersection branches, which is where `ControlProps` declares `as`/`ref`.
 */
function documentableMembers(decl) {
  if (ts.isInterfaceDeclaration(decl)) return [...decl.members];
  const out = [];
  const walk = node => {
    if (!node) return;
    if (ts.isParenthesizedTypeNode(node)) return walk(node.type);
    if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
      node.types.forEach(walk);
      return;
    }
    if (ts.isTypeLiteralNode(node)) out.push(...node.members);
  };
  walk(decl.type);
  return out;
}

function lineIndent(src, pos) {
  const lineStart = src.lastIndexOf('\n', pos - 1) + 1;
  return src.slice(lineStart, pos).match(/^\s*/)[0];
}

// ---------------------------------------------------------------------------

async function processFile(file, docsByTitle, opts) {
  const original = await readFile(file, 'utf8');
  const sf = ts.createSourceFile(
    file,
    original,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const interfaces = interfaceIndex(sf);

  // What the generator will emit for every documented component declared in
  // this file. Keyed per FILE, not per interface: `ControlProps` is a union
  // over `ControlBaseProps`, so `ControlBase` has no page of its own but its
  // props all surface on control.md.
  const fileCovered = new Set();
  // Defaults are file-level for the same reason: `completedIcon` is declared on
  // `StepProps`, which has no page — the `'✓'` that documents it is stated on
  // steps.md, under the component the sub-interface belongs to.
  const fileStated = new Map(); // prop -> default the docs table states
  const fileDerived = new Map(); // prop -> default the AST could see
  const fileDocs = new Map(); // prop -> description, any page this file feeds
  for (const declName of interfaces.keys()) {
    // `TimeInputBaseProps` has no page of its own — `TimeInput` is the thin
    // wrapper the docs describe, and every prop it documents is declared here.
    const candidates = [
      declName.replace(/Props$/, ''),
      declName.replace(/BaseProps$/, ''),
    ];
    for (const comp of new Set(candidates)) {
      if (!docsByTitle.has(comp)) continue;
      for (const prop of coveredProps(comp)) fileCovered.add(prop);
      for (const [k, v] of docsByTitle.get(comp).defaults ?? []) {
        if (!fileStated.has(k)) fileStated.set(k, v);
      }
      for (const [k, v] of docsByTitle.get(comp)) {
        if (!fileDocs.has(k)) fileDocs.set(k, v);
      }
      for (const [k, v] of derivedDefaults.get(comp) ?? []) {
        if (v && !fileDerived.has(k)) fileDerived.set(k, v);
      }
    }
  }

  const edits = []; // { start, end, text }
  const report = {
    file: relative(REPO, file),
    inserted: 0,
    orphans: [],
    borrowed: [],
    discarded: [],
    rewritten: [],
    undocumented: [],
  };

  for (const [name, decl] of interfaces) {
    const jsdocs = ts.getJSDocCommentsAndTags(decl).filter(ts.isJSDoc);
    const jsdoc = jsdocs[jsdocs.length - 1];
    const raw = jsdoc ? original.slice(jsdoc.pos, jsdoc.end).trim() : '';
    const { tags } = raw ? parsePropertyTags(raw) : { tags: [] };

    // Descriptions available for this interface's props, docs page first.
    //
    // EXACT title match only. Falling back to the parent's page for a
    // sub-component (HeroHead -> Hero) borrows descriptions that are wrong in
    // context: Hero's `children` is "Hero content (often includes Hero.Head,
    // Hero.Body, Hero.Foot)", which is nonsense on Hero.Head itself. Where a
    // sub-component has no page, its `@property` lines are the better source.
    const component = name.replace(/Props$/, '');
    const docs = docsByTitle.get(component) ?? new Map();

    // Nothing to migrate and no page to migrate FROM. An interface with a docs
    // page still has work to do even with no @property block: the page may
    // document inherited props that need parking.
    if (!tags.length && !jsdoc && !docs.size) continue;
    const byName = new Map(tags.map(t => [t.name, t.desc]));

    // A default the docs table states but the destructuring does not — a
    // computed default (`Field.tsx`'s `labelSize ?? …`) or one applied inside
    // the component body. The AST cannot see those, so carry them across as
    // `@defaultValue`, which the extractor prefers over what it derives.
    const defaultValueTag = propName => {
      const stated = docs.defaults?.get(propName) ?? fileStated.get(propName);
      if (!stated || fileDerived.get(propName)) return null;
      // Prose in a Default cell ("auto", "(see below)") is still a fact the
      // table stated; keep it verbatim rather than guessing an expression.
      return stated;
    };

    const members = documentableMembers(decl);
    const ownNames = new Set(members.map(memberName).filter(Boolean));

    // A module-private or sub-component interface (`MenuItemProps`,
    // `SliderBaseProps`) has no page of its own, but the page of the component
    // it feeds documents its props. Borrow that text ONLY for props this file
    // declares in exactly one place — `children` appears on both `MenuProps`
    // and `MenuItemProps`, and Hero.Head taking Hero's "often includes
    // Hero.Head, Hero.Body, Hero.Foot" is the nonsense this guards against.
    const borrow = mName => {
      if (docs.size) return undefined;
      for (const [otherName, other] of interfaces) {
        if (!documentableMembers(other).some(m => memberName(m) === mName)) {
          continue;
        }
        // Declared on an interface that HAS a page — that page's row belongs to
        // it, not to us. `children` on `MenuProps` is Menu's; `MenuItemProps`
        // must not take it.
        if (docsByTitle.has(otherName.replace(/Props$/, ''))) return undefined;
      }
      return fileDocs.get(mName);
    };

    // Members that lack a comment get one.
    for (const member of members) {
      const mName = memberName(member);
      if (!mName) continue;
      let fromDocs = docs.get(mName);
      if (fromDocs === undefined) {
        fromDocs = borrow(mName);
        if (fromDocs !== undefined) {
          report.borrowed.push(`${name}.${mName}: "${fromDocs}"`);
        }
      }
      const fromTag = byName.get(mName);
      const desc = mergeDescriptions(fromDocs, fromTag, text =>
        report.discarded.push(
          `${name}.${mName}\n      page:    ${fromDocs}\n      comment: ${text}`
        )
      );

      const existing = memberJsDoc(member);
      if (existing) {
        // MERGE, don't blindly keep. 21 modules already carry inline TSDoc, and
        // where it is terser than the docs page the page wins — `bgColor` reads
        // "Background color for all columns" there and "Background color" here,
        // and keeping the comment would quietly shorten the published table.
        // Anything the comment says that the page does not is appended rather
        // than dropped.
        const current = (ts.getTextOfJSDocComment(existing.comment) ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        const merged =
          mergeDescriptions(fromDocs, current, text =>
            report.discarded.push(
              `${name}.${mName}\n      page:    ${fromDocs}\n      comment: ${text}`
            )
          ) || current;
        // A stated default is carried over even when the description is
        // unchanged — `completedIcon`'s comment is already the better text, but
        // the table's `'✓'` lives nowhere in the source.
        const tagged = ts
          .getJSDocTags(member)
          .some(t => t.tagName.text === 'defaultValue')
          ? null
          : defaultValueTag(mName);
        if (merged === current && !tagged) continue;
        const raw = original.slice(existing.pos, existing.end);
        const lead = raw.match(/^\s*/)[0];
        const indent = lineIndent(original, member.getStart(sf));
        edits.push({
          start: existing.pos,
          end: existing.end,
          text: tagged
            ? `${lead}/**\n${indent} * ${merged}\n${indent} * @defaultValue ${tagged}\n${indent} */`
            : `${lead}/** ${merged} */`,
        });
        if (merged !== current) {
          report.rewritten.push(
            `${name}.${mName}: "${current}" -> "${merged}"`
          );
        }
        continue;
      }

      if (!desc) {
        report.undocumented.push(`${name}.${mName}`);
        continue;
      }
      const start = member.getStart(sf);
      const indent = lineIndent(original, start);
      const tag = defaultValueTag(mName);
      edits.push({
        start,
        end: start,
        text: tag
          ? `/**\n${indent} * ${desc}\n${indent} * @defaultValue ${tag}\n${indent} */\n${indent}`
          : `/** ${desc} */\n${indent}`,
      });
      report.inserted++;
    }

    // Orphans: @property lines with no matching own member. Before parking them
    // as @extraProp, check whether a locally-declared base interface has the
    // member — SliderSingleProps documents 16 props that live on SliderBaseProps.
    // Props the docs table documents that have no `@property` line either.
    // These are the last loss vector: without them, everything the old table
    // said about `skeleton`, `value`, `active`, … would simply disappear.
    // Parking them keeps the page's information intact and puts the text in
    // the source, where the rest of it now lives.
    const docsOnly = [...docs.keys()]
      .filter(n => !ownNames.has(n) && !tags.some(t => t.name === n))
      .filter(n => /^[\w'"$-]+$/.test(n)) // skip prose-y cells like "min / max"
      .map(n => ({ type: null, name: n, desc: docs.get(n) }));

    const orphans = [...tags.filter(t => !ownNames.has(t.name)), ...docsOnly];
    const parked = [];
    for (const tag of orphans) {
      let placed = false;
      for (const clause of decl.heritageClauses ?? []) {
        for (const typeNode of clause.types) {
          const baseName = typeNode.expression.getText?.();
          const base = baseName && interfaces.get(baseName);
          if (!base) continue;
          const target = base.members.find(m => memberName(m) === tag.name);
          if (target && !hasOwnJsDoc(target)) {
            const start = target.getStart(sf);
            const indent = lineIndent(original, start);
            const desc = docs.get(tag.name) ?? tag.desc;
            edits.push({
              start,
              end: start,
              text: `/** ${desc} */\n${indent}`,
            });
            report.inserted++;
            placed = true;
          }
        }
      }
      // Park only what the generator would NOT emit anyway. A tag whose member
      // lives on a base in another module (LinkButtonProps -> ButtonProps) is
      // already covered by heritage expansion, and that module's own codemod
      // pass gives the member its TSDoc — parking here would duplicate the row.
      if (!placed && !fileCovered.has(tag.name)) {
        parked.push(tag);
        report.orphans.push(`${name}.${tag.name}`);
      }
    }

    // `[name=default]` when the table stated one — an @extraProp row has no
    // member to read a destructuring default from, so this is its only source.
    const extraPropLine = tag => {
      // The table's Type cell beats the `@property {…}` annotation: link.md
      // documents `target` as the four literals where the comment only says
      // `string`. An @extraProp has no member for the compiler to check, so
      // the richer of the two hand-written sources is the best available.
      const stated = (docs.types?.get(tag.name) ?? '').replace(/`/g, '').trim();
      const chosen =
        stated && stated.length > (tag.type ?? '').length ? stated : tag.type;
      const type = chosen ? `{${chosen}} ` : '';
      const def = docs.defaults?.get(tag.name) ?? fileStated.get(tag.name);
      const name = def ? `${tag.name}=${def}` : tag.name;
      // Same merge as a real member: an orphan `@property` line and the page
      // are two hand-written sources, and switch.md's "Controlled checked
      // state." is not in the comment's "Whether the switch is checked."
      const desc =
        mergeDescriptions(
          docs.get(tag.name) ?? fileDocs.get(tag.name),
          tag.desc
        ) ?? tag.desc;
      return ` * @extraProp ${type}[${name}] - ${desc}`;
    };

    // Rewrite the interface JSDoc: keep the summary, drop @property, park orphans.
    if (jsdoc && tags.length) {
      const { summary } = parsePropertyTags(raw);
      const indent = lineIndent(
        original,
        jsdoc.pos + (original.slice(jsdoc.pos).match(/^\s*/)?.[0].length ?? 0)
      );
      const lines = ['/**'];
      for (const l of (
        summary || `Props for the ${component} component.`
      ).split('\n')) {
        lines.push(` * ${l}`.trimEnd());
      }
      for (const tag of parked) lines.push(extraPropLine(tag));
      lines.push(' */');
      const text = lines.map((l, i) => (i === 0 ? l : indent + l)).join('\n');
      const startsAt = jsdoc.end - raw.length;
      edits.push({ start: startsAt, end: jsdoc.end, text });
    } else if (parked.length && !jsdoc) {
      const start = decl.getStart(sf);
      const indent = lineIndent(original, start);
      const lines = [
        '/**',
        ` * Props for the ${component} component.`,
        ...parked.map(extraPropLine),
        ' */',
      ];
      edits.push({
        start,
        end: start,
        text:
          lines.map((l, i) => (i === 0 ? l : indent + l)).join('\n') +
          `\n${indent}`,
      });
    } else if (parked.length) {
      // Props the docs page documents that this interface inherits rather than
      // declares — `skeleton` and `m`/`p` reach the component through
      // BulmaClassesProps, so they have no member to hang TSDoc on and no
      // @property line to rewrite. Re-emit the comment line for line and add
      // the parked tags at the end: with no @property block there is no tag
      // boundary for the summary parse to stop at, so anything it did not
      // recognise must still be carried through verbatim. Handles the
      // single-line `/** … */` form, which cannot simply be appended to.
      const kept = raw
        .replace(/^\/\*\*/, '')
        .replace(/\*\/$/, '')
        .split(/\r?\n/)
        .map(l => l.replace(/^\s*\*\s?/, '').trimEnd());
      while (kept.length && !kept[0].trim()) kept.shift();
      while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
      const indent = lineIndent(
        original,
        jsdoc.pos + (original.slice(jsdoc.pos).match(/^\s*/)?.[0].length ?? 0)
      );
      const lines = [
        '/**',
        ...kept.map(l => ` * ${l}`.trimEnd()),
        ...parked.map(extraPropLine),
        ' */',
      ];
      const text = lines.map((l, i) => (i === 0 ? l : indent + l)).join('\n');
      edits.push({ start: jsdoc.end - raw.length, end: jsdoc.end, text });
    }
  }

  if (!edits.length) return report;

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = original;
  for (const e of edits)
    out = out.slice(0, e.start) + e.text + out.slice(e.end);

  const config = await prettier.resolveConfig(file);
  out = await prettier.format(out, { ...config, filepath: file });

  if (!opts.dryRun) await writeFile(file, out);
  report.changed = out !== original;
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const catArg = args.find(a => a.startsWith('--category='));
  if (!catArg) {
    console.error(
      'Usage: node scripts/codemod-property-tsdoc.mjs --category=<dir> [--dry-run]'
    );
    process.exit(2);
  }
  const rawCategory = catArg.slice('--category='.length);

  // Resolve `--category` against the directories that actually exist under
  // src/ rather than interpolating it into a path. This script WRITES the
  // files it finds, so an unvalidated argv segment reaching `join()` is a
  // path-traversal sink (`--category=../../..`), and a typo would otherwise
  // fail with a bare ENOENT instead of naming the valid choices.
  const SRC_ROOT = join(REPO, 'bulma-ui', 'src');
  const categories = (await readdir(SRC_ROOT, { withFileTypes: true }))
    .filter(e => e.isDirectory() && !e.name.startsWith('__'))
    .map(e => e.name)
    .sort();
  const category = categories.find(c => c === rawCategory);
  if (!category) {
    console.error(
      `Unknown --category=${rawCategory}. Valid: ${categories.join(', ')}`
    );
    process.exit(2);
  }

  // `--base=origin/main` reads the PRE-migration pages. Required to re-run over
  // an already-migrated category: those pages now carry the GENERATED table, so
  // reading them from disk would feed the generator's own output back in.
  const base = args.find(a => a.startsWith('--base='))?.slice('--base='.length);
  const docsByTitle = new Map();
  for (const f of await mdFiles(API_DIR)) {
    const src = base
      ? execFileSync('git', ['show', `${base}:${relative(REPO, f)}`], {
          cwd: REPO,
          encoding: 'utf8',
        })
      : await readFile(f, 'utf8');
    const title = frontmatterTitle(src);
    if (title) docsByTitle.set(title, parseDocsDescriptions(src));
  }

  const srcDir = join(REPO, 'bulma-ui', 'src', category);
  const files = (await readdir(srcDir))
    .filter(f => /\.tsx?$/.test(f) && !/\.(stories|test)\./.test(f))
    .sort()
    .map(f => join(srcDir, f));

  let inserted = 0;
  const orphans = [];
  const borrowed = [];
  const discarded = [];
  const rewritten = [];
  const undocumented = [];
  for (const file of files) {
    const r = await processFile(file, docsByTitle, { dryRun });
    inserted += r.inserted;
    orphans.push(...r.orphans);
    borrowed.push(...r.borrowed);
    discarded.push(...r.discarded);
    rewritten.push(...r.rewritten);
    undocumented.push(...r.undocumented);
    if (r.inserted) {
      process.stdout.write(
        `${r.changed === false ? '=' : dryRun ? '~' : '✓'} ${basename(file)} — ${r.inserted} member doc(s)\n`
      );
    }
  }

  process.stdout.write(
    `\n${inserted} member TSDoc comment(s) ${dryRun ? 'would be ' : ''}written.\n`
  );
  if (discarded.length) {
    process.stdout.write(
      `\n${discarded.length} source comment(s) disagreed with the docs page and ` +
        `were DISCARDED in favour of the page's wording. Review these — where ` +
        `the comment is the newer truth, edit the page and re-run:\n  ` +
        discarded.join('\n  ') +
        '\n'
    );
  }
  if (borrowed.length) {
    process.stdout.write(
      `\n${borrowed.length} description(s) borrowed from the page of the ` +
        `component this interface feeds (check each names the right sub):\n  ` +
        borrowed.join('\n  ') +
        '\n'
    );
  }
  if (rewritten.length) {
    process.stdout.write(
      `\n${rewritten.length} existing member comment(s) replaced by the richer ` +
        `docs description (read these — they ship in the .d.ts):\n  ` +
        rewritten.join('\n  ') +
        '\n'
    );
  }
  if (orphans.length) {
    process.stdout.write(
      `\n${orphans.length} @property line(s) had no matching member and were parked as ` +
        `@extraProp (review these — they may be real drift):\n  ${orphans.join('\n  ')}\n`
    );
  }
  if (undocumented.length) {
    process.stdout.write(
      `\n${undocumented.length} member(s) have NO description anywhere — write TSDoc by hand:\n  ` +
        undocumented.join('\n  ') +
        '\n'
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
