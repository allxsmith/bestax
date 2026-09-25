/**
 * What the bulma-classes transform needs to know about the project and cannot
 * see from one file: which files a Next.js App Router may render as server
 * components, and which packages render JSX through a runtime other than
 * React.
 *
 * Read once per run, from every package.json the run touches: the nearest one
 * above each target, and every one below it, so a monorepo run from its root
 * still finds `apps/web`.
 */

import fs from 'node:fs';
import path from 'node:path';

/** `jsxImportSource` values whose JSX is React's. */
export const REACT_RUNTIMES: ReadonlySet<string> = new Set([
  'react',
  '@emotion/react',
  'theme-ui',
  '@theme-ui/core',
]);

/** Packages that bring a JSX runtime of their own. */
const OTHER_RUNTIMES = [
  'preact',
  'solid-js',
  'inferno',
  '@builder.io/qwik',
  'hono',
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.e2e-tmp',
]);

export interface JsxRuntime {
  /** A package's directory, absolute. */
  dir: string;
  /** `react`, or the other runtime its JSX renders through. */
  runtime: string;
}

/**
 * A Next.js package with an App Router. Any module in it can be rendered as a
 * server component (a component under `components/` is one when a server page
 * renders it), so every file counts but those under a Pages Router directory,
 * which are always client code.
 */
export interface ServerComponentRoot {
  dir: string;
  except: string[];
}

export interface ProjectFacts {
  serverComponentRoots: ServerComponentRoot[];
  jsxRuntimes: JsxRuntime[];
}

function nearestManifest(target: string): string | null {
  let dir = path.resolve(target);
  if (fs.statSync(dir, { throwIfNoEntry: false })?.isFile()) {
    dir = path.dirname(dir);
  }
  for (;;) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function manifestsBelow(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      manifestsBelow(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name === 'package.json') {
      out.push(path.join(dir, entry.name));
    }
  }
}

/**
 * JSONC without its comments. tsconfig allows them, and a commented-out
 * `jsxImportSource` is not one the package sets. Strings are copied as they
 * are, so a `//` inside one (a URL) survives.
 */
function withoutComments(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      let end = i + 1;
      while (end < text.length && text[end] !== '"') {
        end += text[end] === '\\' ? 2 : 1;
      }
      out += text.slice(i, end + 1);
      i = end;
    } else if (char === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
      out += '\n';
    } else if (char === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 1;
    } else {
      out += char;
    }
  }
  return out;
}

/** Where a relative `extends` points: the file as named, else with `.json`. */
function extendedFile(fromDir: string, spec: string): string {
  const file = path.resolve(fromDir, spec);
  return fs.statSync(file, { throwIfNoEntry: false })?.isFile()
    ? file
    : `${file}.json`;
}

/**
 * The `jsxImportSource` a config sets, or inherits through `extends`: its own
 * setting first, then its parents, a later one in an `extends` list over an
 * earlier one, as TypeScript reads them. A parent named by path is followed
 * (the usual monorepo base config); one named as a package is not.
 */
function importSourceOf(file: string, seen: Set<string>): string | null {
  if (seen.has(file)) return null;
  seen.add(file);
  let text: string;
  try {
    text = withoutComments(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  const own = text.match(/"jsxImportSource"\s*:\s*"([^"]+)"/);
  if (own) return own[1];
  const extendsValue = text.match(/"extends"\s*:\s*("[^"]*"|\[[^\]]*\])/)?.[1];
  const parents = [...(extendsValue ?? '').matchAll(/"([^"]+)"/g)]
    .map(match => match[1])
    .filter(spec => spec.startsWith('.') || path.isAbsolute(spec))
    .map(spec => extendedFile(path.dirname(file), spec));
  for (const parent of parents.reverse()) {
    const inherited = importSourceOf(parent, seen);
    if (inherited) return inherited;
  }
  return null;
}

/** The `jsxImportSource` a package's tsconfig or jsconfig sets, if any. */
function configuredImportSource(dir: string): string | null {
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const found = importSourceOf(path.join(dir, name), new Set());
    if (found) return found;
  }
  return null;
}

/**
 * The JSX runtime a package declares: what its tsconfig's `jsxImportSource`
 * names, else React when it depends on React, else the first other runtime
 * it depends on, else null.
 */
export function runtimeOf(
  dir: string,
  deps: Readonly<Record<string, string | undefined>>
): string | null {
  const configured = configuredImportSource(dir);
  if (configured) return REACT_RUNTIMES.has(configured) ? 'react' : configured;
  if (deps.react) return 'react';
  return OTHER_RUNTIMES.find(name => deps[name]) ?? null;
}

export function analyzeProject(targets: string[]): ProjectFacts {
  const manifests = new Set<string>();
  for (const target of targets) {
    const nearest = nearestManifest(target);
    if (nearest) manifests.add(path.resolve(nearest));
    const below: string[] = [];
    if (fs.statSync(target, { throwIfNoEntry: false })?.isDirectory()) {
      manifestsBelow(path.resolve(target), below);
    }
    for (const manifest of below) manifests.add(manifest);
  }

  const facts: ProjectFacts = { serverComponentRoots: [], jsxRuntimes: [] };
  for (const manifest of [...manifests].sort()) {
    let pkg: Record<string, Record<string, string> | undefined>;
    try {
      // A byte-order mark is legal in a file JSON.parse will not read.
      pkg = JSON.parse(
        fs.readFileSync(manifest, 'utf8').replace(/^\uFEFF/, '')
      );
    } catch {
      continue;
    }
    const deps = {
      ...pkg.peerDependencies,
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    const dir = path.dirname(manifest);
    const hasAppRouter = ['app', path.join('src', 'app')].some(candidate =>
      fs.existsSync(path.join(dir, candidate))
    );
    if (deps.next && hasAppRouter) {
      facts.serverComponentRoots.push({
        dir,
        except: ['pages', path.join('src', 'pages')].map(pages =>
          path.join(dir, pages)
        ),
      });
    }
    const runtime = runtimeOf(dir, deps);
    if (runtime) facts.jsxRuntimes.push({ dir, runtime });
  }
  return facts;
}
