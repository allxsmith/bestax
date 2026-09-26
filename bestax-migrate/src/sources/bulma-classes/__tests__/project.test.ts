/**
 * What the transform learns about a project from its manifests and
 * tsconfigs. Each case is a package written to a temp directory.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeProject, runtimeOf } from '../project.js';

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function pkg(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-bc-project-'));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

describe('runtimeOf', () => {
  const react = { react: '^18.2.0' };

  it("reads the tsconfig's jsxImportSource", () => {
    const dir = pkg({
      'tsconfig.json':
        '{\n  // Preact renders the JSX\n  "compilerOptions": { "jsxImportSource": "preact" }\n}\n',
    });
    expect(runtimeOf(dir, react)).toBe('preact');
  });

  it('ignores a jsxImportSource that is commented out', () => {
    const line = pkg({
      'tsconfig.json':
        '{\n  "compilerOptions": {\n    // "jsxImportSource": "preact",\n    "jsx": "react-jsx"\n  }\n}\n',
    });
    const block = pkg({
      'tsconfig.json':
        '{\n  /* "jsxImportSource": "preact" */\n  "compilerOptions": { "jsx": "react-jsx" }\n}\n',
    });
    expect(runtimeOf(line, react)).toBe('react');
    expect(runtimeOf(block, react)).toBe('react');
  });

  describe('through extends', () => {
    const base = '{ "compilerOptions": { "jsxImportSource": "preact" } }\n';

    it('inherits a base config named by path, with or without .json', () => {
      const root = pkg({
        'tsconfig.base.json': base,
        'apps/web/tsconfig.json':
          '{\n  // shared settings\n  "extends": "../../tsconfig.base.json"\n}\n',
        'apps/admin/tsconfig.json': '{ "extends": "../../tsconfig.base" }\n',
      });
      expect(runtimeOf(path.join(root, 'apps/web'), react)).toBe('preact');
      expect(runtimeOf(path.join(root, 'apps/admin'), react)).toBe('preact');
    });

    it("prefers the config's own setting, then the later parent", () => {
      const root = pkg({
        'react.json': '{ "compilerOptions": { "jsxImportSource": "react" } }\n',
        'preact.json': base,
        'own/tsconfig.json':
          '{ "extends": "../preact.json", "compilerOptions": { "jsxImportSource": "react" } }\n',
        'list/tsconfig.json':
          '{ "extends": ["../preact.json", "../react.json"] }\n',
      });
      expect(runtimeOf(path.join(root, 'own'), {})).toBe('react');
      expect(runtimeOf(path.join(root, 'list'), {})).toBe('react');
    });

    it('stops at a cycle, and does not follow a package name', () => {
      const cycle = pkg({
        'tsconfig.json': '{ "extends": "./other.json" }\n',
        'other.json': '{ "extends": "./tsconfig.json" }\n',
      });
      const named = pkg({
        'tsconfig.json': '{ "extends": "@tsconfig/preact/tsconfig.json" }\n',
      });
      expect(runtimeOf(cycle, react)).toBe('react');
      expect(runtimeOf(named, react)).toBe('react');
    });
  });

  it('reads past a string holding // or /*', () => {
    const dir = pkg({
      'tsconfig.json':
        '{\n  "$schema": "https://json.schemastore.org/tsconfig",\n  "compilerOptions": { "outDir": "a/*b", "jsxImportSource": "preact" }\n}\n',
    });
    expect(runtimeOf(dir, react)).toBe('preact');
  });
});

describe('analyzeProject', () => {
  it('reads a runtime a shared package declares as a peer', () => {
    const dir = pkg({
      'package.json': JSON.stringify({
        name: 'ui',
        peerDependencies: { preact: '^10.0.0' },
      }),
    });
    expect(analyzeProject([dir]).jsxRuntimes).toEqual([
      { dir, runtime: 'preact' },
    ]);
  });
});
