import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve as resolvePath,
} from 'node:path';
import ts from 'typescript';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import scss from 'rollup-plugin-scss';

const scssBase = {
  outputStyle: 'compressed',
  includePaths: ['src/scss', '../node_modules'],
  sourceMap: true,
  silenceDeprecations: ['import', 'global-builtin', 'if-function'],
  // The plugin doesn't track @use'd partials, so without this `rollup --watch`
  // never rebuilds the CSS bundles when a partial changes.
  watch: 'src/scss',
};

const aiBanner =
  '/* @allxsmith/bestax-bulma — AI agents: see AGENTS.md in the package root, or https://bestax.io/llms.txt */';

/**
 * Parse a declaration with TypeScript.
 *
 * Both passes used to read raw text, and a relative path quoted inside a
 * preserved TSDoc `@example` read exactly like a specifier: rewritten when it
 * resolved, and a build failure when it did not. This tree emits `@example`
 * blocks in quantity, so that was live rather than theoretical.
 *
 * The answer was a map of where the comments are, so their bodies could be
 * exempted — and that map was wrong more than once before it was right, each time in
 * the direction that matters. A hand-rolled walk over quotes and slashes
 * miscounted the backticks of a template nesting another inside a substitution;
 * `createScanner` fixed that and kept a subtler version, since a bare scanner
 * never re-scans the brace closing a substitution as template continuation, so
 * a `/*` in the text after it opened a comment running to the end of the file.
 * A false range is the worst failure available here, because both passes
 * consulted the map and the specifier inside was then neither rewritten nor
 * checked.
 *
 * None of that machinery is left. Asking the parser WHICH STRINGS NAME MODULES
 * removes the question the comment map existed to answer: prose is not a
 * specifier because it is not a node, rather than because a range said so.
 */
const parseDeclaration = text =>
  ts.createSourceFile(
    'declaration.d.ts',
    text,
    ts.ScriptTarget.Latest,
    // No parent pointers. The comment walk this replaced descended through
    // TOKENS and so needed `getChildren`, which needs them; nothing here does.
    // `referencedPaths` maps `referencedFiles`, `moduleSpecifiers` uses
    // `forEachChild`, and `getStart(sourceFile)` skips trivia on the text it is
    // handed. Keeping them was explaining a carry-over rather than removing it.
    false,
    ts.ScriptKind.TS
  );

/**
 * Every module specifier in a parsed declaration, with the offsets of the
 * string's CONTENT — inside the quotes, so a rewrite replaces the path and
 * leaves the quoting alone.
 *
 * This replaced a regex over `from` / `import(` positions, and with it the
 * comment map both passes needed. A pattern cannot tell a specifier from
 * anything else quoted beside it, which cost this file a rewrite inside a TSDoc
 * `@example`, a build failure on a relative path written in prose, and a comment
 * scanner that was wrong more than once before it was right. The parser knows which
 * strings name modules, so none of that has to be inferred.
 *
 * A `declare module` name is collected too, and carries `rewritable` to say
 * whether an extension may be chosen for it. Inside a file that is itself a
 * module it is an augmentation, naming a module the way an import does; in a
 * global file it is an ambient declaration, where a relative name is TS2436 and
 * there is nothing correct to rewrite it to. Both are checked.
 */
const moduleSpecifiers = sourceFile => {
  const found = [];
  const take = (node, declarationAllowed, rewritable = true) => {
    if (!node || !ts.isStringLiteral(node)) return;
    found.push({
      start: node.getStart(sourceFile) + 1,
      end: node.getEnd() - 1,
      text: node.text,
      declarationAllowed,
      rewritable,
    });
  };
  const visit = node => {
    if (ts.isImportDeclaration(node)) {
      // TS2846 reads the CLAUSE, so what matters is whether this import binds a
      // value — not whether it is spelled `type`. Measured against tsc:
      //
      //   import type { T } from './a.d.ts'   accepted   type-only clause
      //   import './a.d.ts'                   accepted   NO clause to bind
      //   import { A } from './a.d.ts'        TS2846     binds a value
      //   import { type T } from './a.d.ts'   TS2846     inline, still a value
      //   import {} from './a.d.ts'           TS2846     empty is still a clause
      //
      // So a side-effect import belongs with the accepting forms, which is why
      // "type-only" was the wrong question to ask.
      const clause = node.importClause;
      take(node.moduleSpecifier, !clause || Boolean(clause.isTypeOnly));
    } else if (ts.isExportDeclaration(node)) {
      take(node.moduleSpecifier, Boolean(node.isTypeOnly));
    } else if (ts.isImportEqualsDeclaration(node)) {
      // `import type a = require('./a.d.ts')` is accepted; the value form is
      // TS2846. The flag lives on the declaration, not on the reference below
      // it, so reading the reference alone marked every one a value.
      if (ts.isExternalModuleReference(node.moduleReference)) {
        take(node.moduleReference.expression, Boolean(node.isTypeOnly));
      }
    } else if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
      // An AUGMENTATION names a module the same way an import does, so its
      // specifier needs the same extension — but only in a file that is itself
      // a module. The same syntax in a global file is an ambient declaration,
      // where a relative name is TS2436 and there is no right answer to rewrite
      // it to; those are still CHECKED, because `pnpm build` is not a type gate
      // and erroring source still emits.
      //
      // `declarationAllowed` is true here because TS2846 is raised from one
      // expression that needs an import or export ancestor, and a module name
      // has none. So `declare module './a.d.ts'` typechecks, and refusing it
      // was this field being carried over from the shape it replaced — each
      // time by carrying a value over from the shape it replaced rather than
      // asking what the compiler does with THIS one.
      take(node.name, true, ts.isExternalModule(sourceFile));
    } else if (ts.isImportTypeNode(node)) {
      // The `import('./x').Y` form tsc emits for a type it reaches without an
      // explicit import. Always a type position: the only non-clause route to
      // TS2846 needs a CallExpression, which this is not.
      const argument = node.argument;
      if (argument && ts.isLiteralTypeNode(argument)) {
        take(argument.literal, true);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
};

/**
 * The relative `reference path` targets TypeScript would follow.
 *
 * A reference directive is a line comment that TypeScript nonetheless reads, so
 * exempting comment bodies had to spare it. Taking the list from the parse
 * rather than from a pattern of our own is what makes "spare it" exact in both
 * directions. A hand-written pattern was wrong both ways at once: it missed a
 * reversed attribute order and a capitalised `<Reference Path=`, which
 * TypeScript honours and which therefore shipped dangling; and it caught
 * directives after the first statement, which TypeScript ignores, failing the
 * build over a line that means nothing.
 *
 * Every entry is taken, with no filter of our own. A reference target is a path
 * relative to the containing file, never a package name, so `gone.d.ts` and
 * `sub/gone.d.ts` are as real as `./gone.d.ts` — and a relative-looking prefix
 * test threw exactly those two away, which put the narrowing back that adopting
 * the parse was meant to remove. An absolute target is kept too: it cannot be
 * inside the published tree, so containment refuses it and says so.
 */
const referencedPaths = sourceFile =>
  sourceFile.referencedFiles.map(reference => reference.fileName);

/**
 * Whether `target` is a real declaration INSIDE `root`.
 *
 * `existsSync` alone answers a question about the build machine, not about the
 * tarball. A specifier climbing out of `dist/types` — `../../src/x.d.ts`, or a
 * `..` too many — can resolve here and dangle for every consumer, because only
 * what is under `dist/types` gets published. Containment is the half that makes
 * the probe mean what the surrounding code reads it as.
 */
const declarationUnder = (root, target) => {
  const inside = relative(resolvePath(root), target);
  if (inside === '' || inside.startsWith('..') || isAbsolute(inside)) {
    return false;
  }
  return existsSync(target);
};

/**
 * Whether `spec`, written inside `file`, names a declaration that exists.
 *
 * A declaration spells its imports the way the runtime will: `./x.js` is
 * declared by `./x.d.ts`, and the `.cjs`/`.mjs` forms by `.d.cts`/`.d.mts`. A
 * triple-slash `reference path` names the declaration directly. Anything else
 * is unresolved, which is the one question worth asking after the rewrite.
 */
const resolvesToDeclaration = (root, file, spec) =>
  // A `reference path` names a declaration DIRECTLY, in ANY position — which is
  // exactly what `declarationAllowed` means, so this is the same question with
  // that flag set rather than a second predicate.
  //
  // It used to branch on the declaration spelling here and then delegate with
  // `false`, which made the branch load-bearing: deleting it as an obvious
  // duplicate — `specifierResolves` carries the same test — would silently have
  // started refusing `reference path="./x.d.ts"`. Written this way there is
  // nothing to delete wrongly.
  specifierResolves(root, file, spec, true);

/**
 * Whether `spec`, used as a MODULE SPECIFIER inside `file`, names a declaration
 * that exists.
 *
 * Split from the reference-path question because the two disagreed about the
 * same string. A specifier spelled `./x.d.ts` was accepted here and hard-failed
 * by the rewrite — invisible while the rewrite's pattern could not reach a
 * side-effect import, and reachable the moment it asked the parser instead.
 * Neither was right: TS2846 turns on whether the import BINDS A VALUE, so the
 * spelling is fine in a type-only position and refused in a value one, and both
 * passes now ask that question rather than answering by name.
 *
 * Exported because the rewrite throws on that shape FIRST, so this refusal
 * cannot be reached through the plugin's hooks and would otherwise be an
 * unpinned clause kept honest by nothing. It is here to stop the two
 * predicates drifting apart again, and the test drives it directly.
 */
export const specifierResolves = (root, file, spec, declarationAllowed) => {
  // A declaration-spelled specifier resolves directly, and only a type-only
  // position may use one. Answering by name rather than by position was the
  // disagreement: the rewrite refused every spelling and this accepted every
  // spelling, and TypeScript does neither.
  if (/\.d\.[cm]?ts$/.test(spec)) {
    return (
      declarationAllowed &&
      declarationUnder(root, resolvePath(dirname(file), spec))
    );
  }
  const runtime = spec.match(/\.([cm]?)js$/);
  if (!runtime) return false;
  const declared = `.d.${runtime[1]}ts`;
  return declarationUnder(
    root,
    resolvePath(dirname(file), spec).replace(/\.[cm]?js$/, declared)
  );
};

/**
 * Give every relative specifier in the emitted declarations a `.js` extension.
 *
 * `tsc` writes specifiers exactly as the source spells them, so the
 * declarations say `export * from './columns/Column'`. This package is
 * `"type": "module"`, so TypeScript reads a `.d.ts` as an ES module, where an
 * extensionless relative specifier does not resolve — `node16`/`nodenext`
 * consumers got TS2834 on every re-export, the root's type surface came out
 * empty, and each named import failed with TS2305 (#696). `skipLibCheck` does
 * not help: it stops declarations being CHECKED, not RESOLVED.
 *
 * The extension is added rather than the directory being marked CommonJS,
 * which also makes them resolve. Marking would make the declarations describe
 * a CommonJS module while the bundle they describe is ESM, and TypeScript then
 * accepts `import pkg from '…'` — which typechecks clean and throws
 * `does not provide an export named 'default'` at runtime. Extensions keep the
 * declarations honest about the module kind, so that import is rejected where
 * it is written.
 *
 * Most specifiers name a file and take a `.js`; some name a directory and take
 * `/index.js`. Which it is, is resolved rather than assumed, and anything that
 * is neither throws — including a bare `.` or `..`, which skips the file probe
 * but is still held to having an index. The file probe comes first because
 * TypeScript prefers a file to a same-named directory, and a reversal there
 * emits something that RESOLVES, so the post-pass cannot see it.
 *
 * Every arm emits `.js` and probes `.d.ts` whatever the containing file's
 * flavour — the file arm as much as the two directory ones. This package is
 * `type: module` and `dist/types` adds no manifest of its own, so what they
 * pick is an ESM declaration, and reaching one from a `.d.cts` is TS1479 under
 * `module: node16` or `node18`. Under `module: nodenext` the same import is
 * clean, since that setting models `require` of ESM. The knob is `module`
 * rather than `moduleResolution`, and the two are set separately, so
 * `module: nodenext` with `moduleResolution: node16` is clean as well. From a
 * `.d.mts` it is clean throughout. So the gap is one flavour against one
 * setting, and it resolves either way, so the post-pass is blind to it. No
 * `.cts` or `.mts` source exists here and `dist/types` carries none; this is
 * the one member of that class left unaddressed rather than unreachable by
 * accident.
 */
export const declarationExtensions = (root = 'dist/types') => {
  // `closeBundle` fires on every FAILURE path too, where `dist/types` is absent
  // or stale because the build never got that far. Without a latch this hook's
  // own error replaces the real one — a compile failure reported as a missing
  // declaration directory, on the publish job's clean checkout, every time.
  //
  // The latch is a closure variable rather than `this.meta`, because `meta` is
  // shared only between BUILD hooks: every output hook gets its own, one per
  // output, invisible to `closeBundle`. A closure is shared by all of them, so
  // it can carry `renderError` too — the output-phase failure, which otherwise
  // collapses into a `SuppressedError` with no cause printed at all. That catch
  // closes before `generateBundle`, so it does not cover the whole phase, which
  // is why the counted latch below exists as well.
  let failed = false;
  // COUNTED, not flagged. One boolean is per plugin, not per output, so a
  // sibling output completing its write unlatches a failure in the other —
  // and `generateBundle` and everything after it sit outside `renderError`'s
  // catch, so that failure need not have set `failed` either. Every output
  // that starts must also finish.
  let started = 0;
  let wrote = 0;
  // Which build this is. `rollup --watch` does NOT await `result.close()`, so a
  // rebuild can begin while the previous build's pass is still walking the
  // tree: the pass reads a declaration, the new emit overwrites it, and then the
  // pass writes its rewrite of the OLD text back on top. Transient and
  // dev-only — the next rebuild corrects it, and no publish runs under watch —
  // but a stale declaration on disk is confusing to debug, and a generation
  // check is cheaper than the confusion.
  let generation = 0;
  // One route stays outside all of it, and is left there on purpose. If a
  // plugin ordered AFTER this one had a `writeBundle` that threw, `wrote` would
  // already have been incremented and `closeBundle` would be handed no error,
  // so the latch would read a clean build. Rollup offers no signal for a
  // sibling's write failure: `writeBundle` hooks run in parallel and the
  // rejection surfaces from `bundle.write()`, which a plugin cannot observe,
  // and `order: 'post'` does not help because the hooks still all run.
  //
  // It is harmless, which is why there is no sixth latch. Declarations reach
  // disk as bundle assets, written by rollup BEFORE any `writeBundle` fires —
  // measured on this config: zero declarations at `renderStart`, the full set
  // at each output's `writeBundle`. So on that route the pass reads a COMPLETE
  // tree, which is the one thing the latch exists to guarantee, and it has
  // nothing to complain about and nothing to throw. Re-running over an
  // already-rewritten tree changes nothing either.
  //
  // That rests on two properties of the config rather than on rollup, so both
  // are worth knowing before either is changed. `@rollup/plugin-typescript`
  // emits declarations with `this.emitFile`, which makes them rollup's assets
  // to write rather than files the plugin writes itself; and `declarationDir`
  // sits INSIDE each output's `dir`, so those assets land in the tree this pass
  // walks. Move the declarations outside the output directory, or to a plugin
  // that writes them directly, and the timing above stops holding — the route
  // comes back and this comment is the thing to revisit. It does not depend on
  // the number of outputs: every output writes the full set before its own
  // `writeBundle`.
  //
  // Do not answer this by moving the throw. Failing from `closeBundle` is
  // reported normally on its own, and collapses into `SuppressedError: An
  // error was suppressed during disposal` only when another error is already in
  // flight — which is exactly the case a latch is for, and exactly the case
  // this route is not.
  return {
    name: 'bestax-declaration-extensions',
    buildStart() {
      // Reset per build: under `--watch` one instance serves every rebuild, and
      // a failure must not silence the runs after it.
      failed = false;
      started = 0;
      wrote = 0;
      generation += 1;
    },
    buildEnd(error) {
      if (error) failed = true;
    },
    renderError() {
      failed = true;
    },
    renderStart() {
      started += 1;
    },
    writeBundle() {
      // A POSITIVE latch, because the negative ones cannot see the whole write
      // phase: `renderError`'s catch closes before `generateBundle`, and a
      // failure after that reaches `closeBundle` with no error at all.
      wrote += 1;
    },
    // `closeBundle`, not `writeBundle`. The TypeScript plugin re-emits the
    // whole declaration set for EVERY output of a config, and rollup's CLI
    // writes a config's outputs concurrently — so a per-output hook races the
    // sibling output's emit, and losing that race republishes extensionless
    // declarations with a green build. `closeBundle` runs once, after every
    // output is on disk.
    //
    // It is also not available per output: `closeBundle` is absent from
    // rollup's `OutputPluginHooks`, so an output-level placement would not fire
    // once per output — it would not fire at all.
    // The `error` parameter is the fourth route here, and the only one neither
    // latch sees: when a SIBLING plugin throws from its own `buildEnd`, this
    // plugin's `buildEnd` is called with nothing while `closeBundle` is handed
    // the error. Verified against rollup's own API — without this, that error
    // is replaced by whatever this hook says next.
    async closeBundle(error) {
      if (failed || error || started === 0 || wrote !== started) return;
      // Pinned at entry, compared before every write: a rebuild that starts
      // mid-pass makes this pass's remaining writes stale. This NARROWS the
      // window rather than closing it — a rebuild landing between the check and
      // the `writeFile` beside it still lands — and closing it properly would
      // mean locking the tree. What is left is one stale declaration, corrected
      // by the rebuild that caused it, under `--watch` only.
      const building = generation;
      const files = [];
      const walk = async dir => {
        let entries;
        try {
          entries = await readdir(dir, { withFileTypes: true });
        } catch (error) {
          if (dir !== root || error.code !== 'ENOENT') throw error;
          // Absent and empty are the same mistake — the declaration pass has not
          // run — and a raw ENOENT names neither the cause nor the fix.
          return;
        }
        for (const entry of entries) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) await walk(full);
          // `.d.cts` and `.d.mts` are declarations too, and skipping them left
          // their specifiers neither rewritten nor checked.
          else if (/\.d\.[cm]?ts$/.test(entry.name)) files.push(full);
        }
      };
      await walk(root);
      if (!files.length) {
        throw new Error(
          `${root} holds no declarations, so the emitted specifiers cannot be ` +
            'rewritten. The declaration pass has to run before this entry.'
        );
      }

      // What a single specifier becomes, or a throw naming why it cannot.
      // Returns null when it is already correct and needs no edit.
      //
      // Every shape reaching here comes from the parser, so the quoting and the
      // position are already settled. What is left is a question about the
      // filesystem: which of `.js`, `/index.js` or nothing this path needs, and
      // whether the declaration it would then name exists.
      const rewritten = (file, spec, declarationAllowed) => {
        // A declaration-spelled specifier is answered by position, not by
        // name. In a TYPE position TypeScript accepts it and resolves it
        // directly, so it is already correct and needs no extension. In a value
        // position it is TS2846, and the probes below would otherwise look for
        // `x.d.ts.d.ts` and report that nothing resolves — true, and the wrong
        // thing to say.
        if (/\.d\.[cm]?ts$/.test(spec)) {
          if (declarationAllowed) {
            if (declarationUnder(root, resolvePath(dirname(file), spec))) {
              return null;
            }
            throw new Error(
              `${file}: '${spec}' names a declaration that does not exist, so ` +
                'it would ship pointing nowhere.'
            );
          }
          const runtime = spec.replace(/\.d\.([cm]?)ts$/, '.$1js');
          throw new Error(
            `${file}: '${spec}' names a declaration file from an import that ` +
              'binds a value, which TypeScript refuses with TS2846. Write ' +
              `'${runtime}' instead, or make the import type-only — the ` +
              'declaration beside it is what gets read either way.'
          );
        }
        // An extension already present is still checked. The post-pass would
        // catch a dangling one too, since it asks about resolution rather than
        // about extensions — this is the earlier and better-worded of the two
        // errors, not the only net.
        const extensioned = spec.match(/\.([cm]?)js$/);
        if (extensioned) {
          // `.cjs` is declared by `.d.cts` and `.mjs` by `.d.mts`; probing
          // `.d.ts` for either verifies a file TypeScript will not consult.
          const declared = `.d.${extensioned[1]}ts`;
          const asFile = resolvePath(dirname(file), spec).replace(
            /\.[cm]?js$/,
            declared
          );
          if (declarationUnder(root, asFile)) return null;
          throw new Error(
            `${file}: '${spec}' already carries an extension but resolves to ` +
              'no declaration, so it would ship pointing nowhere.'
          );
        }
        // A bare `.` or `..` names a directory by definition, so it skips the
        // file probe. Probing first would let a stale declaration — `dist` is
        // never cleaned — send it down the file branch and emit a specifier
        // ending in `.js` that resolves nowhere. The index is still checked:
        // this branch has to throw like the others, or it becomes the one path
        // that can emit something unresolvable in silence.
        if (/^\.\.?$/.test(spec)) {
          if (
            declarationUnder(
              root,
              join(resolvePath(dirname(file), spec), 'index.d.ts')
            )
          ) {
            return `${spec}/index.js`;
          }
          throw new Error(
            `${file}: '${spec}' names a directory with no index declaration, ` +
              'so no extension can be chosen for it.'
          );
        }
        const resolved = resolvePath(dirname(file), spec);
        // The file probe comes first because TypeScript prefers a file to a
        // same-named directory, and a reversal emits something that RESOLVES,
        // so the post-pass cannot see it.
        if (declarationUnder(root, `${resolved}.d.ts`)) return `${spec}.js`;
        if (declarationUnder(root, join(resolved, 'index.d.ts'))) {
          return `${spec}/index.js`;
        }
        throw new Error(
          `${file}: '${spec}' resolves to neither a declaration nor a ` +
            'directory holding one, so no extension can be chosen for it.'
        );
      };

      for (const file of files) {
        // Checked before the work, not only before the write. The rewrite below
        // THROWS on a specifier it cannot resolve, and a pass whose build has
        // already been superseded must not be the thing that fails the build
        // that superseded it.
        if (generation !== building) return;
        const before = await readFile(file, 'utf8');
        let edits;
        try {
          edits = moduleSpecifiers(parseDeclaration(before))
            .filter(found => found.rewritable)
            .filter(found => /^\.\.?(\/|$)/.test(found.text))
            .map(found => ({
              ...found,
              to: rewritten(file, found.text, found.declarationAllowed),
            }))
            .filter(edit => edit.to !== null);
        } catch (error) {
          // Same reason, for the window between that check and this throw.
          if (generation !== building) return;
          throw error;
        }
        // Applied from the END backwards, so an earlier edit cannot move the
        // offsets of a later one.
        let after = before;
        for (const edit of edits.sort((a, b) => b.start - a.start)) {
          after = after.slice(0, edit.start) + edit.to + after.slice(edit.end);
        }
        if (generation !== building) return;
        if (after !== before) await writeFile(file, after, 'utf8');
      }

      // Re-READ from disk, and parsed again, rather than carrying the rewrite's
      // result forward. That independence is the point: this loop is checking
      // the rewrite, and reusing its output would make it a restatement. The
      // second parse costs a fraction of a percent of build time, measured
      // against the whole package build, which is not a trade worth making.
      //
      // The rewrite can only fix shapes its pattern matches, and several escaped
      // it in the writing — the double-quoted `import("./x")` form, a bare `..`,
      // and a side-effect `import './x';` in neither position. An unmatched
      // specifier fails silently, so the tree is re-read here.
      for (const file of files) {
        // The FIRST guard on a real window, not a copy of the one above. A
        // rebuild landing during the rewrite loop's final `writeFile` has
        // already passed both of that loop's checks, and the loop makes no
        // further one — so this is the only thing that sees it, and this loop
        // throws.
        //
        // It is not pinned by a case, and that is a limit of the seam rather
        // than a judgement about the clause: driving it needs the generation to
        // move while that `writeFile` is in flight, and `readFile`/`writeFile`
        // come straight from `node:fs/promises` with nothing to hook. A
        // `setTimeout` would produce a flaky test wearing a pinned test's
        // clothes. Worth stating rather than leaving implied, since everything
        // else here has a failing case behind it.
        if (generation !== building) return;
        const text = await readFile(file, 'utf8');
        // The question is whether every specifier RESOLVES, asked of what is
        // actually on disk.
        //
        // This is no longer a second way of FINDING specifiers — both passes
        // ask the parser now, so a scan for something the rewrite might have
        // missed would only restate it. What it checks instead is the WRITE:
        // the file is re-read and re-parsed, so a pick that resolves nowhere is
        // caught here rather than shipped.
        //
        // Its reach is narrower than "any corruption", and worth stating so
        // nobody leans on it for more: it only sees strings that still parse as
        // a module specifier AND still look relative. A write that broke either
        // property is invisible to it — the specifier is simply no longer one
        // of the things it collects. Resolvability is still the property a consumer
        // depends on, and it is the one thing the rewrite cannot verify about
        // its own output.
        //
        // What this no longer has to worry about is what the raw-text version
        // could not tell apart: a string-literal type, and a relative path in a
        // preserved TSDoc `@example`. Neither names a module, so neither is
        // collected, and the comment map that existed to distinguish them is
        // gone. A relative `./data.json` import is NOT in that group — it is a
        // real module specifier, it is collected, and it still fails the build
        // from the rewrite, which is the honest answer for a path that no
        // declaration sits beside.
        const parsed = parseDeclaration(text);
        const named = moduleSpecifiers(parsed)
          .map(found => [found.text, found.declarationAllowed])
          .filter(([spec]) => /^\.\.?(\/|$)/.test(spec));
        // A `reference path` is a comment TypeScript nonetheless follows, so it
        // is not a module specifier and has to be collected separately.
        const referenced = referencedPaths(parsed);
        const broken = [
          ...new Set(
            [
              ...named.map(([spec, declarationAllowed]) => [
                spec,
                specifierResolves(root, file, spec, declarationAllowed),
              ]),
              ...referenced.map(spec => [
                spec,
                resolvesToDeclaration(root, file, spec),
              ]),
            ]
              .filter(([, resolved]) => !resolved)
              .map(([spec]) => spec)
          ),
        ];
        if (broken.length) {
          throw new Error(
            `${file} has relative specifiers that resolve to no declaration ` +
              `after the rewrite: ${broken.join(', ')}. They would ship ` +
              'pointing nowhere. If this names a file you did not expect, ' +
              '`dist` is never cleaned — a declaration left by an earlier emit ' +
              'is held to the same standard, and `pnpm --filter ' +
              '@allxsmith/bestax-bulma clean` clears it.'
          );
        }
      }
    },
  };
};

/**
 * Whether a declaration carries anything that makes copying it to a `.d.cts`
 * unsound.
 *
 * A real `from '…'` and the `import('./x').Y` form tsc emits for a type it
 * reaches without an explicit import both resolve as CommonJS inside a
 * `.d.cts`, which is what puts TS1479 back for the `node16` consumer that file
 * exists to serve. A side-effect `import './x';` is the same problem with no
 * binding attached, and nothing downstream re-reads this file, so a pattern
 * built around `from` let the one shape with no `from` through.
 *
 * `declare module './x'` is matched for its target rather than its flavour: the
 * copy lands a directory up, so a relative one moves. Only the relative spelling
 * counts — `declare module 'react'` is an augmentation of a package and names no
 * path, which is why the one in `src/elements/Icon.tsx` is not a problem and the
 * post-pass ignores it too.
 *
 * The parser answers this, because the pattern that used to had grown one
 * alternative per review round and was patched rather than complete: it wanted
 * `from` on the same line as its `import`, so a wrapped import list named a
 * module it could not see. Enumerating the shapes instead of extending the
 * pattern is what found that, and the enumeration is in the test.
 *
 * The other two matter for a second reason as well: they are relative, and the
 * copy lands one directory up, so their targets would shift even if the flavour
 * were fine. A `/// <reference path>` is a comment, which is exactly why a
 * pattern built around `from` could not see it, and `import x = require('./y')`
 * carries no `from` at all.
 *
 * Exported because the export-map test asserts the same property against the
 * real built declaration. Spelled once, or widening one leaves the other
 * describing a narrower rule than it checks.
 */
export const hasModuleSpecifiers = text => {
  const sourceFile = parseDeclaration(text);
  // All THREE triple-slash forms. Only `path` moves with the copy; `types` and
  // `lib` do not, but the pattern this replaced flagged every `<reference`, and
  // swapping it for the parser was meant to close holes rather than open one.
  // `lib` is here because leaving it out is precisely the loosening the line
  // above told itself not to do.
  if (sourceFile.referencedFiles.length) return true;
  if (sourceFile.typeReferenceDirectives.length) return true;
  if (sourceFile.libReferenceDirectives.length) return true;
  let found = false;
  const visit = node => {
    if (found) return;
    if (
      ts.isImportDeclaration(node) ||
      ts.isImportTypeNode(node) ||
      ts.isExternalModuleReference(node) ||
      // `export { A }` with no `from` names nothing, so the specifier is what
      // makes it one of these rather than the keyword.
      (ts.isExportDeclaration(node) && node.moduleSpecifier) ||
      // `declare module './x'` moves with the copy; `declare module 'react'`
      // augments a package and names no path.
      (ts.isModuleDeclaration(node) &&
        ts.isStringLiteral(node.name) &&
        /^\.\.?(\/|$)/.test(node.name.text))
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
};

/**
 * Write `dist/constants.d.cts`, the `types` target for the `require`
 * condition of the `./constants` export.
 *
 * One `types` target cannot describe both conditions here. This package is
 * `"type": "module"`, so TypeScript reads a `.d.ts` as ESM, and a
 * `module: node16` CommonJS consumer answers
 * `import { validColors } from '@allxsmith/bestax-bulma/constants'` with
 * TS1479 — "the referenced file is an ECMAScript module and cannot be
 * imported with 'require'" — even though the file the require condition
 * points at is genuine CommonJS and loads fine. The same shape as the
 * `constants.cjs` naming below: the runtime and the types each need the
 * extension that says what they are.
 *
 * Copying the declaration verbatim is sound only because
 * `bulmaClassHelpers.ts` imports nothing, so its declaration has no
 * specifiers to resolve. A `.d.cts` that re-exported from the `.d.ts`
 * would reintroduce TS1479 one level down.
 * `scripts/constants-subpath.test.mjs` asserts the copy byte for byte and
 * typechecks a real node16 CommonJS consumer against it.
 *
 * Three different things enforce the import-free property, which is worth
 * knowing before relying on any one of them. This entry has no `resolve()`,
 * so an extensionless relative import fails the bundle outright. A bare
 * package import is externalised, and React specifically is caught by the
 * React-free assertion in that same test. Only an import rollup can resolve
 * on its own reaches the check below, which is why the check is here rather
 * than being left to the test.
 */
/**
 * Mirror `dist/types` into `dist/types-cjs` and mark it CommonJS, so the
 * `require` condition has declarations of the right flavour (#698).
 *
 * The package is `type: module`, so every emitted `.d.ts` reads as an ES module
 * and a `moduleResolution: node16` consumer that REQUIRES the package meets
 * TS1479 — "the referenced file is an ECMAScript module and cannot be imported
 * with 'require'". One `types` target cannot describe both conditions.
 *
 * A nested `{"type":"commonjs"}` does the whole job, which is why this is a copy
 * rather than a second declaration emit. Flavour comes from the nearest manifest,
 * so the same bytes read as CommonJS from under `dist/types-cjs` — no `.d.cts`
 * renaming, and no rewriting `./x.js` to `./x.cjs`, because inside that tree
 * `./x.js` already resolves to a CommonJS `x.d.ts`. The specifiers the main pass
 * wrote are correct here unchanged, which is the whole reason this is cheap.
 *
 * Measured before choosing it: all five consumer shapes — node16 and nodenext,
 * CommonJS and ESM, plus bundler — typecheck clean against a package laid out
 * this way, where node16 CommonJS is TS1479 without it. The cost is one extra
 * copy of the declarations, about 6% of unpacked `dist`.
 *
 * Runs from `closeBundle` at config level, after `declarationExtensions` has
 * given every specifier its extension — copying before that would mirror a tree
 * whose specifiers do not resolve, and the post-pass there would never see the
 * copy.
 */
const commonjsDeclarationTypes = (
  from = 'dist/types',
  to = 'dist/types-cjs'
) => {
  let failed = false;
  let started = 0;
  let wrote = 0;
  return {
    name: 'bestax-commonjs-declaration-types',
    buildStart() {
      failed = false;
      started = 0;
      wrote = 0;
    },
    buildEnd(error) {
      if (error) failed = true;
    },
    renderError() {
      failed = true;
    },
    renderStart() {
      started += 1;
    },
    writeBundle() {
      wrote += 1;
    },
    async closeBundle(error) {
      // The same latch `declarationExtensions` carries, for the same reason:
      // `closeBundle` fires on every failure path too, and this hook's own
      // error would replace the real one.
      if (failed || error || started === 0 || wrote !== started) return;
      let entries;
      try {
        entries = await readdir(from, { withFileTypes: true });
      } catch (readError) {
        if (readError.code === 'ENOENT') {
          throw new Error(
            `${from} is missing, so ${to} cannot be written. It comes from the ` +
              'declaration pass, which has to run before this.'
          );
        }
        throw readError;
      }
      if (!entries.length) {
        throw new Error(
          `${from} is empty, so ${to} would describe nothing. The declaration ` +
            'pass has to run before this.'
        );
      }
      // NO `rm` first, deliberately. `pnpm all` hands `build` and
      // `bundle:stats` to one `turbo run` with no edge between them, and both
      // are `rollup -c` over this same `dist` — so they run concurrently. Two
      // processes writing identical bytes is harmless and is what happened
      // before this plugin existed; one of them clearing the directory first is
      // not. The loud outcome is a `cp` that fails mid-walk; the quiet one is an
      // `rm` landing after the other process wrote the manifest, leaving a tree
      // with no `package.json`, which falls back to the root `type: module` and
      // puts TS1479 back with a green gate.
      //
      // `cp` overwrites, so a rebuild refreshes every file that still exists. A
      // declaration deleted from `src` leaves a stale copy here — the same thing
      // `dist` already does everywhere else, since nothing cleans it, and the
      // extension pass holds the source tree to resolving rather than this one.
      await cp(from, to, { recursive: true });
      // The whole mechanism. Flavour is decided by the nearest manifest, so this
      // one line is what makes the copied declarations CommonJS.
      await writeFile(
        join(to, 'package.json'),
        `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
        'utf8'
      );
    },
  };
};

const constantsCjsTypes = () => ({
  name: 'bestax-constants-cjs-types',
  async writeBundle() {
    const from = 'dist/types/helpers/bulmaClassHelpers.d.ts';
    const to = 'dist/constants.d.cts';
    let declaration;
    try {
      declaration = await readFile(from, 'utf8');
    } catch {
      // The main bundle's declaration pass writes this, and an array of
      // rollup configs is built in order, so it is already there. Fail loudly
      // rather than shipping an export whose types resolve to nothing.
      throw new Error(
        `${from} is missing, so ${to} cannot be written. It comes from the ` +
          "main bundle's declaration pass, which has to run before this " +
          'entry.'
      );
    }
    if (hasModuleSpecifiers(declaration)) {
      throw new Error(
        `${from} now has module specifiers, so copying it to a .d.cts no ` +
          'longer describes a CommonJS module, and any relative target would ' +
          'move with the copy. Keep that file import-free, which the ' +
          './constants export depends on anyway.'
      );
    }
    await writeFile(to, declaration, 'utf8');
  },
});

const variationBuild = name => ({
  input: `src/scss/versions/${name}.scss`,
  output: { file: `dist/versions/${name}.js`, format: 'es' },
  plugins: [scss({ ...scssBase, fileName: `${name}.css` })],
  onwarn(warning, warn) {
    if (warning.code === 'EMPTY_BUNDLE') return;
    warn(warning);
  },
});

export default commandLineArgs => {
  const isVisualizerEnabled = commandLineArgs.configPlugin === 'visualizer';
  return [
    // Main JS bundle
    {
      input: 'src/index.ts',
      output: [
        {
          dir: 'dist',
          format: 'cjs',
          sourcemap: true,
          // `.cjs`, not `.cjs.js`: this package is `"type": "module"`, so
          // Node reads a `.js` file as ESM whatever format rollup wrote into
          // it, and this bundle's `require(...)` calls are then evaluated in
          // module scope where `require` does not exist. The extension is the
          // only thing that overrides `type` (#688).
          entryFileNames: 'index.cjs',
          // Chunks need the extension for the same reason the entry does. This
          // build emits one chunk today, so nothing is currently wrong — but
          // the first dynamic import would split it, and the default
          // `[name]-[hash].js` would have `index.cjs` requiring `.js` files
          // that Node reads as ESM. That is #688 again in a shape neither the
          // manifest rule nor the artifact test can see, since neither looks
          // past the entry points.
          chunkFileNames: '[name]-[hash].cjs',
          banner: aiBanner,
        },
        {
          dir: 'dist',
          format: 'esm',
          sourcemap: true,
          entryFileNames: 'index.esm.js',
          banner: aiBanner,
        },
      ],
      plugins: [
        // Config level, so `closeBundle` fires once after BOTH outputs have
        // written — the declarations are re-emitted for each of them, and the
        // CLI writes a config's outputs concurrently. It is also this config
        // whose TypeScript pass produces `dist/types`, which is what makes it
        // correct under `--watch`: that rebuilds only the config whose inputs
        // changed, so a rewrite hung off any other entry never runs.
        declarationExtensions(),
        // After it: this mirrors what that pass has finished rewriting.
        commonjsDeclarationTypes(),
        resolve(),
        commonjs(),
        typescript({
          tsconfig: './tsconfig.json',
          declaration: true,
          declarationDir: 'dist/types',
          rootDir: 'src',
          exclude: [
            '**/__tests__/**/*',
            '**/*.test.tsx',
            '**/__typetests__/**/*',
          ],
        }),
        isVisualizerEnabled &&
          visualizer({
            filename: 'dist/stats.html',
            title: 'Bundle Stats - @allxsmith/bestax',
            sourcemap: true,
            gzipSize: true,
          }),
      ].filter(Boolean),
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // Constants bundle — the helper value tuples with no React and no
    // component code, so tooling (the ESLint plugin) can read them without
    // loading the library. Declarations come from the main bundle's pass,
    // which already emits dist/types/helpers/bulmaClassHelpers.d.ts.
    {
      input: 'src/helpers/bulmaClassHelpers.ts',
      output: [
        {
          dir: 'dist',
          format: 'cjs',
          sourcemap: true,
          // `.cjs`, not `.cjs.js`: this package is `"type": "module"`, so Node
          // reads a `.js` file as ESM whatever the bundle's format is, and a
          // bundle writing `exports.x = …` cannot load as CommonJS under that
          // reading. What a caller SEES varies with the bundle's own code and
          // the runtime, so it is not worth predicting here: this package's
          // bundles throw on both, and packages exist that load with a
          // populated namespace instead. The reason to use `.cjs` does not
          // depend on which.
          entryFileNames: 'constants.cjs',
          // Same reason as the main bundle's: a split chunk under rollup's
          // default `[name]-[hash].js` would be required by a `.cjs` and read
          // as ESM.
          chunkFileNames: '[name]-[hash].cjs',
          banner: aiBanner,
          // `constantsCjsTypes` reads a declaration the MAIN bundle's pass
          // writes — this config emits none — so it belongs on a config that
          // runs after that one. Rollup builds the configs in the array in
          // order, which is what makes that true. It sits on the OUTPUT rather
          // than in this config's plugin array only because `writeBundle` is an
          // output hook; either would run late enough.
          plugins: [constantsCjsTypes()],
        },
        {
          dir: 'dist',
          format: 'esm',
          sourcemap: true,
          entryFileNames: 'constants.esm.js',
          banner: aiBanner,
        },
      ],
      plugins: [
        typescript({
          tsconfig: './tsconfig.json',
          declaration: false,
          declarationMap: false,
          declarationDir: undefined,
          outDir: undefined,
          // This entry is one file; compiling the whole program for it cost
          // seconds and pulled in the tests.
          include: ['src/helpers/bulmaClassHelpers.ts'],
          exclude: [
            '**/__tests__/**/*',
            '**/*.test.tsx',
            '**/__typetests__/**/*',
          ],
        }),
      ],
      // No resolve()/commonjs(): this module imports nothing, so bundling
      // node_modules is work with no output. `external` still matters — the
      // file also exports runtime helpers, and the first one to reach for
      // `useMemo` would otherwise inline React into a bundle whose whole
      // purpose is not needing it.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // SCSS extras bundle
    {
      input: 'src/scss/extras.scss',
      output: {
        file: 'dist/extras.js',
        format: 'es',
      },
      plugins: [scss({ ...scssBase, fileName: 'extras.css' })],
      onwarn(warning, warn) {
        // Suppress empty bundle warning for SCSS-only build
        if (warning.code === 'EMPTY_BUNDLE') return;
        warn(warning);
      },
    },
    // Combined Bulma + extras bundle
    {
      input: 'src/scss/bestax.scss',
      output: {
        file: 'dist/bestax.js',
        format: 'es',
      },
      plugins: [scss({ ...scssBase, fileName: 'bestax.css' })],
      onwarn(warning, warn) {
        if (warning.code === 'EMPTY_BUNDLE') return;
        warn(warning);
      },
    },
    // CSS variation builds
    variationBuild('bestax-prefixed'),
    variationBuild('bestax-no-helpers'),
    variationBuild('bestax-no-helpers-prefixed'),
    variationBuild('bestax-no-dark-mode'),
  ];
};
