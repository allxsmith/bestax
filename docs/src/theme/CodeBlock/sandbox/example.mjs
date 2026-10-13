/**
 * Turns a docs live example into the source of a standalone `App.tsx`.
 *
 * A live example is evaluated with the whole library in scope, so most of
 * them carry no imports, and it is either a bare JSX element or a function
 * component. A real project needs both fixed: this module writes the imports
 * the example actually uses and gives it a default export, so StackBlitz and
 * CodeSandbox can mount it as the app.
 *
 * Pure and dependency-light on purpose: the docs bundle loads it on demand,
 * and `scripts/sandbox.test.mjs` plus the corpus check run it under Node.
 */
import { transform } from 'sucrase';
import { stripModuleLines } from './moduleLines.mjs';

const LIBRARY = '@allxsmith/bestax-bulma';

/** Keywords after which a `/` starts a regex literal rather than dividing. */
const REGEX_KEYWORDS = new Set([
  'await',
  'case',
  'delete',
  'do',
  'else',
  'in',
  'instanceof',
  'new',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
]);

/** Characters after which a `/` starts a regex literal. */
const REGEX_PRECEDERS = '(,=:[!&|?{};+-*%<>~^';

/**
 * Replaces comments, string and template text, and regex literals with
 * spaces, keeping line breaks and offsets, so only code tokens remain.
 *
 * Meant for plain JavaScript. JSX text is not recognised, which is why
 * `scan` compiles JSX away first.
 *
 * @param {string} src
 * @returns {string}
 */
export function blankNonCode(src) {
  const out = [];
  /** Brace depth at each open `${`, so its closing `}` resumes the template. */
  const templateDepths = [];
  let depth = 0;
  let prev = '';
  let prevWord = '';
  let i = 0;

  const blank = (from, to) => {
    out.push(src.slice(from, to).replace(/[^\n]/g, ' '));
    prev = '"';
    prevWord = '';
  };
  const scanTemplate = j => {
    while (j < src.length) {
      if (src[j] === '\\') {
        j += 2;
      } else if (src[j] === '`') {
        return j + 1;
      } else if (src[j] === '$' && src[j + 1] === '{') {
        templateDepths.push(depth);
        return j + 2;
      } else {
        j += 1;
      }
    }
    return src.length;
  };

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '/' && next === '/') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? src.length : end;
      out.push(' '.repeat(stop - i));
      i = stop;
    } else if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out.push(src.slice(i, stop).replace(/[^\n]/g, ' '));
      i = stop;
    } else if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== ch && src[j] !== '\n') {
        j += src[j] === '\\' ? 2 : 1;
      }
      const stop = Math.min(j + 1, src.length);
      blank(i, stop);
      i = stop;
    } else if (ch === '`') {
      const stop = scanTemplate(i + 1);
      blank(i, stop);
      i = stop;
    } else if (
      ch === '}' &&
      templateDepths.length > 0 &&
      templateDepths[templateDepths.length - 1] === depth
    ) {
      templateDepths.pop();
      const stop = scanTemplate(i + 1);
      blank(i, stop);
      i = stop;
    } else if (
      ch === '/' &&
      (prev === '' ||
        REGEX_PRECEDERS.includes(prev) ||
        REGEX_KEYWORDS.has(prevWord))
    ) {
      let j = i + 1;
      let inClass = false;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) break;
        j += 1;
      }
      j += 1;
      while (j < src.length && /[a-z]/i.test(src[j])) j += 1;
      const stop = Math.min(j, src.length);
      blank(i, stop);
      i = stop;
    } else if (/[\w$]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[\w$]/.test(src[j])) j += 1;
      const word = src.slice(i, j);
      out.push(word);
      prev = 'w';
      prevWord = word;
      i = j;
    } else {
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      out.push(ch);
      if (!/\s/.test(ch)) {
        prev = ch;
        prevWord = '';
      }
      i += 1;
    }
  }
  return out.join('');
}

const IDENTIFIER = /(?<![\w$])[A-Za-z_$][\w$]*/g;

function previousNonSpace(code, index) {
  let i = index - 1;
  while (i >= 0 && /\s/.test(code[i])) i -= 1;
  return { char: code[i] ?? '', index: i };
}

function nextNonSpace(code, index) {
  let i = index;
  while (i < code.length && /\s/.test(code[i])) i += 1;
  return code[i] ?? '';
}

/**
 * Identifiers read as values: member names (`a.b`) and object keys
 * (`{ key: value }`) are not references to anything in scope.
 */
function referencedIdentifiers(code) {
  const names = new Set();
  for (const match of code.matchAll(IDENTIFIER)) {
    const before = previousNonSpace(code, match.index);
    const isSpread = before.char === '.' && code[before.index - 2] === '.';
    if (before.char === '.' && !isSpread) continue;
    const after = nextNonSpace(code, match.index + match[0].length);
    if (after === ':' && (before.char === '{' || before.char === ',')) continue;
    names.add(match[0]);
  }
  return names;
}

const OPENERS = { '(': ')', '[': ']', '{': '}' };
const CLOSERS = { ')': '(', ']': '[', '}': '{' };

/** The index of the bracket matching the one at `index`, scanning forward. */
function matchForward(code, index) {
  const stack = [];
  for (let i = index; i < code.length; i += 1) {
    if (OPENERS[code[i]]) stack.push(OPENERS[code[i]]);
    else if (code[i] === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return i;
    }
  }
  return code.length;
}

/** The index of the bracket matching the one at `index`, scanning back. */
function matchBackward(code, index) {
  const stack = [];
  for (let i = index; i >= 0; i -= 1) {
    if (CLOSERS[code[i]]) stack.push(CLOSERS[code[i]]);
    else if (code[i] === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return i;
    }
  }
  return 0;
}

/**
 * Names the example binds itself: declarations, destructuring patterns and
 * parameters. Scope-blind on purpose, since a name bound anywhere in an
 * example this size is almost never also wanted from the library.
 */
function declaredIdentifiers(code) {
  const names = new Set();
  const addRange = (from, to) => {
    for (const name of referencedIdentifiers(code.slice(from, to + 1))) {
      names.add(name);
    }
  };
  for (const match of code.matchAll(
    /\b(?:function\s*\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g
  )) {
    names.add(match[1]);
  }
  for (const match of code.matchAll(/\b(?:const|let|var)\s*[[{]/g)) {
    const open = match.index + match[0].length - 1;
    addRange(open, matchForward(code, open));
  }
  for (const match of code.matchAll(/\bfunction\s*\*?\s*[\w$]*\s*\(/g)) {
    const open = match.index + match[0].length - 1;
    addRange(open, matchForward(code, open));
  }
  for (const match of code.matchAll(/\)\s*=>/g)) {
    addRange(matchBackward(code, match.index), match.index);
  }
  for (const match of code.matchAll(/(?<![\w$])([A-Za-z_$][\w$]*)\s*=>/g)) {
    names.add(match[1]);
  }
  return names;
}

/**
 * The references and bindings in a module, read after JSX and TypeScript are
 * compiled away so that JSX text and string props cannot pose as names.
 * Source that does not compile, such as a reader's half-finished edit, is
 * scanned as written instead: less precise, never fatal.
 */
function scan(source) {
  let code = source;
  try {
    code = transform(source, {
      transforms: ['jsx', 'typescript'],
      jsxRuntime: 'automatic',
      production: true,
    }).code;
  } catch {
    // Fall through with the raw text.
  }
  const blanked = blankNonCode(code);
  return {
    referenced: referencedIdentifiers(blanked),
    declared: declaredIdentifiers(blanked),
  };
}

/** Drops the comments and whitespace an example may open with. */
function skipLeadingComments(code) {
  let rest = code;
  for (;;) {
    const trimmed = rest.trimStart();
    if (trimmed.startsWith('//')) {
      const end = trimmed.indexOf('\n');
      rest = end === -1 ? '' : trimmed.slice(end + 1);
    } else if (trimmed.startsWith('/*')) {
      const end = trimmed.indexOf('*/');
      rest = end === -1 ? '' : trimmed.slice(end + 2);
    } else {
      return trimmed;
    }
  }
}

/**
 * Wraps the example the way react-live reads it (`return (code)`): a JSX
 * element becomes the body of a component, a named function or class is
 * exported by name, and any other expression is assumed to be a component.
 */
function toComponentModule(body) {
  const head = skipLeadingComments(body);
  const expression = body.replace(/;\s*$/, '');

  if (/^\(*\s*</.test(head)) {
    // Indenting would change the text inside a template literal.
    const inner = expression.includes('`')
      ? expression
      : expression
          .split('\n')
          .map(line => (line ? `    ${line}` : line))
          .join('\n');
    return `export default function Example() {\n  return (\n${inner}\n  );\n}\n`;
  }

  const named = head.match(/^(?:function\s*\*?|class)\s+([A-Za-z_$][\w$]*)/);
  if (named) {
    return `${expression}\n\nexport default ${named[1]};\n`;
  }

  return `const Example = ${expression};\n\nexport default Example;\n`;
}

/** One import declaration, broken over lines the way Prettier would. */
function importLine(defaultName, names, from) {
  const parts = [];
  if (defaultName) parts.push(defaultName);
  if (names.length > 0) parts.push(`{ ${names.join(', ')} }`);
  const line = `import ${parts.join(', ')} from '${from}';`;
  if (line.length <= 80 || names.length === 0) return line;
  const head = defaultName ? `${defaultName}, ` : '';
  return `import ${head}{\n${names.map(name => `  ${name},`).join('\n')}\n} from '${from}';`;
}

/**
 * @param {string} code The example as written in the docs fence, or as a
 *   reader has since edited it.
 * @param {object} options
 * @param {string[]} options.libraryExports Every runtime export of the library.
 * @param {string[]} [options.reactNames] React exports the live scope provides
 *   bare, such as `useState`.
 * @param {string[]} [options.docsOnlyNames] Scope names that exist only in the
 *   docs site. An example using one cannot run anywhere else.
 * @param {string} [options.sourceUrl] The docs page, linked from the header.
 * @returns {{ source: string, libraryImports: string[] } | null} `null` when
 *   the example depends on a docs-only name.
 */
export function toExampleModule(
  code,
  { libraryExports, reactNames = [], docsOnlyNames = [], sourceUrl } = {}
) {
  // The site drops `import type` lines only because types do not run. They
  // are how an example names a library type, so the sandbox keeps them.
  const typeImports = code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('import type '));
  const body = stripModuleLines(code).trim();
  const component = toComponentModule(body);
  const { referenced, declared } = scan(component);
  const uses = name => referenced.has(name) && !declared.has(name);

  if (docsOnlyNames.some(uses)) return null;

  const libraryImports = libraryExports.filter(uses).sort();
  const hooks = reactNames.filter(uses).sort();
  // Type positions are compiled away before the scan, so a `React.ChangeEvent`
  // annotation has to be caught in the source.
  const usesReact =
    uses('React') ||
    (!declared.has('React') && /(?<![\w$.])React\.[A-Z]/.test(body));

  const header = [];
  if (sourceUrl) header.push(`// Live example from ${sourceUrl}`);
  const imports = [];
  if (usesReact || hooks.length > 0) {
    imports.push(importLine(usesReact ? 'React' : '', hooks, 'react'));
  }
  if (libraryImports.length > 0) {
    imports.push(importLine('', libraryImports, LIBRARY));
  }
  imports.push(...typeImports);

  const preamble = [header.join('\n'), imports.join('\n')]
    .filter(Boolean)
    .join('\n\n');
  const source = preamble ? `${preamble}\n\n${component}` : component;
  return { source, libraryImports };
}
