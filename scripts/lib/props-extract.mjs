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

// React props inherited by every component that the hand-written tables named
// explicitly rather than leaving to the catch-all row. Tuples of
// [name, type, description].
const DOM_COMMON_PROPS = [
  ['className', 'string', 'Additional CSS classes.'],
  ['children', 'React.ReactNode', 'Content rendered inside the component.'],
  ['ref', 'React.Ref', 'Forwarded to the underlying element.'],
];

// Base types that feed the catch-all row instead of being expanded.
const DOM_ELEMENT_LABELS = {
  HTMLAnchorElement: '`<a>`',
  HTMLButtonElement: '`<button>`',
  HTMLDivElement: '`<div>`',
  HTMLElement: 'HTML',
  HTMLHRElement: '`<hr>`',
  HTMLHeadingElement: '`<h1>`–`<h6>`',
  HTMLImageElement: '`<img>`',
  HTMLInputElement: '`<input>`',
  HTMLLIElement: '`<li>`',
  HTMLLabelElement: '`<label>`',
  HTMLOListElement: '`<ol>`',
  HTMLParagraphElement: '`<p>`',
  HTMLPreElement: '`<pre>`',
  HTMLProgressElement: '`<progress>`',
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
  if (!fn) return out;
  const collect = pattern => {
    for (const el of pattern.elements) {
      if (el.dotDotDotToken) continue;
      const key = (el.propertyName ?? el.name).getText();
      if (el.initializer && !out.has(key)) {
        out.set(key, el.initializer.getText());
      }
    }
  };

  const param = fn.parameters?.[0];
  if (param && ts.isObjectBindingPattern(param.name)) collect(param.name);

  // Components that need to narrow before destructuring take `props` whole and
  // unpack it in the body (`Slider`, `TimeInputBase`, the datetime family).
  // Reading only the parameter loses every default they state — `editable`
  // then reads as `false` on timeinput.md when the source says `true`.
  for (const stmt of fn.body && ts.isBlock(fn.body) ? fn.body.statements : []) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isObjectBindingPattern(decl.name)) collect(decl.name);
    }
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
    const rendered = unionExpansion(ts, stmt);
    if (rendered && rendered.length <= ALIAS_INLINE_MAX) {
      out.set(stmt.name.text, rendered);
    }
  }
  return out;
}

/**
 * A type alias rendered as its union of simple members, or null when it aliases
 * something that would not read as a list (an object type, a generic, another
 * alias chain). Numbers count: `BulmaGapValue` is `0 | … | 8 | '0' | … | '8'`,
 * and restricting this to string literals is what made columns.md's `gap` cell
 * regress from "number | string (0-8)" to a bare alias name.
 */
function unionExpansion(ts, decl, resolve = () => null) {
  const t = decl.type;
  const isSimple = n =>
    ts.isLiteralTypeNode(n) ||
    n.kind === ts.SyntaxKind.NumberKeyword ||
    n.kind === ts.SyntaxKind.StringKeyword ||
    n.kind === ts.SyntaxKind.BooleanKeyword;
  // `(typeof validSubTitleSizes)[number]` — the dominant shape in this repo.
  // Reading it off the `as const` array is what lets `SubTitleSize` inline as
  // `'1' | … | '6'` instead of leaving a bare name where the page listed six
  // literals. `TYPE_DISPLAY` still intercepts the huge shared arrays first.
  if (t && ts.isIndexedAccessTypeNode(t)) {
    const m = t.getText().match(/^\(typeof (\w+)\)\[number\]$/);
    const arr =
      m &&
      decl
        .getSourceFile()
        .statements.flatMap(st =>
          ts.isVariableStatement(st) ? st.declarationList.declarations : []
        )
        .find(d => d.name.getText() === m[1])?.initializer;
    const literals =
      arr &&
      ts.isAsExpression(arr) &&
      ts.isArrayLiteralExpression(arr.expression)
        ? arr.expression.elements
        : null;
    if (literals?.length && literals.every(e => ts.isStringLiteral(e))) {
      return literals.map(e => e.getText()).join(' | ');
    }
    return null;
  }
  // A one-member "union": `export type CellSpanValue = number`. Not a union
  // node at all, so the check below never saw it and cell.md rendered
  // `colSpan`/`rowSpan` as a bare `CellSpanValue` — strictly less than the
  // `number` the hand-written table said.
  if (t && isSimple(t)) return t.getText();

  const nodes = t && ts.isUnionTypeNode(t) ? t.types : null;
  if (!nodes) return null;
  // Members may be other aliases: `BulmaFixedGridColsProp = BulmaFixedGridCols
  // | 'auto'`. Requiring every member to be simple left grid.md's primary
  // `fixedCols` opaque while its five per-breakpoint siblings — typed with the
  // inner alias directly — expanded to `0 | … | 12` in the same table.
  const parts = nodes.map(n => {
    if (isSimple(n)) return n.getText();
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName)) {
      return resolve(n.typeName.text);
    }
    // A member naming a type we cannot expand — `Intl.DateTimeFormatOptions`
    // is a qualified name, not an identifier we index. Its own source text is
    // what the reader wants: `DateFormatOption` had regressed the three
    // datetime pages from main's `string | Intl.DateTimeFormatOptions` to a
    // bare alias that isn't even exported from the barrel.
    if (ts.isTypeReferenceNode(n)) return n.getText();
    return null;
  });
  if (parts.some(p => !p)) return null;
  return parts.join(' | ');
}

/**
 * Every type alias in the program that a props table might name, keyed by name.
 * Cross-module by design: `BulmaGapValue` is declared in `grid/Grid.tsx` and
 * used by `columns/Columns.tsx`, so a same-file-only index leaves it as a bare
 * name on columns.md — strictly less than the prose it replaced.
 */
let aliasIndex = null;
function allAliases(ts, program) {
  if (aliasIndex) return aliasIndex;
  aliasIndex = new Map();
  const indirect = new Map(); // alias -> alias it forwards to
  const mixed = new Map(); // alias -> decl, unions naming other aliases
  for (const sf of program.getSourceFiles()) {
    if (!sf.fileName.includes('/bulma-ui/src/')) continue;
    for (const stmt of sf.statements) {
      if (!ts.isTypeAliasDeclaration(stmt)) continue;
      const name = stmt.name.text;
      if (aliasIndex.has(name) || indirect.has(name)) continue;
      const expansion = unionExpansion(ts, stmt);
      if (expansion) {
        aliasIndex.set(name, { expansion, summary: jsdocText(ts, stmt) });
      } else if (stmt.type && ts.isUnionTypeNode(stmt.type)) {
        // Deferred: a member names an alias this pass may not have reached yet.
        // Resolved to a fixpoint below, once every directly-expandable alias
        // is in the index.
        mixed.set(name, stmt);
      } else if (
        ts.isTypeReferenceNode(stmt.type) &&
        ts.isIdentifier(stmt.type.typeName)
      ) {
        // `export type BulmaGapSize = BulmaGapValue` — a rename, not a new
        // type. Without following it, columns.md's six `gapSize*` props show a
        // name with no definition anywhere on the page.
        indirect.set(name, {
          to: stmt.type.typeName.text,
          summary: jsdocText(ts, stmt),
        });
      }
    }
  }
  // Fixpoint: each round can only widen the index, so it converges. Bounded so
  // a mutually-recursive pair can never spin.
  const resolve = n => aliasIndex.get(n)?.expansion ?? null;
  for (let round = 0; round < 8 && mixed.size; round += 1) {
    let progressed = false;
    for (const [name, stmt] of mixed) {
      const expansion = unionExpansion(ts, stmt, resolve);
      if (!expansion) continue;
      aliasIndex.set(name, { expansion, summary: jsdocText(ts, stmt) });
      mixed.delete(name);
      progressed = true;
    }
    if (!progressed) break;
  }

  for (const [name, { to, summary }] of indirect) {
    const target = aliasIndex.get(to);
    if (!target) continue;
    // Keep BOTH summaries. The rename usually restates the purpose in the
    // consumer's terms ("Possible values for the Bulma columns gap size")
    // while the target explains the values ("0-8 spacing scale… as a number or
    // a numeric string"); either alone loses half of what the old cell said.
    aliasIndex.set(name, {
      expansion: target.expansion,
      summary: [summary, target.summary].filter(Boolean).join(' '),
    });
  }
  return aliasIndex;
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

/**
 * Source text of `<Interface>['<prop>']`, for lookup types. Indexed lazily over
 * the whole program because the interface usually lives in another module.
 */
let interfaceMemberIndex = null;
function lookupMemberType(ts, ifaceName, propName) {
  if (!interfaceMemberIndex) {
    const { program } = createProgram();
    interfaceMemberIndex = new Map();
    for (const sf of program.getSourceFiles()) {
      if (!sf.fileName.includes('/bulma-ui/src/')) continue;
      for (const stmt of sf.statements) {
        if (!ts.isInterfaceDeclaration(stmt)) continue;
        if (interfaceMemberIndex.has(stmt.name.text)) continue;
        interfaceMemberIndex.set(stmt.name.text, stmt);
      }
    }
  }
  const decl = interfaceMemberIndex.get(ifaceName);
  const member = decl?.members.find(
    m => m.name?.getText().replace(/^['"]|['"]$/g, '') === propName
  );
  return member?.type
    ? member.type.getText().replace(/\s+/g, ' ').trim()
    : null;
}

/** `['a', 'b'] as const` -> `'a' | 'b'`, for `(typeof arr)[number]`. */
function typeofArrayExpansion(ts, sf, arrayName) {
  const decl = sf.statements
    .flatMap(st =>
      ts.isVariableStatement(st) ? st.declarationList.declarations : []
    )
    .find(d => d.name.getText() === arrayName);
  const init = decl?.initializer;
  const elements =
    init &&
    ts.isAsExpression(init) &&
    ts.isArrayLiteralExpression(init.expression)
      ? init.expression.elements
      : null;
  if (!elements?.length || !elements.every(e => ts.isStringLiteral(e)))
    return null;
  return elements.map(e => e.getText()).join(' | ');
}

function renderTypeText(ts, member, aliases, linkBase, used) {
  let text = member.type ? member.type.getText() : 'unknown';
  text = text.replace(/\s+/g, ' ').trim();

  // Inline alias references PER UNION MEMBER, not just when the whole type is
  // one alias: `AvatarSize | number` would otherwise leave `AvatarSize` bare
  // where avatar.md listed all seven presets.
  const sf = member.getSourceFile();
  const expandPart = part => {
    // An INLINE `(typeof checkboxColors)[number]`. The named-alias path above
    // only sees these when someone bothered to name the type; several
    // interfaces use the indexed access directly, and the pages listed the
    // literals. TYPE_DISPLAY still intercepts the three big shared arrays.
    const idx = part.match(/^\(typeof (\w+)\)\[number\]$/);
    if (idx) {
      const expanded = typeofArrayExpansion(ts, sf, idx[1]);
      if (expanded && expanded.length <= ALIAS_INLINE_MAX) {
        return splitUnion(expanded);
      }
      return null;
    }
    // `AvatarProps['size']` — a lookup type, used by wrappers that mirror a
    // prop of the component they wrap. avatars.md listed the seven size
    // literals; leaving the lookup unexpanded shows the reader nothing.
    const lookup = part.match(/^(\w+)\[['"](\w+)['"]\]$/);
    if (!lookup) return null;
    const member = lookupMemberType(ts, lookup[1], lookup[2]);
    return member ? splitUnion(member) : null;
  };

  const parts = splitUnion(text).flatMap(part => {
    if (aliases.has(part)) return splitUnion(aliases.get(part));
    const looked = expandPart(part);
    if (looked) {
      return looked.flatMap(p =>
        aliases.has(p) ? splitUnion(aliases.get(p)) : [p]
      );
    }
    // Too long to inline. Keep the name, and record it so the page can define
    // it once in a footnote under the table — a reader who meets
    // `BulmaGapValue` in a cell otherwise has an identifier and nowhere to
    // look it up.
    if (used) used.add(part.replace(/\[\]$/, ''));
    return [part];
  });

  // Normalise what merging the members of a union PROPS TYPE throws up.
  // `SliderProps` is `SliderSingleProps | SliderRangeProps`, and the branch
  // that forbids a prop types it `never` — so `minDistance` merged to
  // `never | number` and `range` to `false | true`, neither of which means
  // anything to a reader of a props table.
  const seen = new Set();
  let members = parts.filter(p => !seen.has(p) && seen.add(p));
  if (members.length > 1) members = members.filter(p => p !== 'never');
  if (
    members.length === 2 &&
    members.includes('false') &&
    members.includes('true')
  ) {
    members = ['boolean'];
  }

  // Render each union member separately. Working per-member (rather than doing
  // string surgery on the whole type) is what lets a TYPE_DISPLAY label contain
  // spaces — "Bulma color" — without the renderer having to tokenise prose.
  //
  // Pipes are emitted RAW: escapeCell() owns table escaping, and escaping in
  // both places yields a stray backslash that ends the escape and splits the
  // cell into extra columns.
  return members
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
/**
 * Resolve a type reference to the interface it names.
 *
 * An IMPORTED interface arrives as an alias symbol whose `declarations` are the
 * import specifier, not the interface — so a plain `declarations.find(isInterface)`
 * silently misses every cross-module base. `DateInputProps extends
 * DateInputBaseProps` lost all 38 of its inherited props that way.
 */
function resolveInterface(ts, checker, node) {
  // Heritage clauses give an ExpressionWithTypeArguments (`.expression`), but an
  // Omit/Pick type argument is a TypeReferenceNode (`.typeName`). Reading only
  // `.expression` silently resolved nothing for the latter.
  const target = ts.isIdentifier(node)
    ? node
    : ts.isTypeReferenceNode(node)
      ? node.typeName
      : (node.expression ?? node);
  let sym = checker.getSymbolAtLocation(target);
  if (sym && sym.flags & ts.SymbolFlags.Alias) {
    try {
      sym = checker.getAliasedSymbol(sym);
    } catch {
      /* not an alias after all */
    }
  }
  const decl = sym?.declarations?.find(
    d => ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d)
  );
  if (!decl) return null;
  return decl.getSourceFile().fileName.includes('/bulma-ui/src/') ? decl : null;
}

/** String-literal keys of an `Omit<T, K>` / `Pick<T, K>` second argument. */
function literalKeys(ts, node) {
  if (!node) return [];
  const nodes = ts.isUnionTypeNode(node) ? node.types : [node];
  return nodes
    .filter(n => ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal))
    .map(n => n.literal.text);
}

/**
 * Heritage split into bases we expand and bases that feed the catch-all row.
 *
 * `Omit<T, K>` and `Pick<T, K>` are unwrapped: without this, `LinkButtonProps
 * extends Omit<ButtonProps, 'color' | …>` resolves the symbol of `Omit` — a lib
 * type — so all of ButtonProps vanished into the catch-all. React's attribute
 * types and BulmaClassesProps stay in the catch-all deliberately; they are the
 * ~250 DOM props the hand-written tables never enumerated either.
 */
function classifyTypeNode(ts, checker, node, out, _seen) {
  if (!node) return;
  if (ts.isParenthesizedTypeNode(node)) {
    classifyTypeNode(ts, checker, node.type, out, _seen);
    return;
  }
  // `A | B` and `A & B` both contribute every prop they mention. A docs table
  // is a catalogue, not a type — `SliderProps = SliderSingleProps |
  // SliderRangeProps` documents the props of both modes, which is exactly what
  // slider.md wrote by hand.
  if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
    for (const t of node.types) classifyTypeNode(ts, checker, t, out, _seen);
    return;
  }
  // An inline `{ as?: 'div' }` in an intersection — real props with nowhere
  // else to live. ControlProps declares `as` and `ref` this way.
  if (ts.isTypeLiteralNode(node)) {
    out.literals.push(node);
    return;
  }

  const text = node.getText();
  if (/BulmaClassesProps/.test(text)) {
    out.external.push({ kind: 'helpers' });
    return;
  }

  // Omit<T, K> / Pick<T, K> — expand T, then filter its members by K.
  const ref = ts.isTypeReferenceNode(node)
    ? node.typeName
    : (node.expression ?? null);
  const name = ref && ts.isIdentifier(ref) ? ref.text : null;
  if ((name === 'Omit' || name === 'Pick') && node.typeArguments?.length >= 1) {
    const inner = resolveInterface(ts, checker, node.typeArguments[0]);
    const keys = literalKeys(ts, node.typeArguments[1]);
    if (inner) {
      // `keyof React.HTMLAttributes<…>` yields no literal keys; an empty Omit
      // list keeps everything, which is the right reading — the members it
      // removes are DOM attributes the catch-all row covers anyway.
      const filter =
        name === 'Omit' ? n => !keys.includes(n) : n => keys.includes(n);
      pushExpand(ts, checker, inner, filter, out, _seen);
      return;
    }
    // Not a repo type (Omit of a DOM type) — summarise it instead.
    out.external.push({ kind: 'dom', text });
    return;
  }

  const target = resolveInterface(ts, checker, node);
  if (target) pushExpand(ts, checker, target, () => true, out, _seen);
  else out.external.push({ kind: 'dom', text });
}

/**
 * Queue an interface for expansion. A type ALIAS has no members of its own, so
 * it is dissolved into whatever it aliases, carrying the caller's filter down.
 */
function pushExpand(ts, checker, decl, filter, out, _seen) {
  if (ts.isTypeAliasDeclaration(decl)) {
    if (_seen.has(decl)) return;
    _seen.add(decl);
    const inner = { expand: [], external: [], literals: [] };
    classifyTypeNode(ts, checker, decl.type, inner, _seen);
    out.external.push(...inner.external);
    out.literals.push(...inner.literals);
    for (const e of inner.expand) {
      out.expand.push({ decl: e.decl, filter: n => filter(n) && e.filter(n) });
    }
    return;
  }
  if (_seen.has(decl)) return;
  _seen.add(decl);
  out.expand.push({ decl, filter });
}

/**
 * Bases split into the repo-local ones we expand, the external ones that feed
 * the catch-all row, and inline type literals whose members are props in their
 * own right.
 *
 * `Omit<T, K>` and `Pick<T, K>` are unwrapped: without this, `LinkButtonProps
 * extends Omit<ButtonProps, 'color' | …>` resolves the symbol of `Omit` — a lib
 * type — so all of ButtonProps vanished into the catch-all. React's attribute
 * types and BulmaClassesProps stay in the catch-all deliberately; they are the
 * ~250 DOM props the hand-written tables never enumerated either.
 *
 * `decl` may be an interface OR a type alias: `ControlProps` and `SliderProps`
 * are unions, and treating a props type as necessarily an interface rendered
 * both pages with no table at all.
 */
function classifyHeritage(ts, checker, decl, _seen = new Set()) {
  const out = { expand: [], external: [], literals: [] };
  if (ts.isTypeAliasDeclaration(decl)) {
    classifyTypeNode(ts, checker, decl.type, out, _seen);
  } else {
    for (const clause of decl.heritageClauses ?? []) {
      for (const typeNode of clause.types) {
        classifyTypeNode(ts, checker, typeNode, out, _seen);
      }
    }
  }
  return { ...out, seen: _seen };
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
  // `helpers` records whether BulmaClassesProps is actually in the heritage —
  // a component like Skeleton that only inherits DOM attributes has nowhere
  // to send a "See Helper Props" link, and pointing there anyway describes
  // props the component doesn't accept.
  return { text: parts.join(' and '), helpers };
}

/**
 * Destructuring defaults of whatever component implements an interface, found
 * in the interface's own module. Needed because a thin wrapper (`TimeInput` ->
 * `TimeInputBase`) declares none of the defaults it documents.
 */
const interfaceDefaultsCache = new Map();
function defaultsForInterface(ts, decl) {
  if (interfaceDefaultsCache.has(decl)) return interfaceDefaultsCache.get(decl);
  const sf = decl.getSourceFile();
  const inits = topLevelInitializers(ts, sf);
  let found = new Map();
  for (const [name, init] of inits) {
    if (propsInterfaceName(ts, inits, name) !== decl.name.text) continue;
    const fn = componentFunction(ts, init);
    if (!fn) continue;
    found = destructuredDefaults(ts, fn);
    break;
  }
  interfaceDefaultsCache.set(decl, found);
  return found;
}

function memberRows(
  ts,
  decl,
  aliases,
  defaults,
  linkBase,
  inherited = false,
  used = null
) {
  const rows = [];
  for (const member of decl.members ?? []) {
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
      type: renderTypeText(ts, member, aliases, linkBase, used),
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
/**
 * The CSS-variable FAMILY a component owns, when it differs from its root class.
 *
 * These are two different questions. The root class is what the component
 * renders (`.skeleton-lines`); the variable family is what Bulma names its
 * variables after (`--bulma-skeleton-*`). They usually coincide, and where they
 * do this map stays out of the way.
 *
 * The semantic wrappers have no Bulma class at all — `Code` renders a bare
 * `<code>` — so without an entry here they can never find the variables that
 * `base/generic.scss` very much does define for them.
 */
const VAR_PREFIX_OVERRIDES = {
  Skeleton: 'skeleton', // root class is the `.skeleton-lines` variant
  Code: 'code', // bare <code>, styled by base/generic.scss
  Pre: 'pre',
  Strong: 'strong',
};

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
 * @returns {{name, tsdoc, rootClass, varPrefix, tables: [{path, rows, catchAll: {text, helpers}|null, extraProps}]}}
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
  // Short aliases inline wherever they are declared: `Avatars` types `shape` as
  // `AvatarShape`, declared in Avatar.tsx, and a same-file-only map left it as
  // a bare name where avatars.md listed the three literals.
  const aliases = new Map([
    ...[...allAliases(ts, program)]
      .filter(([, a]) => a.expansion.length <= ALIAS_INLINE_MAX)
      .map(([n, a]) => [n, a.expansion]),
    ...localStringUnionAliases(ts, sf),
  ]);
  const interfaces = new Map();
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) {
      interfaces.set(stmt.name.text, stmt);
    }
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
    if (!decl) {
      // A sub-component declared in ANOTHER module — Table attaches Thead/Tbody/
      // Tfoot/Tr/Th/Td by importing them. There is no local initializer to read,
      // so resolve the sub through the barrel and reuse its own root table.
      // Without this, Table rendered no sub-tables at all and the six cell
      // components' props vanished from the page.
      if (_depth === 0 && impl !== name && mods.has(impl)) {
        const sub = extractComponent(impl, { depth, _depth: 1 });
        const rootTable = sub.tables[0];
        // `component` names the standalone export. Where that export has an API
        // page of its own (`Columns.Column` -> column.md) the generator links to
        // it instead of restating 25 rows; `Table.Thead` and friends have no
        // page, so their table only exists here.
        if (rootTable) {
          tables.push({
            ...rootTable,
            path,
            impl,
            component: impl,
            summary: sub.tsdoc,
          });
        }
      } else if (inits.get(impl)) {
        // A sub whose props are an inline DOM type rather than a named
        // `*Props` interface — `NavbarDivider: React.FC<
        // React.HTMLAttributes<HTMLHRElement>>`. There is no table to render,
        // but dropping it outright left `Navbar.Divider` and
        // `Pagination.Ellipsis` off the Subcomponents list entirely, which is
        // why both pages still carried a hand-written duplicate of it.
        tables.push({
          path,
          impl,
          rows: [],
          listOnly: true,
          summary: jsdocText(ts, inits.get(impl)),
        });
      }
      continue;
    }

    const defaults = destructuredDefaults(
      ts,
      componentFunction(ts, inits.get(impl))
    );
    const implInit = inits.get(impl);
    const isForwardRef =
      implInit &&
      ts.isCallExpression(implInit) &&
      /forwardRef$/.test(implInit.expression.getText());
    const { expand, external, seen, literals } = classifyHeritage(
      ts,
      checker,
      decl
    );
    const used = new Set();
    const rows = memberRows(ts, decl, aliases, defaults, linkBase, false, used);
    for (const lit of literals) {
      rows.push(
        ...memberRows(ts, lit, aliases, defaults, linkBase, false, used)
      );
    }

    // Bases nest (DateInputProps -> DateInputBaseProps -> …), so walk the chain
    // rather than one level. `seen` is shared, so a diamond is expanded once and
    // a cycle terminates. A prop declared on the interface itself always wins
    // over the inherited one — first row for a name is kept.
    const queue = [...expand];
    const expandedDecls = [];
    while (queue.length) {
      const { decl: base, filter } = queue.shift();
      expandedDecls.push(base);
      const baseAliases = localStringUnionAliases(ts, base.getSourceFile());
      const merged = new Map([...aliases, ...baseAliases]);
      // Defaults for inherited props are destructured by whoever implements the
      // BASE, not the wrapper: `TimeInput` renders `<TimeInputBase>`, so
      // `editable = true` and `incrementMinutes = 1` live there. The wrapper's
      // own destructuring still wins where both name a prop.
      const baseDefaults = new Map([
        ...defaultsForInterface(ts, base),
        ...defaults,
      ]);
      for (const row of memberRows(
        ts,
        base,
        merged,
        baseDefaults,
        linkBase,
        true,
        used
      )) {
        if (filter(row.name)) rows.push(row);
      }
      const nested = classifyHeritage(ts, checker, base, seen);
      external.push(...nested.external);
      for (const lit of nested.literals) {
        for (const row of memberRows(
          ts,
          lit,
          merged,
          baseDefaults,
          linkBase,
          true,
          used
        ))
          if (filter(row.name)) rows.push(row);
      }
      // A key omitted from an outer Omit stays omitted further up the chain.
      for (const next of nested.expand) {
        queue.push({
          decl: next.decl,
          filter: n => filter(n) && next.filter(n),
        });
      }
    }

    // Deduplicate by prop name, keeping the most-derived declaration.
    const byName = new Map();
    for (const row of rows) {
      const prev = byName.get(row.name);
      if (!prev) {
        byName.set(row.name, row);
        continue;
      }
      // The branches of a discriminated union each declare the prop with their
      // own type — `ControlProps` says `as?: 'div'` in one and `as: 'p'` in the
      // other. The table documents what a user may pass, which is both.
      if (prev.type !== row.type && !prev.type.includes(row.type)) {
        prev.type = `${prev.type} | ${row.type}`;
      }
    }
    // The forbidding branch types the prop `never`, which merged into cells
    // like ``never` | `number`` on slider.md — noise standing where the
    // reader needs a type. Dropping it leaves exactly what may be passed, and
    // the two boolean literals a discriminant contributes read as `boolean`.
    for (const row of byName.values()) {
      const seen = new Set();
      let ms = row.type.split(' | ').filter(m => !seen.has(m) && seen.add(m));
      if (ms.length > 1) ms = ms.filter(m => m !== '`never`');
      if (ms.length === 2 && ms.includes('`false`') && ms.includes('`true`')) {
        ms = ['`boolean`'];
      }
      row.type = ms.join(' | ');
    }
    rows.length = 0;
    rows.push(...byName.values());

    // The React props every component inherits and that the hand-written tables
    // named again and again — className on 18 pages, ref on 13, children on 5.
    // The catch-all row technically covers them, but a reader scanning for
    // "className" should find a row. The other ~250 DOM attributes stay
    // summarised; these three are the ones authors kept writing out. `style`
    // and `id` deliberately are NOT here — no hand-written table named them,
    // and adding two rows to all 87 pages is the table bloat this generator
    // exists to avoid.
    const inheritsDom = external.some(e => e.kind === 'dom');
    // `React.Ref<HTMLInputElement>`, not a bare `React.Ref` — the element is
    // right there in the forwardRef type arguments, and the hand-written tables
    // named it.
    const refTarget = isForwardRef && implInit.typeArguments?.[0]?.getText();
    if (inheritsDom) {
      // `children` is inherited by every DOM-attribute type, but inheriting it
      // is not the same as rendering it. Divider spreads onto `<hr>`, so the
      // synthesized row told readers to do the one thing React throws on
      // ("hr is a void element tag and must neither have `children`…"); Icon
      // always supplies its own JSX children, so anything passed is silently
      // dropped. Emit the row only where the implementation actually names
      // `children` — the catch-all still covers the pass-through cases.
      const rendersChildren = /\bchildren\b/.test(implInit?.getText() ?? '');
      for (const [name, type, description] of DOM_COMMON_PROPS) {
        if (byName.has(name)) continue;
        if (name === 'ref' && !isForwardRef) continue;
        if (name === 'children' && !rendersChildren) continue;
        const shown =
          name === 'ref' && refTarget ? `React.Ref<${refTarget}>` : type;
        rows.push({
          name,
          type: `\`${shown}\``,
          default: null,
          description,
          synthetic: true,
        });
      }
    }
    // `@extraProp {Type} [name] - desc` documents a notable inherited prop that
    // has no own member (the codemod parks unmatched @property lines here).
    // Read from the expanded bases too: `ControlProps` is a type alias, so its
    // documentation lives on `ControlBaseProps` and would otherwise be dropped.
    const extraProps = [];
    // Synthetic rows do NOT claim a name: where the page wrote its own
    // description for `ref` or `children` ("Ref forwarded to the carousel
    // element"), the codemod parked it as an @extraProp and that text is
    // better than this module's one-size-fits-all sentence.
    const takenExtra = new Set(rows.filter(r => !r.synthetic).map(r => r.name));
    for (const owner of [decl, ...expandedDecls]) {
      for (const tag of ts.getJSDocTags(owner)) {
        if (tag.tagName.text !== 'extraProp') continue;
        const raw = ts.getTextOfJSDocComment(tag.comment) ?? '';
        const m = raw.match(
          /^(?:\{([^}]+)\}\s*)?\[?([\w'"-]+)(?:=([^\]]*))?\]?\s*-\s*([\s\S]+)$/
        );
        if (!m) continue;
        const name = m[2].replace(/^['"]|['"]$/g, '');
        // A real row always wins. Without this a prop documented as an
        // @extraProp on a base AND declared on the interface appears twice.
        if (takenExtra.has(name)) continue;
        takenExtra.add(name);
        extraProps.push({
          name,
          type: m[1]
            ? splitUnion(m[1])
                .map(part => `\`${part}\``)
                .join(' | ')
            : '',
          default: m[3] ? m[3].trim() : null,
          description: m[4].replace(/\s+/g, ' ').trim(),
        });
      }
    }

    // Type aliases named in this table that were too long to inline, with the
    // definition the page renders as a footnote.
    const defs = allAliases(ts, program);
    const types = [...used]
      .filter(n => defs.has(n) && !aliases.has(n))
      .sort()
      .map(n => ({ name: n, ...defs.get(n) }));

    // Drop a synthetic row an @extraProp replaced.
    const claimed = new Set(extraProps.map(e => e.name));
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].synthetic && claimed.has(rows[i].name)) rows.splice(i, 1);
    }

    tables.push({
      path,
      impl,
      types,
      interfaceName: ifaceName,
      // The sub-component's own TSDoc summary, which becomes its line in the
      // `**Subcomponents:**` list. The hand-written pages described each sub
      // there ("Top bar for navigation or branding"), so dropping to a bare
      // name list would lose a sentence per sub-component.
      summary: jsdocText(ts, implInit?.parent),
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
    varPrefix: VAR_PREFIX_OVERRIDES[name] ?? rootClass,
    rootClassCandidates: candidates,
    tables,
    sourceFile: sf.fileName,
  };
}
