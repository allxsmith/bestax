/**
 * Extract prop tables from the library source with the TypeScript compiler API.
 *
 * Two rules do most of the work here, and both exist to keep the output
 * readable rather than exhaustive:
 *
 * 1. OWN MEMBERS ONLY. Every `<X>Props` interface extends a DOM attribute type
 *    plus `Omit<BulmaClassesProps, …>`. Resolving that type yields ~250 DOM
 *    attributes and ~65 helper props — useless in a docs table. We read
 *    `interface.members` (what the author declared) and summarise the rest in a
 *    single catch-all row, which is exactly what the hand-written pages did.
 *
 * 2. TYPES FROM SOURCE TEXT, NOT THE CHECKER. `checker.typeToString` expands
 *    `(typeof validColors)[number]` into a 19-member union — the unreadable
 *    cells that `hero.md` and `card.md` carry today. Printing the type node's
 *    source text keeps `React.ReactNode` and friends intact. Two controlled
 *    substitutions sit on top: short local string-literal aliases are inlined
 *    (`HeroSize`), and `(typeof validColors)[number]` becomes a link to the
 *    Valid values page.
 *
 * Defaults come from the component's parameter destructuring, which is the only
 * place this library states them (there are no defaultProps anywhere). Computed
 * defaults — `Field.tsx`'s `labelSize ?? (horizontal ? 'normal' : undefined)` —
 * are deliberately out of reach; use an explicit `@defaultValue` TSDoc tag.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const REPO = join(import.meta.dirname, '..', '..');

let ts;
function loadTs() {
  if (ts) return ts;
  try {
    ts = require('typescript');
  } catch {
    throw new Error(
      'typescript could not be resolved. Run `pnpm install --frozen-lockfile` ' +
        'before generating API docs.'
    );
  }
  return ts;
}

// Max rendered length for inlining a local string-literal union alias. Above
// this the alias name is clearer than its expansion.
const ALIAS_INLINE_MAX = 96;

// Type source-text substitutions, applied after alias inlining. `LINK` targets
// are resolved to a page-relative path by the caller.
const TYPE_DISPLAY = [
  {
    from: '(typeof validColors)[number]',
    link: 'helpers/valid-values',
    label: 'Bulma color',
  },
  {
    from: '(typeof validSizes)[number]',
    link: 'helpers/valid-values',
    label: 'Bulma size',
  },
  {
    from: '(typeof validTextSizes)[number]',
    link: 'helpers/valid-values',
    label: 'Bulma text size',
  },
];

// Base types that feed the catch-all row instead of being expanded.
const DOM_ELEMENT_LABELS = {
  HTMLAnchorElement: '`<a>`',
  HTMLButtonElement: '`<button>`',
  HTMLDivElement: '`<div>`',
  HTMLElement: 'HTML',
  HTMLHeadingElement: '`<h1>`–`<h6>`',
  HTMLImageElement: '`<img>`',
  HTMLInputElement: '`<input>`',
  HTMLLIElement: '`<li>`',
  HTMLLabelElement: '`<label>`',
  HTMLOListElement: '`<ol>`',
  HTMLParagraphElement: '`<p>`',
  HTMLSelectElement: '`<select>`',
  HTMLSpanElement: '`<span>`',
  HTMLTableCellElement: '`<td>`/`<th>`',
  HTMLTableElement: '`<table>`',
  HTMLTableRowElement: '`<tr>`',
  HTMLTableSectionElement: '`<thead>`/`<tbody>`',
  HTMLTextAreaElement: '`<textarea>`',
  HTMLUListElement: '`<ul>`',
};

let cachedProgram = null;

/** One Program for the whole run — construction dominates runtime (~3 s). */
export function createProgram() {
  if (cachedProgram) return cachedProgram;
  const ts = loadTs();
  const configPath = join(REPO, 'bulma-ui', 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) {
    throw new Error(`cannot read ${configPath}: ${config.error.messageText}`);
  }
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    join(REPO, 'bulma-ui')
  );
  const program = ts.createProgram(parsed.fileNames, {
    ...parsed.options,
    noEmit: true,
  });
  cachedProgram = { ts, program, checker: program.getTypeChecker() };
  return cachedProgram;
}

/**
 * Public barrel -> exported name -> module path. Reusing the barrel (rather
 * than deriving a path from the docs directory) is what makes the
 * `api/form/datetime/*` pages resolve for free: they carry `title: DateInput`,
 * which the barrel maps to `src/form/DateInput.tsx`.
 */
export function exportedModules() {
  const src = readFileSync(join(REPO, 'bulma-ui', 'src', 'index.ts'), 'utf8');
  const out = new Map();
  for (const line of src.split(/\r?\n/)) {
    let m = line.match(/^export \* from '\.\/([^/]+)\/([^'/]+)'/);
    if (m) {
      out.set(m[2], { cat: m[1], mod: m[2] });
      continue;
    }
    m = line.match(/^export \{ ([^}]+) \} from '\.\/([^/]+)\/([^'/]+)'/);
    if (m) {
      for (const raw of m[1].split(',')) {
        const name = raw
          .trim()
          .split(/\s+as\s+/)
          .pop();
        if (name) out.set(name, { cat: m[2], mod: m[3] });
      }
    }
  }
  return out;
}

function sourceFileFor(program, cat, mod) {
  const want = join(REPO, 'bulma-ui', 'src', cat, `${mod}.tsx`).replace(
    /\\/g,
    '/'
  );
  const wantTs = want.replace(/\.tsx$/, '.ts');
  return program
    .getSourceFiles()
    .find(f => f.fileName === want || f.fileName === wantTs);
}

/** Top-level `const <name> = <init>` initializers in a file. */
function topLevelInitializers(ts, sf) {
  const out = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) {
        out.set(decl.name.text, decl.initializer);
      }
    }
  }
  return out;
}

function isWithSubComponents(ts, node) {
  return (
    node &&
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'withSubComponents'
  );
}

/**
 * The props interface name for a component identifier, read off its
 * declaration's type annotation (`React.FC<HeroProps>`, `forwardRef<T, XProps>`)
 * rather than derived from the name — `Hero`'s implementation is `HeroComponent`
 * but its props are `HeroProps`.
 */
function propsInterfaceName(ts, inits, name) {
  const init = inits.get(name);
  if (!init) return null;

  // forwardRef<TRef, XProps>((props, ref) => …)
  if (ts.isCallExpression(init) && init.typeArguments?.length >= 2) {
    const expr = init.expression;
    const text = ts.isPropertyAccessExpression(expr)
      ? expr.name.text
      : expr.getText?.();
    if (text === 'forwardRef') return init.typeArguments[1].getText();
  }
  // const X: React.FC<XProps> = …
  const decl = init.parent;
  if (decl?.type) {
    const t = decl.type;
    if (ts.isTypeReferenceNode(t) && t.typeArguments?.length === 1) {
      return t.typeArguments[0].getText();
    }
  }
  return null;
}

/** The arrow/function whose first parameter destructures the props. */
function componentFunction(ts, init) {
  if (!init) return null;
  if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init;
  if (ts.isCallExpression(init)) {
    const first = init.arguments[0];
    if (
      first &&
      (ts.isArrowFunction(first) || ts.isFunctionExpression(first))
    ) {
      return first;
    }
  }
  return null;
}

/** Destructuring defaults: prop name -> printed initializer. */
function destructuredDefaults(ts, fn) {
  const out = new Map();
  const param = fn?.parameters?.[0];
  if (!param || !ts.isObjectBindingPattern(param.name)) return out;
  for (const el of param.name.elements) {
    if (el.dotDotDotToken) continue;
    const key = (el.propertyName ?? el.name).getText();
    if (el.initializer) out.set(key, el.initializer.getText());
  }
  return out;
}

function jsdocText(ts, node) {
  const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  for (const doc of docs) {
    const text = ts.getTextOfJSDocComment(doc.comment);
    if (text) return text.replace(/\s+/g, ' ').trim();
  }
  return '';
}

function jsdocTag(ts, node, tagName) {
  for (const tag of ts.getJSDocTags(node)) {
    if (tag.tagName.text === tagName) {
      const text = ts.getTextOfJSDocComment(tag.comment);
      if (text) return text.replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}

/** Local `type X = 'a' | 'b'` aliases, for inlining short unions. */
function localStringUnionAliases(ts, sf) {
  const out = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isTypeAliasDeclaration(stmt)) continue;
    const t = stmt.type;
    if (!ts.isUnionTypeNode(t)) continue;
    const allLiterals = t.types.every(
      n => ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal)
    );
    if (!allLiterals) continue;
    const rendered = t.types.map(n => n.getText()).join(' | ');
    if (rendered.length <= ALIAS_INLINE_MAX) out.set(stmt.name.text, rendered);
  }
  return out;
}

/**
 * Split a type's source text on its TOP-LEVEL union pipes, so pipes nested in
 * generics or object types (`Record<string, A | B>`) stay with their member.
 */
function splitUnion(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '<' || ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === '>' || ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === '|' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map(p => p.trim()).filter(Boolean);
}

function renderTypeText(ts, member, aliases, linkBase) {
  let text = member.type ? member.type.getText() : 'unknown';
  text = text.replace(/\s+/g, ' ').trim();

  // Inline a bare local alias reference: `HeroSize` -> its literal union.
  if (aliases.has(text)) text = aliases.get(text);

  // Render each union member separately. Working per-member (rather than doing
  // string surgery on the whole type) is what lets a TYPE_DISPLAY label contain
  // spaces — "Bulma color" — without the renderer having to tokenise prose.
  //
  // Pipes are emitted RAW: escapeCell() owns table escaping, and escaping in
  // both places yields a stray backslash that ends the escape and splits the
  // cell into extra columns.
  return splitUnion(text)
    .map(member => {
      const display = TYPE_DISPLAY.find(d => d.from === member);
      if (display) return `[${display.label}](${linkBase}${display.link}.md)`;
      return `\`${member}\``;
    })
    .join(' | ');
}

/**
 * Heritage bases split into ones we expand (locally declared interfaces, e.g.
 * the module-private `SliderBaseProps`) and ones that become the catch-all row.
 */
function classifyHeritage(ts, checker, decl) {
  const expand = [];
  const external = [];
  for (const clause of decl.heritageClauses ?? []) {
    for (const typeNode of clause.types) {
      const text = typeNode.getText();
      if (/BulmaClassesProps/.test(text)) {
        external.push({ kind: 'helpers' });
        continue;
      }
      const sym = checker.getSymbolAtLocation(
        ts.isIdentifier(typeNode.expression) ? typeNode.expression : typeNode
      );
      const target = sym?.declarations?.find(d => ts.isInterfaceDeclaration(d));
      const inRepo = target
        ?.getSourceFile()
        .fileName.includes('/bulma-ui/src/');
      if (target && inRepo) expand.push(target);
      else external.push({ kind: 'dom', text });
    }
  }
  return { expand, external };
}

function catchAllRow(external) {
  const elements = new Set();
  let helpers = false;
  for (const e of external) {
    if (e.kind === 'helpers') {
      helpers = true;
      continue;
    }
    const m = e.text.match(/HTML\w*Element/);
    if (m) elements.add(DOM_ELEMENT_LABELS[m[0]] ?? 'HTML');
  }
  const parts = [];
  if (elements.size) {
    parts.push(`All standard ${[...elements].sort().join(' / ')} attributes`);
  }
  if (helpers) parts.push('Bulma helper props');
  if (!parts.length) return null;
  return parts.join(' and ');
}

function memberRows(ts, decl, aliases, defaults, linkBase, inherited = false) {
  const rows = [];
  for (const member of decl.members) {
    if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member))
      continue;
    const name = member.name.getText().replace(/^['"]|['"]$/g, '');
    const explicit = jsdocTag(ts, member, 'defaultValue');
    // An optional prop typed exactly `boolean` with no destructuring default is
    // `undefined`, which every consumer treats as off — the hand-written tables
    // documented these as `false`, and dropping to `—` would lose real
    // information on every boolean flag in the library. Safe because nothing in
    // src/ defaults a boolean to true outside the destructuring pattern (an
    // explicit default or `@defaultValue` still wins).
    const impliedFalse =
      member.questionToken && member.type?.kind === ts.SyntaxKind.BooleanKeyword
        ? 'false'
        : null;
    // `@deprecated` must reach the table. The hand-written pages led these rows
    // with "**Deprecated.** Use `gapMobile` instead."; reading only the comment
    // text would quietly drop the one thing a reader most needs to see.
    const deprecated = ts
      .getJSDocTags(member)
      .find(t => t.tagName.text === 'deprecated');
    const note = deprecated
      ? `**Deprecated.** ${(ts.getTextOfJSDocComment(deprecated.comment) ?? '')
          .replace(/\s+/g, ' ')
          .trim()}`.trim()
      : '';
    rows.push({
      name,
      type: renderTypeText(ts, member, aliases, linkBase),
      default: explicit ?? defaults.get(name) ?? impliedFalse,
      description: [note, jsdocText(ts, member)].filter(Boolean).join(' '),
      inherited,
      node: member,
    });
  }
  return rows;
}

/**
 * The Bulma root class a component renders, read from its first
 * `usePrefixedClassNames('<literal>')` call. This is what maps a component to
 * its root selector in the SCSS (`.#{iv.$class-prefix}hero`), so the CSS
 * variable table never needs a hand-maintained selector.
 */
function rootClassCandidates(ts, sf) {
  const out = [];
  const walk = node => {
    if (
      ts.isCallExpression(node) &&
      /usePrefixedClassNames$/.test(node.expression.getText()) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      // `usePrefixedClassNames('', {…})` means "no root class, modifiers only"
      // (Td/Th/Tr colour their cell without a Bulma block class).
      const text = node.arguments[0].text;
      if (text && !out.includes(text)) out.push(text);
    }
    ts.forEachChild(node, walk);
  };
  if (sf) walk(sf);
  return out;
}

const kebab = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Components whose root class cannot be derived from their name.
 *
 * Each was checked against the component source. Keep this list short: it
 * exists because a wrong root class is silent, so anything the name rule
 * cannot decide is stated explicitly rather than guessed.
 */
const ROOT_CLASS_OVERRIDES = {
  Checkbox: 'styled-checkbox', // renders a styled span, not `.checkbox`
  Radio: 'styled-radio',
  Taginput: 'taginput', // builds its root class via classNames(), not the hook
  Skeleton: 'skeleton-lines', // `.skeleton-lines` / `.skeleton-block` variants
  DateInputBase: 'input', // the trigger is an `.input`
  TimeInputBase: 'input',
  DateTimeInputBase: 'input',
};

/**
 * The Bulma root class a component renders.
 *
 * Taking the FIRST `usePrefixedClassNames` literal is wrong: components that
 * render more than one prefixed element hit the wrong one (`Input` and `Select`
 * would resolve to `help`, `Toast` to `toast-container`). Match the component's
 * own name against its candidates instead, and return null when no candidate is
 * a confident match — callers treat null as "needs an explicit override" rather
 * than guessing, because a wrong root class silently attaches the wrong CSS
 * variables to a page.
 */
function pickRootClass(name, candidates) {
  if (!candidates.length) return null;
  const bare = name.replace(/Base$/, '');
  for (const want of [
    name.toLowerCase(),
    kebab(name),
    bare.toLowerCase(),
    kebab(bare),
  ]) {
    if (candidates.includes(want)) return want;
  }
  return null;
}

/**
 * Extract everything an API page needs for one component.
 *
 * @param {string} name    Exported component name (the page's frontmatter title).
 * @param {object} [opts]
 * @param {number} [opts.depth] Page depth below docs/docs/api, for relative links.
 * @returns {{name, tsdoc, rootClass, tables: [{path, rows, catchAll, extraProps}]}}
 */
export function extractComponent(name, { depth = 1, _depth = 0 } = {}) {
  const { ts, program, checker } = createProgram();
  const mods = exportedModules();
  const entry = mods.get(name);
  if (!entry) {
    throw new Error(
      `${name} is not exported from bulma-ui/src/index.ts — the API page's ` +
        `frontmatter title: must match an exported name.`
    );
  }
  const sf = sourceFileFor(program, entry.cat, entry.mod);
  if (!sf) throw new Error(`no source file for ${entry.cat}/${entry.mod}`);

  const inits = topLevelInitializers(ts, sf);
  const aliases = localStringUnionAliases(ts, sf);
  const interfaces = new Map();
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt)) interfaces.set(stmt.name.text, stmt);
  }
  const linkBase = '../'.repeat(depth);

  // Resolve the root implementation and the compound sub-component tree.
  const rootInit = inits.get(name);
  const paths = [];
  const visit = (implName, dotPath) => {
    const init = inits.get(implName);
    if (isWithSubComponents(ts, init)) {
      const base = init.arguments[0];
      const subs = init.arguments[1];
      if (ts.isIdentifier(base)) visit(base.text, dotPath);
      if (subs && ts.isObjectLiteralExpression(subs)) {
        for (const prop of subs.properties) {
          const key = prop.name?.getText();
          const value = ts.isShorthandPropertyAssignment(prop)
            ? prop.name.text
            : prop.initializer && ts.isIdentifier(prop.initializer)
              ? prop.initializer.text
              : null;
          if (key && value) visit(value, `${dotPath}.${key}`);
        }
      }
      return;
    }
    paths.push({ path: dotPath, impl: implName });
  };
  if (isWithSubComponents(ts, rootInit)) visit(name, name);
  else paths.push({ path: name, impl: name });

  const tables = [];
  for (const { path, impl } of paths) {
    const ifaceName = propsInterfaceName(ts, inits, impl);
    const decl = ifaceName && interfaces.get(ifaceName);
    if (!decl) continue;

    const defaults = destructuredDefaults(
      ts,
      componentFunction(ts, inits.get(impl))
    );
    const { expand, external } = classifyHeritage(ts, checker, decl);
    const rows = memberRows(ts, decl, aliases, defaults, linkBase);
    for (const base of expand) {
      const baseAliases = localStringUnionAliases(ts, base.getSourceFile());
      rows.push(
        ...memberRows(
          ts,
          base,
          new Map([...aliases, ...baseAliases]),
          defaults,
          linkBase,
          true
        )
      );
    }
    // `@extraProp {Type} [name] - desc` documents a notable inherited prop that
    // has no own member (the codemod parks unmatched @property lines here).
    const extraProps = [];
    for (const tag of ts.getJSDocTags(decl)) {
      if (tag.tagName.text !== 'extraProp') continue;
      const raw = ts.getTextOfJSDocComment(tag.comment) ?? '';
      const m = raw.match(
        /^(?:\{([^}]+)\}\s*)?\[?([\w'"-]+)\]?\s*-\s*([\s\S]+)$/
      );
      if (m) {
        extraProps.push({
          name: m[2].replace(/^['"]|['"]$/g, ''),
          type: m[1] ? `\`${m[1]}\`` : '',
          description: m[3].replace(/\s+/g, ' ').trim(),
        });
      }
    }

    tables.push({
      path,
      interfaceName: ifaceName,
      rows,
      extraProps,
      catchAll: catchAllRow(external),
      helpersLink: `${linkBase}helpers/usebulmaclasses.md`,
    });
  }

  // Component-level TSDoc summary, for the generated Overview sentence.
  const rootImpl = paths[0]?.impl ?? name;
  const rootInitNode = inits.get(rootImpl);
  const rootDecl = rootInitNode?.parent;
  const tsdoc = rootDecl ? jsdocText(ts, rootDecl) : '';
  const candidates = rootClassCandidates(ts, sf);
  let rootClass = ROOT_CLASS_OVERRIDES[name] ?? pickRootClass(name, candidates);

  // Convenience wrappers (Input, Select, TextArea, the datetime trio) render a
  // `<XBase>` rather than a prefixed element of their own, so the class that
  // carries their CSS variables lives in the base module. The docs page is the
  // wrapper's, so resolve through. `_depth` stops a Base-of-a-Base chain.
  if (!rootClass && _depth === 0 && mods.has(`${name}Base`)) {
    rootClass = extractComponent(`${name}Base`, { depth, _depth: 1 }).rootClass;
  }

  return {
    name,
    tsdoc,
    rootClass,
    rootClassCandidates: candidates,
    tables,
    sourceFile: sf.fileName,
  };
}
