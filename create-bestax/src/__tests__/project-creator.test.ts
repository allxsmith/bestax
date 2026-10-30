import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TEMPLATES } from '../constants.js';

// Mock fs-extra
jest.unstable_mockModule('fs-extra', () => ({
  default: {
    existsSync: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readJson: jest.fn(),
    writeJson: jest.fn(),
    readdirSync: jest.fn(),
    emptyDir: jest.fn(),
    ensureDir: jest.fn(),
    copy: jest.fn(),
  },
  existsSync: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn(),
  readdirSync: jest.fn(),
  emptyDir: jest.fn(),
  ensureDir: jest.fn(),
  copy: jest.fn(),
}));

// Mock prompts
jest.unstable_mockModule('prompts', () => ({
  default: jest.fn(),
}));

// Mock file-system module
jest.unstable_mockModule('../file-system.js', () => ({
  checkDirectoryExists: jest.fn(),
  isDirectoryEmpty: jest.fn(),
  listDirectoryEntries: jest.fn(async () => []),
  findNonDirectoryInPath: jest.fn(async () => null),
  realPath: jest.fn(async (p: string) => p),
  emptyDirectory: jest.fn(),
  ensureDirectory: jest.fn(),
  copyDirectory: jest.fn(),
  updatePackageJson: jest.fn(),
}));

// Mock the command runner so --immediate never installs or starts anything
jest.unstable_mockModule('../run-command.js', () => ({
  runCommand: jest.fn(() => 0),
}));

// Mock telemetry so create() never reads the real config or hits the network
jest.unstable_mockModule('../telemetry.js', () => ({
  reportScaffold: jest.fn(async () => undefined),
}));

// The range this CLI's manifest gives the library, as a published build
// reads it. library-range.test.ts covers the read itself.
const LIBRARY_RANGE = '^5.43.0';
const LIBRARY_DEPENDENCY = { '@allxsmith/bestax-bulma': LIBRARY_RANGE };
jest.unstable_mockModule('../library-range.js', () => ({
  LIBRARY: '@allxsmith/bestax-bulma',
  libraryRange: jest.fn(() => LIBRARY_RANGE),
}));

const fs = await import('fs-extra');
const prompts = (await import('prompts')).default;
const fileSystem = await import('../file-system.js');
const telemetry = await import('../telemetry.js');
const { runCommand } = await import('../run-command.js');
const { libraryRange } = await import('../library-range.js');
const { ProjectCreator, entryFile } = await import('../project-creator.js');
const listDirectoryEntries =
  fileSystem.listDirectoryEntries as jest.MockedFunction<
    typeof fileSystem.listDirectoryEntries
  >;
const findNonDirectoryInPath =
  fileSystem.findNonDirectoryInPath as jest.MockedFunction<
    typeof fileSystem.findNonDirectoryInPath
  >;
const realPath = fileSystem.realPath as jest.MockedFunction<
  typeof fileSystem.realPath
>;
const { ICON_LIBRARIES: _ICON_LIBRARIES, BULMA_FLAVORS: _BULMA_FLAVORS } =
  await import('../constants.js');

// Mock console methods
const originalConsole = { ...console };
const originalIsTTYDescriptor = Object.getOwnPropertyDescriptor(
  process.stdin,
  'isTTY'
);

function setStdinTTY(value: boolean | undefined): void {
  Object.defineProperty(process.stdin, 'isTTY', {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreStdinTTY(): void {
  if (originalIsTTYDescriptor) {
    Object.defineProperty(process.stdin, 'isTTY', originalIsTTYDescriptor);
  } else {
    delete (process.stdin as { isTTY?: boolean }).isTTY;
  }
}

const originalStdoutTTYDescriptor = Object.getOwnPropertyDescriptor(
  process.stdout,
  'isTTY'
);

function setStdoutTTY(value: boolean | undefined): void {
  Object.defineProperty(process.stdout, 'isTTY', {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreStdoutTTY(): void {
  if (originalStdoutTTYDescriptor) {
    Object.defineProperty(process.stdout, 'isTTY', originalStdoutTTYDescriptor);
  } else {
    delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
}

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  // ProjectCreator falls through to interactive prompts, which are guarded
  // against non-TTY stdin (#192); jest's stdin is not a TTY, so simulate one.
  setStdinTTY(true);
  jest.clearAllMocks();
  // A target directory is missing or empty unless a test says otherwise; reset
  // here because clearAllMocks keeps a previous test's implementation.
  listDirectoryEntries.mockResolvedValue([]);
  // Nothing on the path is a file, and no path is a symbolic link.
  findNonDirectoryInPath.mockResolvedValue(null);
  realPath.mockImplementation(async p => p);
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  restoreStdinTTY();
});

describe('ProjectCreator', () => {
  let projectCreator: InstanceType<typeof ProjectCreator>;

  beforeEach(() => {
    projectCreator = new ProjectCreator();
  });

  describe('getProjectName', () => {
    it('should return valid project name when provided', async () => {
      const result = await projectCreator.getProjectName('my-project');
      expect(result).toBe('my-project');
    });

    it('should return null for invalid project name', async () => {
      const result = await projectCreator.getProjectName('my@invalid$project');
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Project name can only contain')
      );
    });

    it('should return null for dot names that would target the parent directory', async () => {
      for (const name of ['..', '.hidden', 'apps/.']) {
        const result = await projectCreator.getProjectName(name);
        expect(result).toBeNull();
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Project name cannot start with a dot')
        );
      }
    });

    it('takes "." alone as the current directory, named after it', async () => {
      expect(await projectCreator.getProjectName('.')).toBe('.');
    });

    it('returns a path as typed when its last part is a valid name (#1154)', async () => {
      for (const dir of ['scratch/login', '/tmp/a/b/login', 'login/']) {
        expect(await projectCreator.getProjectName(dir)).toBe(dir);
      }
    });

    it('rejects a path whose last part is invalid, naming that part (#1154)', async () => {
      const result = await projectCreator.getProjectName('/tmp/My App');
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('the project name is "My App"')
      );
    });

    it('should prompt for project name when not provided', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        projectName: 'prompted-project',
      });
      const result = await projectCreator.getProjectName();
      expect(result).toBe('prompted-project');
    });

    it('should return null when prompt is cancelled', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});
      const result = await projectCreator.getProjectName();
      expect(result).toBeNull();
    });
  });

  describe('checkExistingDirectory', () => {
    const confirm = prompts as jest.MockedFunction<typeof prompts>;

    function errorOutput(): string {
      return (console.error as jest.Mock).mock.calls.flat().join('\n');
    }

    it('has nothing to remove when the directory is missing or empty', async () => {
      listDirectoryEntries.mockResolvedValue([]);

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );

      expect(result).toBe('empty');
      expect(confirm).not.toHaveBeenCalled();
    });

    it('counts a directory holding only .git as empty, as create-vite does, --overwrite or not', async () => {
      listDirectoryEntries.mockResolvedValue(['.git']);

      for (const options of [undefined, { yes: true, overwrite: true }]) {
        expect(
          await projectCreator.checkExistingDirectory(
            '/path/to/project',
            'project',
            options
          )
        ).toBe('empty');
      }
      expect(confirm).not.toHaveBeenCalled();
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
    });

    it('asks before removing files, and only records the answer (#945)', async () => {
      listDirectoryEntries.mockResolvedValue(['notes.txt']);
      confirm.mockResolvedValue({ overwrite: true });

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );

      expect(result).toBe('overwrite');
      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'overwrite',
          message: expect.stringContaining('(notes.txt)'),
        })
      );
      // Emptying waits for the last prompt, so a later Ctrl+C keeps the files.
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
    });

    it('stops with "Operation cancelled" when the user declines', async () => {
      listDirectoryEntries.mockResolvedValue(['notes.txt']);
      confirm.mockResolvedValue({ overwrite: false });

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );

      expect(result).toBe('stop');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Operation cancelled')
      );
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
    });

    it('takes --overwrite as the answer without asking', async () => {
      listDirectoryEntries.mockResolvedValue(['notes.txt']);

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project',
        { overwrite: true }
      );

      expect(result).toBe('overwrite');
      expect(confirm).not.toHaveBeenCalled();
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
    });

    it('refuses under -y, naming what is there and the --overwrite flag', async () => {
      listDirectoryEntries.mockResolvedValue(['.git', 'notes.txt', 'src']);

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project',
        { yes: true }
      );

      expect(result).toBe('stop');
      expect(confirm).not.toHaveBeenCalled();
      expect(errorOutput()).toContain('project is not empty');
      expect(errorOutput()).toContain('.git, notes.txt, src');
      expect(errorOutput()).toContain('--overwrite');
    });

    it('stops with a plain message when the path is a file, not a directory', async () => {
      findNonDirectoryInPath.mockResolvedValueOnce('/path/to/notes.txt');

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/notes.txt',
        'notes.txt',
        { yes: true, overwrite: true }
      );

      expect(result).toBe('stop');
      expect(listDirectoryEntries).not.toHaveBeenCalled();
      expect(errorOutput()).toContain(
        'notes.txt already exists and is not a directory'
      );
    });

    it('names a file standing where a parent folder should be (#1154)', async () => {
      findNonDirectoryInPath.mockResolvedValueOnce('/path/to/notes.txt');

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/notes.txt/login',
        'to/notes.txt/login',
        { yes: true, overwrite: true }
      );

      expect(result).toBe('stop');
      expect(findNonDirectoryInPath).toHaveBeenCalledWith(
        '/path/to/notes.txt/login'
      );
      expect(listDirectoryEntries).not.toHaveBeenCalled();
      expect(errorOutput()).toContain(
        '/path/to/notes.txt already exists and is not a directory'
      );
    });

    describe('the working directory, under any spelling (#310, #1154)', () => {
      const cwd = process.cwd();
      const holdsCwd = 'is or holds the current directory';

      beforeEach(() => {
        listDirectoryEntries.mockResolvedValue(['package.json', 'src']);
      });

      it.each([
        ['"../<its name>"', `../${path.basename(cwd)}`],
        ['its absolute path', cwd],
        ['its absolute path with a trailing slash', `${cwd}/`],
        ['its parent', path.dirname(cwd)],
        ['an ancestor further up', path.dirname(path.dirname(cwd))],
      ])(
        'is never emptied when the path is %s, even with --overwrite',
        async (_label, dir) => {
          const result = await projectCreator.checkExistingDirectory(
            path.resolve(cwd, dir),
            dir,
            { yes: true, overwrite: true }
          );

          expect(result).toBe('stop');
          expect(errorOutput()).toContain(`${dir} ${holdsCwd}`);
        }
      );

      it('is not offered for emptying at the prompt either', async () => {
        const result = await projectCreator.checkExistingDirectory(
          cwd,
          cwd,
          {}
        );

        expect(result).toBe('stop');
        expect(confirm).not.toHaveBeenCalled();
        expect(errorOutput()).toContain(holdsCwd);
      });

      it('is matched through a symbolic link', async () => {
        realPath.mockImplementation(async p => (p === '/alias' ? cwd : p));

        const result = await projectCreator.checkExistingDirectory(
          '/alias',
          '/alias',
          { overwrite: true }
        );

        expect(result).toBe('stop');
        expect(errorOutput()).toContain(holdsCwd);
      });

      it('is still scaffolded into when it is empty, since nothing is removed', async () => {
        listDirectoryEntries.mockResolvedValue([]);

        expect(
          await projectCreator.checkExistingDirectory(cwd, cwd, {
            overwrite: true,
          })
        ).toBe('empty');
      });

      it.each([
        ['a folder inside it', path.join(cwd, 'apps', 'login')],
        ['a sibling of it', path.join(path.dirname(cwd), 'other-app')],
        [
          'a folder inside it whose name starts with ".."',
          path.join(cwd, '..login'),
        ],
      ])('leaves %s to --overwrite as before', async (_label, dir) => {
        expect(
          await projectCreator.checkExistingDirectory(dir, dir, {
            overwrite: true,
          })
        ).toBe('overwrite');
      });

      it('still finds it when its own name starts with ".."', async () => {
        realPath.mockImplementation(async p =>
          p === cwd ? '/work/..login' : p
        );

        expect(
          await projectCreator.checkExistingDirectory('/work', '/work', {
            overwrite: true,
          })
        ).toBe('stop');
      });
    });

    it('lists a long directory by its first entries and a count', async () => {
      listDirectoryEntries.mockResolvedValue(
        Array.from({ length: 9 }, (_, i) => `file-${i}.txt`)
      );

      await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project',
        { yes: true }
      );

      expect(errorOutput()).toContain('file-4.txt and 4 more');
      expect(errorOutput()).not.toContain('file-5.txt');
    });

    it('without a terminal, points at --overwrite rather than -y', async () => {
      setStdinTTY(undefined);
      listDirectoryEntries.mockResolvedValue(['notes.txt']);

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );

      expect(result).toBe('stop');
      expect(confirm).not.toHaveBeenCalled();
      expect(errorOutput()).toContain('--overwrite');
      // The generic no-TTY advice ends in -y, which never removes files.
      expect(errorOutput()).not.toContain('No interactive terminal detected');
    });
  });

  describe('getTemplatePath', () => {
    it('should return correct template path', () => {
      const result = projectCreator.getTemplatePath('vite');
      expect(result).toContain('templates');
      expect(result).toContain('vite');
    });
  });

  describe('copyTemplate', () => {
    it('should ensure directory and copy template', async () => {
      await projectCreator.copyTemplate('vite', '/target/path');

      expect(fileSystem.ensureDirectory).toHaveBeenCalledWith('/target/path');
      expect(fileSystem.copyDirectory).toHaveBeenCalledWith(
        expect.stringContaining('vite'),
        '/target/path',
        { _gitignore: '.gitignore', '_oxlintrc.json': '.oxlintrc.json' }
      );
    });
  });

  describe('setupSkills', () => {
    it('copies the bundled skills and writes CLAUDE.md when the bundle exists', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);

      await projectCreator.setupSkills('/target/path', 'my-app', {
        bulmaFlavor: 'complete',
        iconLibrary: 'none',
      });

      expect(fs.default.copy).toHaveBeenCalledWith(
        expect.stringContaining('skills'),
        expect.stringContaining('.claude/skills')
      );
      expect(fs.default.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('CLAUDE.md'),
        expect.stringContaining('my-app')
      );
      const written = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).includes('CLAUDE.md'))?.[1];
      expect(written).toContain('Bulma flavor: **complete**');
      expect(written).toContain('No icon library is installed');
      expect(written).not.toContain('classPrefix');
    });

    it('writes .claude/launch.json for the browser preview alongside the skills', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);

      await projectCreator.setupSkills('/target/path', 'my-app', {
        bulmaFlavor: 'complete',
        iconLibrary: 'none',
      });

      const written = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).includes('launch.json'))?.[1];
      expect(written).toBeDefined();
      const launch = JSON.parse(String(written));
      expect(launch.configurations).toHaveLength(1);
      expect(launch.configurations[0]).toEqual({
        name: 'dev',
        runtimeExecutable: 'npm',
        runtimeArgs: ['run', 'dev', '--', '--strictPort'],
        port: 5173,
      });
      // the scaffolded CLAUDE.md points agents at the launch config
      const claudeMd = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).includes('CLAUDE.md'))?.[1];
      expect(claudeMd).toContain('.claude/launch.json');
    });

    it('documents the prefix caveat and icon library for a prefixed scaffold', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);

      await projectCreator.setupSkills('/target/path', 'my-app', {
        bulmaFlavor: 'prefixed',
        iconLibrary: 'fontawesome',
      });

      const written = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).includes('CLAUDE.md'))?.[1];
      expect(written).toContain('classPrefix="bestax-"');
      expect(written).toContain('bestax-prefixed.css');
      expect(written).toContain('Icon library: **Font Awesome**');
      // fontawesome is the Icon default — no provider wrapper, no caveat
      expect(written).not.toContain('iconLibrary=');
    });

    it('documents the ConfigProvider iconLibrary caveat for a non-default icon library', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);

      await projectCreator.setupSkills('/target/path', 'my-app', {
        bulmaFlavor: 'complete',
        iconLibrary: 'mdi',
      });

      const written = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).includes('CLAUDE.md'))?.[1];
      expect(written).toContain('iconLibrary="mdi"');
      expect(written).toContain('extend that provider');
    });

    it('names the mapped provider value for ionicons in the caveat', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);

      await projectCreator.setupSkills('/target/path', 'my-app', {
        bulmaFlavor: 'complete',
        iconLibrary: 'ionicons',
      });

      const written = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).includes('CLAUDE.md'))?.[1];
      // the scaffolder writes iconLibrary="ion" (not "ionicons") into main.tsx
      expect(written).toContain('iconLibrary="ion"');
    });

    it('skips when the skills bundle is missing', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);

      await projectCreator.setupSkills('/target/path', 'my-app', {
        bulmaFlavor: 'complete',
        iconLibrary: 'none',
      });

      expect(fs.default.copy).not.toHaveBeenCalled();
      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('setupBulmaFlavor', () => {
    it('should update main file with Bulma flavor for JavaScript', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import React from 'react';\n// Import Bestax CSS (Bulma + extras)\nimport '@allxsmith/bestax-bulma/bestax.css';` as unknown
      );

      await projectCreator.setupBulmaFlavor(targetPath, 'complete', 'vite');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining("import '@allxsmith/bestax-bulma/bestax.css'")
      );
    });

    it('should update main file with Bulma flavor for TypeScript', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.tsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import React from 'react';\n// Import Bestax CSS (Bulma + extras)\nimport '@allxsmith/bestax-bulma/bestax.css';` as unknown
      );

      await projectCreator.setupBulmaFlavor(targetPath, 'prefixed', 'vite-ts');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining(
          "import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css'"
        )
      );
    });

    it('swaps the starter helper props for named classes under a no-helpers flavor', async () => {
      const targetPath = '/test/project';
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockImplementation((async (file: string) =>
        file.endsWith('App.tsx')
          ? '<Title size="1" textAlign="centered">x</Title>'
          : file.endsWith('App.css')
            ? '/* app */\n\n\n'
            : "import '@allxsmith/bestax-bulma/bestax.css';") as never);

      await projectCreator.setupBulmaFlavor(
        targetPath,
        'no-helpers',
        'vite-ts'
      );

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        '/test/project/src/App.tsx',
        '<Title size="1" className="page-title">x</Title>'
      );
      expect(fs.default.writeFile).toHaveBeenCalledWith(
        '/test/project/src/App.css',
        expect.stringMatching(
          /^\/\* app \*\/\n\n\/\* This flavor[\s\S]*\.page-title \{\n {2}text-align: center;\n\}/
        )
      );
    });

    it('leaves the starter alone when a no-helpers scaffold has no App files', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.replaceStarterHelperProps('/test/project', 'vite');

      expect(fs.default.readFile).not.toHaveBeenCalled();
      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });

    it('should handle unknown Bulma flavor gracefully', async () => {
      const targetPath = '/test/project';

      await projectCreator.setupBulmaFlavor(targetPath, 'unknown', 'vite');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Bulma flavor 'unknown' not found")
      );
    });
  });

  describe('setupIconLibrary - comprehensive coverage', () => {
    it('should add Icon to existing bestax-bulma import and add icons to cards', async () => {
      const targetPath = '/test/project';
      const appFilePath = '/test/project/src/App.jsx';
      const packageJsonPath = '/test/project/package.json';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(
        path => path === appFilePath || path === packageJsonPath
      );
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({
        dependencies: {},
      });
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import { Button, Card } from '@allxsmith/bestax-bulma';
        const App = () => (
          <Card.Header.Title>Quick Start</Card.Header.Title>
          <Card.Header.Title>Documentation</Card.Header.Title>
          <Card.Header.Title>Examples</Card.Header.Title>
        );` as unknown
      );

      await projectCreator.setupIconLibrary(targetPath, 'fontawesome', 'vite');

      const writeCall = (
        fs.default.writeFile as jest.MockedFunction<typeof fs.writeFile>
      ).mock.calls[0];
      expect(writeCall[0]).toBe(appFilePath);
      const writtenContent = writeCall[1] as string;

      // Check IconText was added to the import
      expect(writtenContent).toMatch(/Card,\n\s+IconText,\n\} from/);
      // Check each card title wraps its text in IconText
      expect(writtenContent).toContain("name: 'rocket'");
      expect(writtenContent).toContain("name: 'book'");
      expect(writtenContent).toContain("name: 'code'");
      expect(writtenContent).toMatch(
        /<Card\.Header\.Title>\n\s+<IconText\n[\s\S]*?Quick Start\n\s+<\/IconText>\n\s+<\/Card\.Header\.Title>/
      );
      // A margin helper would render nothing in the no-helpers flavors
      expect(writtenContent).not.toContain('mr=');
    });

    it('should handle App.jsx with Icon already in import', async () => {
      const targetPath = '/test/project';
      const appFilePath = '/test/project/src/App.jsx';
      const packageJsonPath = '/test/project/package.json';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(
        path => path === appFilePath || path === packageJsonPath
      );
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({
        dependencies: {},
      });
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import { Button, Card, Icon } from '@allxsmith/bestax-bulma';
        const App = () => (
          <Card.Header.Title>Quick Start</Card.Header.Title>
        );` as unknown
      );

      await projectCreator.setupIconLibrary(targetPath, 'mdi', 'vite');

      const writeCall = (
        fs.default.writeFile as jest.MockedFunction<typeof fs.writeFile>
      ).mock.calls[0];
      const writtenContent = writeCall[1] as string;

      // Should not duplicate Icon in import
      expect((writtenContent.match(/Icon/g) || []).length).toBeGreaterThan(0);
      // Should add MDI specific icons
      expect(writtenContent).toContain('rocket-launch');
    });

    it('should handle App.tsx file for TypeScript template', async () => {
      const targetPath = '/test/project';
      const appFilePath = '/test/project/src/App.tsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import { Button, Card } from '@allxsmith/bestax-bulma';
        const App: React.FC = () => (
          <Card.Header.Title>Quick Start</Card.Header.Title>
          <Card.Header.Title>Documentation</Card.Header.Title>
          <Card.Header.Title>Examples</Card.Header.Title>
        );` as unknown
      );

      await projectCreator.setupIconLibrary(targetPath, 'ionicons', 'vite-ts');

      const writeCall = (
        fs.default.writeFile as jest.MockedFunction<typeof fs.writeFile>
      ).mock.calls[0];
      expect(writeCall[0]).toBe(appFilePath);
      const writtenContent = writeCall[1] as string;

      expect(writtenContent).toContain('Icon');
      expect(writtenContent).toContain('rocket');
      expect(writtenContent).toContain('book');
      expect(writtenContent).toContain('code-slash');
    });
  });

  describe('updateReadme', () => {
    it('does nothing when the template has no README', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.updateReadme('/test/project', 'fontawesome');

      expect(fs.default.readFile).not.toHaveBeenCalled();
      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('updateIndexHtmlTitle', () => {
    it('replaces the stock <title> with the project name', async () => {
      const targetPath = '/test/project';
      const indexHtmlPath = '/test/project/index.html';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(path => path === indexHtmlPath);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        '<head><title>Bestax + Vite + React</title></head>' as unknown
      );

      await projectCreator.updateIndexHtmlTitle(targetPath, 'my-app');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        indexHtmlPath,
        '<head><title>my-app</title></head>'
      );
    });

    it('does nothing when index.html is missing', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.updateIndexHtmlTitle('/test/project', 'my-app');

      expect(fs.default.readFile).not.toHaveBeenCalled();
      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });

    it('leaves index.html untouched when it has no <title> tag', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue('<head></head>' as unknown);

      await projectCreator.updateIndexHtmlTitle('/test/project', 'my-app');

      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('setupIconLibrary', () => {
    it('should skip setup for none', async () => {
      await projectCreator.setupIconLibrary('/test/project', 'none', 'vite');

      expect(fs.default.readJson).not.toHaveBeenCalled();
      expect(fs.default.writeJson).not.toHaveBeenCalled();
    });

    it('should return early for unknown icon library', async () => {
      await projectCreator.setupIconLibrary(
        '/test/project',
        'unknown-library',
        'vite'
      );

      expect(fs.default.readJson).not.toHaveBeenCalled();
      expect(fs.default.writeJson).not.toHaveBeenCalled();
    });

    it('should add ionicons to index.html', async () => {
      const targetPath = '/test/project';
      const indexHtmlPath = '/test/project/index.html';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(
        path => path === indexHtmlPath || path === '/test/project/src/App.jsx'
      );
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(`<html><head></head><body></body></html>` as unknown);

      await projectCreator.setupIconLibrary(targetPath, 'ionicons', 'vite');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        indexHtmlPath,
        expect.stringContaining('unpkg.com/ionicons')
      );
    });

    it('should add FontAwesome to package.json and main file', async () => {
      const targetPath = '/test/project';
      const packageJsonPath = '/test/project/package.json';
      const _mainFilePath = '/test/project/src/main.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(
        path =>
          path === packageJsonPath ||
          path === _mainFilePath ||
          path === '/test/project/src/App.jsx'
      );
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({
        dependencies: {},
      });
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import '@allxsmith/bestax-bulma/bestax.css';` as unknown
      );

      await projectCreator.setupIconLibrary(targetPath, 'fontawesome', 'vite');

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        packageJsonPath,
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@fortawesome/fontawesome-free': '^7.2.0',
          }),
        }),
        { spaces: 2 }
      );
    });

    it('should add MDI to package.json and main file', async () => {
      const targetPath = '/test/project';
      const packageJsonPath = '/test/project/package.json';
      const _mainFilePath = '/test/project/src/main.tsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(
        path =>
          path === packageJsonPath ||
          path === _mainFilePath ||
          path === '/test/project/src/App.tsx'
      );
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({
        dependencies: {},
      });
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import '@allxsmith/bestax-bulma/bestax.css';` as unknown
      );

      await projectCreator.setupIconLibrary(targetPath, 'mdi', 'vite-ts');

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        packageJsonPath,
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@mdi/font': '^7.4.47',
          }),
        }),
        { spaces: 2 }
      );
      // MDI uses .min.css version
      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining('@mdi/font/css/materialdesignicons.min.css')
      );
    });

    it('should add material-icons to App file when index.html not present', async () => {
      const targetPath = '/test/project';
      const appFilePath = '/test/project/src/App.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(path => path === appFilePath);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(`<html><head></head><body></body></html>` as unknown);

      await projectCreator.setupIconLibrary(
        targetPath,
        'material-icons',
        'vite'
      );

      expect(fs.default.writeFile).toHaveBeenCalled();
    });

    it('should add material-symbols to App file when index.html not present', async () => {
      const targetPath = '/test/project';
      const appFilePath = '/test/project/src/App.tsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(path => path === appFilePath);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(`<html><head></head><body></body></html>` as unknown);

      await projectCreator.setupIconLibrary(
        targetPath,
        'material-symbols',
        'vite-ts'
      );

      expect(fs.default.writeFile).toHaveBeenCalled();
    });
  });

  describe('icon CSS after each Bulma flavor (#946)', () => {
    // Real template entry files, held in memory, so the flavor step and the
    // icon step run against what a scaffold actually starts from.
    let files: Map<string, string>;
    const inMemoryFs = [
      fs.default.existsSync,
      fs.default.readFile,
      fs.default.writeFile,
      fs.default.readJson,
      fs.default.writeJson,
    ] as unknown as jest.Mock[];

    // clearAllMocks keeps implementations, so drop this block's in-memory fs
    // rather than leave it behind for every later test in the file.
    afterEach(() => {
      inMemoryFs.forEach(mock => mock.mockReset());
    });

    beforeEach(() => {
      files = new Map();
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(p => files.has(String(p)));
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockImplementation((async (p: unknown) =>
        files.get(String(p))) as unknown as typeof fs.readFile);
      (
        fs.default.writeFile as jest.MockedFunction<typeof fs.writeFile>
      ).mockImplementation((async (p: unknown, content: unknown) => {
        files.set(String(p), String(content));
      }) as unknown as typeof fs.writeFile);
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockImplementation((async (p: unknown) =>
        JSON.parse(files.get(String(p)) ?? '{}')) as typeof fs.readJson);
      (
        fs.default.writeJson as jest.MockedFunction<typeof fs.writeJson>
      ).mockImplementation((async (p: unknown, data: unknown) => {
        files.set(String(p), JSON.stringify(data));
      }) as typeof fs.writeJson);
    });

    const cssIconLibraries = _ICON_LIBRARIES.filter(lib => lib.importStatement);
    const cases = _BULMA_FLAVORS.flatMap(flavor =>
      cssIconLibraries.map(library => [flavor.name, library.name] as const)
    );

    it.each(cases)(
      'the %s flavor with %s imports the icon CSS right after its stylesheet',
      async (flavorName, libraryName) => {
        const flavor = _BULMA_FLAVORS.find(f => f.name === flavorName)!;
        const library = _ICON_LIBRARIES.find(l => l.name === libraryName)!;

        for (const { name: template, directory } of TEMPLATES) {
          // The same entry-file rule setupIconLibrary applies: src/main, or
          // a Next.js app's root layout.
          const mainFile = entryFile(template);
          const root = `/app-${template}`;
          const mainPath = `${root}/${mainFile}`;
          files.set(
            mainPath,
            readFileSync(
              new URL(
                `../../templates/${directory}/${mainFile}`,
                import.meta.url
              ),
              'utf8'
            )
          );
          files.set(`${root}/package.json`, '{"dependencies":{}}');

          await projectCreator.setupBulmaFlavor(root, flavorName, template);
          await projectCreator.setupIconLibrary(root, libraryName, template);

          expect(files.get(mainPath)).toContain(
            `${flavor.importStatement}\n${library.importStatement}`
          );
        }
      }
    );

    it('warns when the entry file has no bestax stylesheet import to follow', async () => {
      const library = _ICON_LIBRARIES.find(l => l.name === 'fontawesome')!;
      const mainPath = '/app-bare/src/main.jsx';
      files.set(mainPath, "import App from './App.jsx';\n");
      files.set('/app-bare/package.json', '{"dependencies":{}}');

      await projectCreator.setupIconLibrary('/app-bare', 'fontawesome', 'vite');

      expect(files.get(mainPath)).not.toContain(library.importStatement);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          `src/main.jsx has no bestax stylesheet import to follow, so ${library.importStatement} was not added`
        )
      );
    });
  });

  describe('setupConfigProvider', () => {
    it('should not add ConfigProvider for complete Bulma with no icons', async () => {
      await projectCreator.setupConfigProvider(
        '/test/project',
        'complete',
        'none',
        'vite'
      );

      expect(fs.default.readFile).not.toHaveBeenCalled();
      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });

    it('should add ConfigProvider for prefixed Bulma', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import App from './App.jsx';\nroot.render(<App />);` as unknown
      );

      await projectCreator.setupConfigProvider(
        targetPath,
        'prefixed',
        'none',
        'vite'
      );

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining('ConfigProvider')
      );
      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining('classPrefix="bestax-"')
      );
    });

    it('should add ConfigProvider with iconLibrary for MDI', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.tsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import App from './App.tsx';\nroot.render(<App />);` as unknown
      );

      await projectCreator.setupConfigProvider(
        targetPath,
        'complete',
        'mdi',
        'vite-ts'
      );

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining('ConfigProvider')
      );
      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining('iconLibrary="mdi"')
      );
    });
  });

  describe('getIconName and getIconProps', () => {
    it('should return correct icon names for different libraries', () => {
      // Access private methods via any cast for testing
      const pc = projectCreator as unknown;

      // FontAwesome icons
      expect(pc.getIconName('fontawesome', 'rocket')).toBe('rocket');
      expect(pc.getIconName('fontawesome', 'book')).toBe('book');
      expect(pc.getIconName('fontawesome', 'code')).toBe('code');

      // MDI icons
      expect(pc.getIconName('mdi', 'rocket')).toBe('rocket-launch');
      expect(pc.getIconName('mdi', 'book')).toBe('book-open-page-variant');
      expect(pc.getIconName('mdi', 'code')).toBe('code-tags');

      // Ionicons
      expect(pc.getIconName('ionicons', 'rocket')).toBe('rocket');
      expect(pc.getIconName('ionicons', 'book')).toBe('book');
      expect(pc.getIconName('ionicons', 'code')).toBe('code-slash');

      // Material Icons
      expect(pc.getIconName('material-icons', 'rocket')).toBe('rocket_launch');
      expect(pc.getIconName('material-icons', 'book')).toBe('menu_book');
      expect(pc.getIconName('material-icons', 'code')).toBe('code');

      // Material Symbols
      expect(pc.getIconName('material-symbols', 'rocket')).toBe(
        'rocket_launch'
      );
      expect(pc.getIconName('material-symbols', 'book')).toBe('menu_book');
      expect(pc.getIconName('material-symbols', 'code')).toBe('code');
    });

    it('should return empty string for unknown icon library', () => {
      const pc = projectCreator as unknown;
      expect(pc.getIconName('unknown', 'rocket')).toBe('');
      expect(pc.getIconName('invalid', 'book')).toBe('');
    });

    it('should return correct icon props for FontAwesome', () => {
      const pc = projectCreator as unknown;
      expect(pc.getIconProps('fontawesome', 'rocket')).toEqual([
        "name: 'rocket'",
        "variant: 'solid'",
        "'aria-hidden': 'true'",
      ]);
      expect(pc.getIconProps('fontawesome', 'book')[0]).toBe("name: 'book'");
      expect(pc.getIconProps('fontawesome', 'code')[0]).toBe("name: 'code'");
    });

    it('should return correct icon props for other libraries', () => {
      const pc = projectCreator as unknown;
      expect(pc.getIconProps('mdi', 'rocket')).toEqual([
        "name: 'rocket-launch'",
        "'aria-hidden': 'true'",
      ]);
      expect(pc.getIconProps('ionicons', 'book')[0]).toBe("name: 'book'");
      expect(pc.getIconProps('material-icons', 'code')[0]).toBe("name: 'code'");
    });

    it('should return no props when no icon name found', () => {
      const pc = projectCreator as unknown;
      expect(pc.getIconProps('unknown', 'rocket')).toEqual([]);
    });
  });

  describe('create', () => {
    it('should exit if no project name provided', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});

      try {
        await projectCreator.create();
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should exit with invalid template option', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        template: 'invalid-template',
        bulma: 'complete',
        icon: 'none',
        yes: true,
      };

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should exit with invalid bulma option', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        template: 'vite',
        bulma: 'invalid-bulma',
        icon: 'none',
        yes: true,
      };

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should exit with invalid icon option', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        template: 'vite',
        bulma: 'complete',
        icon: 'invalid-icon',
        yes: true,
      };

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('exits naming the linters for an invalid --lint', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        projectCreator.create('test-project', { lint: 'biome', yes: true })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(
        (console.error as jest.Mock).mock.calls.flat().join('\n')
      ).toContain('Invalid linter: biome. Valid options are: oxlint, eslint');
      expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
      mockExit.mockRestore();
    });

    describe('the linter', () => {
      let setupLinter: ReturnType<typeof jest.spyOn>;

      beforeEach(() => {
        (
          fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
        ).mockReturnValue(false);
        setupLinter = jest
          .spyOn(projectCreator, 'setupLinter')
          .mockResolvedValue(undefined);
      });

      afterEach(() => {
        setupLinter.mockRestore();
      });

      it('is Oxlint under -y', async () => {
        await projectCreator.create('test-project', {
          yes: true,
          skills: false,
        });

        expect(setupLinter).toHaveBeenCalledWith(
          expect.any(String),
          'oxlint',
          'vite'
        );
        expect(prompts).not.toHaveBeenCalled();
      });

      it('is the one --lint names, without asking', async () => {
        await projectCreator.create('test-project', {
          template: 'vite-ts',
          lint: 'eslint',
          bulma: 'complete',
          icon: 'none',
          skills: false,
          immediate: false,
        });

        expect(setupLinter).toHaveBeenCalledWith(
          expect.any(String),
          'eslint',
          'vite-ts'
        );
        expect(prompts).not.toHaveBeenCalledWith(
          expect.objectContaining({ name: 'linter' })
        );
      });

      it('is Oxlint without a terminal, so a run that names every other choice still finishes', async () => {
        setStdinTTY(undefined);

        await projectCreator.create('test-project', {
          template: 'vite-ts',
          bulma: 'complete',
          icon: 'none',
          skills: false,
        });

        expect(setupLinter).toHaveBeenCalledWith(
          expect.any(String),
          'oxlint',
          'vite-ts'
        );
        expect(prompts).not.toHaveBeenCalled();
      });

      it('is asked for when no flag names it', async () => {
        (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
          questions => {
            const question = Array.isArray(questions)
              ? questions[0]
              : questions;
            return Promise.resolve(
              question.name === 'linter' ? { linter: 'eslint' } : {}
            );
          }
        );

        await projectCreator.create('test-project', {
          template: 'vite',
          bulma: 'complete',
          icon: 'none',
          skills: false,
          immediate: false,
        });

        expect(prompts).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'linter' })
        );
        expect(setupLinter).toHaveBeenCalledWith(
          expect.any(String),
          'eslint',
          'vite'
        );
      });
    });

    describe('installing and starting (--immediate)', () => {
      const run = runCommand as jest.MockedFunction<typeof runCommand>;
      const originalAgent = process.env.npm_config_user_agent;
      let mockExit: ReturnType<typeof jest.spyOn>;

      beforeEach(() => {
        process.env.npm_config_user_agent = 'pnpm/11.9.0 node/v22 darwin arm64';
        process.exitCode = undefined;
        run.mockReturnValue(0);
        (
          fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
        ).mockReturnValue(false);
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });
      });

      afterEach(() => {
        mockExit.mockRestore();
        process.exitCode = undefined;
        if (originalAgent === undefined)
          delete process.env.npm_config_user_agent;
        else process.env.npm_config_user_agent = originalAgent;
      });

      const target = path.resolve(process.cwd(), 'test-project');

      it('installs, then starts the dev server, after the scaffold and the telemetry', async () => {
        run.mockReturnValueOnce(0).mockReturnValueOnce(3);

        await projectCreator.create('test-project', {
          yes: true,
          skills: false,
          immediate: true,
        });

        expect(run.mock.calls).toEqual([
          ['pnpm install', target],
          ['pnpm run dev', target],
        ]);
        expect(run.mock.invocationCallOrder[0]).toBeGreaterThan(
          (telemetry.reportScaffold as jest.Mock).mock.invocationCallOrder[0]
        );
        // The server's exit code is the run's.
        expect(process.exitCode).toBe(3);
      });

      it('does not start the server after a failed install, and exits with its code', async () => {
        run.mockReturnValueOnce(2);

        await expect(
          projectCreator.create('test-project', {
            yes: true,
            skills: false,
            immediate: true,
          })
        ).rejects.toThrow('process.exit called');

        expect(run).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(2);
        expect(
          (console.error as jest.Mock).mock.calls.flat().join('\n')
        ).toContain(
          'pnpm install failed, so the dev server was not started. Fix what it reported, then cd test-project, then run pnpm install and pnpm run dev.'
        );
      });

      it('names no cd after a failed install into the current directory', async () => {
        run.mockReturnValueOnce(1);

        await expect(
          projectCreator.create('.', {
            yes: true,
            skills: false,
            immediate: true,
          })
        ).rejects.toThrow('process.exit called');

        const output = (console.error as jest.Mock).mock.calls
          .flat()
          .join('\n');
        expect(output).toContain(
          'Fix what it reported, then run pnpm install and pnpm run dev.'
        );
        expect(output).not.toContain('cd ');
      });

      it('reports a command that could not start, and exits 1', async () => {
        run.mockImplementationOnce(() => {
          throw new Error('spawn pnpm ENOENT');
        });

        await expect(
          projectCreator.create('test-project', {
            yes: true,
            skills: false,
            immediate: true,
          })
        ).rejects.toThrow('process.exit called');

        expect(run).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(
          (console.error as jest.Mock).mock.calls.flat().join('\n')
        ).toContain('spawn pnpm ENOENT');
      });

      it('only writes the project under -y, without a terminal, or with --no-immediate', async () => {
        await projectCreator.create('test-project', {
          yes: true,
          skills: false,
        });
        setStdinTTY(undefined);
        await projectCreator.create('test-project', {
          template: 'vite',
          bulma: 'complete',
          icon: 'none',
          skills: false,
        });
        setStdinTTY(true);
        await projectCreator.create('test-project', {
          template: 'vite',
          lint: 'oxlint',
          bulma: 'complete',
          icon: 'none',
          skills: false,
          immediate: false,
        });

        expect(run).not.toHaveBeenCalled();
        expect(prompts).not.toHaveBeenCalled();
      });

      it('asks, naming the package manager, when nothing answers it', async () => {
        (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
          questions => {
            const question = Array.isArray(questions)
              ? questions[0]
              : questions;
            return Promise.resolve(
              question.name === 'immediate' ? { immediate: true } : {}
            );
          }
        );

        await projectCreator.create('test-project', {
          template: 'vite',
          lint: 'oxlint',
          bulma: 'complete',
          icon: 'none',
          skills: false,
        });

        expect(prompts).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'immediate',
            message: 'Install with pnpm and start the dev server now?',
          })
        );
        expect(run).toHaveBeenCalledWith('pnpm install', target);
      });
    });

    it('should create project with CLI options', async () => {
      const options = {
        template: 'vite-ts',
        bulma: 'prefixed',
        icon: 'fontawesome',
        yes: true,
      };

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', options);

      expect(fileSystem.copyDirectory).toHaveBeenCalled();
      expect(fileSystem.updatePackageJson).toHaveBeenCalled();
    });

    it('sets the index.html title to the project name', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(path => String(path).endsWith('index.html'));
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        '<head><title>Bestax + Vite + React</title></head>' as unknown
      );

      await projectCreator.create('test-project', { yes: true, skills: false });

      expect(
        (fs.default.writeFile as unknown as jest.Mock).mock.calls.some(
          ([p, content]) =>
            String(p).endsWith('index.html') &&
            String(content).includes('<title>test-project</title>')
        )
      ).toBe(true);
    });

    it('writes launch.json when the skills opt-in is accepted', async () => {
      // target dir does not exist; the bundled skills dir does
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockImplementation(async p => String(p).includes('skills'));
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', { yes: true, skills: true });

      expect(
        (fs.default.writeFile as unknown as jest.Mock).mock.calls.some(([p]) =>
          String(p).includes('launch.json')
        )
      ).toBe(true);
    });

    it('does not write launch.json when the skills opt-in is declined', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockImplementation(async p => String(p).includes('skills'));
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', { yes: true, skills: false });

      expect(
        (fs.default.writeFile as unknown as jest.Mock).mock.calls.some(([p]) =>
          String(p).includes('launch.json')
        )
      ).toBe(false);
    });

    it('should prompt for missing template option', async () => {
      const options = {
        lint: 'oxlint',
        immediate: false,
        bulma: 'complete',
        icon: 'none',
        skills: false,
      };

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'template')
            return Promise.resolve({ template: 'vite' });
          return Promise.resolve({});
        }
      );

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', options);

      expect(prompts).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'template',
        })
      );
    });

    it('should prompt for missing bulma option', async () => {
      const options = {
        lint: 'oxlint',
        immediate: false,
        template: 'vite',
        icon: 'none',
        skills: false,
      };

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'bulmaFlavor')
            return Promise.resolve({ bulmaFlavor: 'complete' });
          return Promise.resolve({});
        }
      );

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', options);

      expect(prompts).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'bulmaFlavor',
        })
      );
    });

    it('should exit when user cancels template prompt', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        bulma: 'complete',
        icon: 'none',
      };

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'template') return Promise.resolve({}); // Cancel
          return Promise.resolve({});
        }
      );

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should exit when user cancels bulma prompt', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        lint: 'oxlint',
        immediate: false,
        template: 'vite',
        icon: 'none',
      };

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'bulmaFlavor') return Promise.resolve({}); // Cancel
          return Promise.resolve({});
        }
      );

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should exit when user cancels icon prompt', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        lint: 'oxlint',
        immediate: false,
        template: 'vite',
        bulma: 'complete',
      };

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'iconLibrary') return Promise.resolve({}); // Cancel
          return Promise.resolve({});
        }
      );

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should prompt for missing icon option', async () => {
      const options = {
        lint: 'oxlint',
        immediate: false,
        template: 'vite',
        bulma: 'complete',
        skills: false,
      };

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'iconLibrary')
            return Promise.resolve({ iconLibrary: 'none' });
          return Promise.resolve({});
        }
      );

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', options);

      expect(prompts).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'iconLibrary',
        })
      );
    });

    it('should handle project creation failure', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.copyDirectory as jest.MockedFunction<
          typeof fileSystem.copyDirectory
        >
      ).mockRejectedValue(new Error('Copy failed'));

      await expect(projectCreator.create('test-project')).rejects.toThrow(
        'process.exit called'
      );

      expect(console.log).toHaveBeenCalled();
      mockExit.mockRestore();
    });

    it('should handle user cancellation at project name prompt', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});

      await expect(projectCreator.create()).rejects.toThrow(
        'process.exit called'
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Operation cancelled')
      );
      mockExit.mockRestore();
    });

    it('should handle user cancellation at template prompt', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      (prompts as jest.MockedFunction<typeof prompts>).mockImplementation(
        questions => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          if (question.name === 'projectName')
            return Promise.resolve({ projectName: 'test-project' });
          if (question.name === 'template') return Promise.resolve({});
          return Promise.resolve({});
        }
      );

      await expect(projectCreator.create('test-project', {})).rejects.toThrow(
        'process.exit called'
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Operation cancelled')
      );
      mockExit.mockRestore();
    });

    it('should handle directory not empty and user declines overwrite', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(false);
      listDirectoryEntries.mockResolvedValue(['notes.txt']);
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        overwrite: false,
      });

      await expect(
        projectCreator.create('test-project', { yes: false })
      ).rejects.toThrow('process.exit called');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Operation cancelled')
      );
      mockExit.mockRestore();
    });

    it('should handle copyDirectory error', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        template: 'vite',
        bulma: 'complete',
        icon: 'none',
        yes: true,
      };

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fileSystem.copyDirectory as jest.MockedFunction<
          typeof fileSystem.copyDirectory
        >
      ).mockRejectedValue(new Error('Permission denied'));

      await expect(
        projectCreator.create('test-project', options)
      ).rejects.toThrow('process.exit called');

      // Error is handled and process exits
      mockExit.mockRestore();
    });

    it('should handle updatePackageJson error gracefully', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const options = {
        template: 'vite',
        bulma: 'complete',
        icon: 'none',
        yes: true,
      };

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);
      (
        fileSystem.updatePackageJson as jest.MockedFunction<
          typeof fileSystem.updatePackageJson
        >
      ).mockRejectedValue(new Error('Update failed'));

      try {
        await projectCreator.create('test-project', options);
      } catch {
        // Expected to throw due to process.exit
      }

      expect(fileSystem.copyDirectory).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('setupBulmaFlavor edge cases', () => {
    it('should add CSS import after React import when no bestax import exists', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import React from 'react';\nimport './App.css';` as unknown
      );

      await projectCreator.setupBulmaFlavor(targetPath, 'complete', 'vite');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining("import '@allxsmith/bestax-bulma/bestax.css'")
      );
    });

    it('should handle file without React import', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import './App.css';\nconst app = document.getElementById('app');` as unknown
      );

      await projectCreator.setupBulmaFlavor(targetPath, 'complete', 'vite');

      expect(fs.default.writeFile).toHaveBeenCalled();
    });

    it('should handle missing main file gracefully', async () => {
      const targetPath = '/test/project';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.setupBulmaFlavor(targetPath, 'complete', 'vite');

      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('setupConfigProvider additional tests', () => {
    it('should handle missing main file', async () => {
      const targetPath = '/test/project';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.setupConfigProvider(
        targetPath,
        'prefixed',
        'fontawesome',
        'vite'
      );

      expect(fs.default.writeFile).not.toHaveBeenCalled();
    });

    it('should add ConfigProvider with both prefix and icon library', async () => {
      const targetPath = '/test/project';
      const _mainFilePath = '/test/project/src/main.tsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import App from './App.tsx';\nroot.render(<App />);` as unknown
      );

      await projectCreator.setupConfigProvider(
        targetPath,
        'no-helpers-prefixed',
        'mdi',
        'vite-ts'
      );

      const writeCall = (
        fs.default.writeFile as jest.MockedFunction<typeof fs.writeFile>
      ).mock.calls[0];
      const writtenContent = writeCall[1] as string;

      expect(writtenContent).toContain('ConfigProvider');
      expect(writtenContent).toContain('classPrefix="bestax-"');
      expect(writtenContent).toContain('iconLibrary="mdi"');
    });
  });

  describe('create with --yes flag defaults', () => {
    it('should use default values when --yes is provided without options', async () => {
      // This test covers lines 446, 468, 490 - default values for --yes flag
      const options = {
        yes: true,
        // No template, bulma, or icon options provided - will use defaults
      };

      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fileSystem.copyDirectory as jest.MockedFunction<
          typeof fileSystem.copyDirectory
        >
      ).mockResolvedValue(undefined);
      (
        fileSystem.updatePackageJson as jest.MockedFunction<
          typeof fileSystem.updatePackageJson
        >
      ).mockResolvedValue(undefined);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', options);

      // Should use defaults: vite template (line 446), complete bulma (line 468), none icon (line 490)
      const copyCall = (
        fileSystem.copyDirectory as jest.MockedFunction<
          typeof fileSystem.copyDirectory
        >
      ).mock.calls[0];
      expect(copyCall[0]).toContain('/vite'); // Should contain /vite path
      expect(copyCall[0]).not.toContain('vite-ts'); // Ensure it's not vite-ts
      expect(fileSystem.updatePackageJson).toHaveBeenCalled();
    });
  });

  describe('setupRouter', () => {
    it('warns, and leaves the entry file alone, when it no longer renders App', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(p => String(p).endsWith('main.tsx'));
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        "import Root from './Root.tsx';\n<Root />\n" as unknown
      );

      await projectCreator.setupRouter('/app', 'react-router-ts');

      expect(fs.default.copy).toHaveBeenCalledWith(
        expect.stringContaining(
          path.join('templates', 'overlays', 'react-router', 'vite-ts')
        ),
        '/app'
      );
      expect(fs.default.writeFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          'src/main.tsx is not shaped the way the scaffolder expects'
        )
      );
    });

    it('tells the skills step the app routes, so CLAUDE.md says how', async () => {
      const setupSkills = jest
        .spyOn(projectCreator, 'setupSkills')
        .mockResolvedValue(undefined);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await projectCreator.create('test-project', {
        template: 'react-router-ts',
        yes: true,
        skills: true,
      });

      expect(setupSkills).toHaveBeenCalledWith(
        expect.any(String),
        'test-project',
        expect.objectContaining({ router: 'react-router' })
      );
      setupSkills.mockRestore();
    });
  });

  describe('setupReactCompiler', () => {
    it('warns, and leaves vite.config alone, when it is not shaped as the template ships it', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(p => String(p).endsWith('vite.config.ts'));
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        "import react from '@vitejs/plugin-react';\nexport default { plugins: [react({})] };\n" as unknown
      );

      await projectCreator.setupReactCompiler('/app', 'vite-compiler-ts');

      expect(fs.default.writeFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          'vite.config.ts is not shaped the way the scaffolder expects'
        )
      );
    });
  });

  describe('setupIconLibrary edge cases', () => {
    it('should handle package.json without dependencies object', async () => {
      const targetPath = '/test/project';
      const packageJsonPath = '/test/project/package.json';
      const _mainFilePath = '/test/project/src/main.jsx';

      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(
        path =>
          path === packageJsonPath ||
          path === _mainFilePath ||
          path === '/test/project/src/App.jsx'
      );
      // Return package.json WITHOUT dependencies object
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({
        name: 'test-project',
        version: '1.0.0',
      });
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        `import '@allxsmith/bestax-bulma/bestax.css';` as unknown
      );

      await projectCreator.setupIconLibrary(targetPath, 'fontawesome', 'vite');

      // Should create dependencies object and add package
      expect(fs.default.writeJson).toHaveBeenCalledWith(
        packageJsonPath,
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@fortawesome/fontawesome-free': '^7.2.0',
          }),
        }),
        { spaces: 2 }
      );
    });
  });

  describe('create — telemetry', () => {
    const reportScaffold = telemetry.reportScaffold as jest.MockedFunction<
      typeof telemetry.reportScaffold
    >;
    const fullFlags = {
      template: 'vite-ts',
      lint: 'oxlint',
      immediate: false,
      bulma: 'prefixed',
      icon: 'mdi',
      skills: false,
    };

    function mockSuccessfulScaffold(): void {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(false);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);
    }

    it('reports the chosen options after a successful scaffold', async () => {
      mockSuccessfulScaffold();

      await projectCreator.create('test-project', { ...fullFlags, yes: true });

      expect(reportScaffold).toHaveBeenCalledTimes(1);
      const [choices, flag, opts] = reportScaffold.mock.calls[0];
      expect(choices).toEqual({
        template: 'vite-ts',
        bulmaFlavor: 'prefixed',
        iconLibrary: 'mdi',
        skills: false,
      });
      expect(flag).toBeUndefined();
      // -y means the consent question may not be asked (#192)
      expect(opts.interactive).toBe(false);
    });

    it('passes an explicit --telemetry/--no-telemetry flag through', async () => {
      mockSuccessfulScaffold();

      await projectCreator.create('test-project', {
        ...fullFlags,
        yes: true,
        telemetry: false,
      });

      expect(reportScaffold.mock.calls[0][1]).toBe(false);
    });

    it('is interactive only with a TTY on both ends and -y absent', async () => {
      try {
        setStdoutTTY(true);
        mockSuccessfulScaffold();
        await projectCreator.create('test-project', fullFlags);
        expect(reportScaffold.mock.calls[0][2].interactive).toBe(true);

        // stdout redirected: the question would render into the log while
        // the CLI blocked on an invisible prompt.
        reportScaffold.mockClear();
        setStdoutTTY(false);
        mockSuccessfulScaffold();
        await projectCreator.create('test-project', fullFlags);
        expect(reportScaffold.mock.calls[0][2].interactive).toBe(false);

        reportScaffold.mockClear();
        setStdoutTTY(true);
        setStdinTTY(false);
        mockSuccessfulScaffold();
        await projectCreator.create('test-project', fullFlags);
        expect(reportScaffold.mock.calls[0][2].interactive).toBe(false);
      } finally {
        restoreStdoutTTY();
      }
    });

    it('the consent callback asks the prompt, and a saved yes is acknowledged', async () => {
      mockSuccessfulScaffold();
      reportScaffold.mockImplementationOnce(async (_choices, _flag, opts) => {
        await expect(opts.promptConsent()).resolves.toBe(true);
        opts.onDecided?.(true, true);
      });
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        telemetry: true,
      });

      await projectCreator.create('test-project', fullFlags);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Opt out anytime')
      );
    });

    it('a saved no is acknowledged without sending', async () => {
      mockSuccessfulScaffold();
      reportScaffold.mockImplementationOnce(async (_choices, _flag, opts) => {
        await expect(opts.promptConsent()).resolves.toBe(false);
        opts.onDecided?.(false, true);
      });
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        telemetry: false,
      });

      await projectCreator.create('test-project', fullFlags);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("we won't ask again")
      );
    });

    it('an unsaved decision is acknowledged truthfully, not with a promise', async () => {
      // "We won't ask again" after a swallowed write failure would be false
      // on every future run; the ack is worded on whether the write stuck.
      mockSuccessfulScaffold();
      reportScaffold.mockImplementationOnce(async (_choices, _flag, opts) => {
        await expect(opts.promptConsent()).resolves.toBe(false);
        opts.onDecided?.(false, false);
      });
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        telemetry: false,
      });

      await projectCreator.create('test-project', fullFlags);

      const logged = (console.log as jest.Mock).mock.calls.flat().join('\n');
      expect(logged).toContain("Couldn't save your choice");
      expect(logged).not.toContain("we won't ask again");
    });

    it('a cancelled consent prompt prints no ack', async () => {
      mockSuccessfulScaffold();
      reportScaffold.mockImplementationOnce(async (_choices, _flag, opts) => {
        await expect(opts.promptConsent()).resolves.toBeNull();
      });
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});

      await projectCreator.create('test-project', fullFlags);

      const logged = (console.log as jest.Mock).mock.calls.flat().join('\n');
      expect(logged).not.toContain('Opt out anytime');
      expect(logged).not.toContain("we won't ask again");
    });

    it('a telemetry failure never breaks the scaffold', async () => {
      mockSuccessfulScaffold();
      reportScaffold.mockRejectedValueOnce(new Error('telemetry boom'));

      await expect(
        projectCreator.create('test-project', { ...fullFlags, yes: true })
      ).resolves.toBeUndefined();
    });
  });

  describe('create, into an existing directory (#945)', () => {
    const ask = prompts as jest.MockedFunction<typeof prompts>;
    const answers: Record<string, Record<string, unknown>> = {
      overwrite: { overwrite: true },
      template: { template: 'vite' },
      linter: { linter: 'oxlint' },
      bulmaFlavor: { bulmaFlavor: 'complete' },
      iconLibrary: { iconLibrary: 'none' },
      skills: { skills: true },
      immediate: { immediate: false },
    };
    let mockExit: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(false);
      listDirectoryEntries.mockResolvedValue(['.git', 'notes.txt', 'src']);
    });

    afterEach(() => {
      mockExit.mockRestore();
    });

    function errorOutput(): string {
      return (console.error as jest.Mock).mock.calls.flat().join('\n');
    }

    /** Answers every prompt, except the one named, which is cancelled. */
    function answerPrompts(cancelAt?: string): void {
      ask.mockImplementation(questions => {
        const question = Array.isArray(questions) ? questions[0] : questions;
        const name = String(question.name);
        return Promise.resolve(name === cancelAt ? {} : (answers[name] ?? {}));
      });
    }

    it('-y leaves a non-empty directory untouched and exits 1 saying why', async () => {
      await expect(
        projectCreator.create('demo', { yes: true })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
      expect(errorOutput()).toContain('demo is not empty');
      expect(errorOutput()).toContain('.git, notes.txt, src');
      expect(errorOutput()).toContain('--overwrite');
    });

    it.each([
      ['template', { template: 'vite-typescript' }, 'Invalid template'],
      ['Bulma flavor', { bulma: 'dark' }, 'Invalid Bulma flavor'],
      ['icon library', { icon: 'feather' }, 'Invalid icon library'],
    ])(
      'an invalid %s exits before touching the directory, even with --overwrite',
      async (_label, flags, message) => {
        for (const extra of [{}, { overwrite: true }]) {
          await expect(
            projectCreator.create('demo', { ...flags, ...extra, yes: true })
          ).rejects.toThrow('process.exit called');
        }

        expect(mockExit).toHaveBeenCalledWith(1);
        expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
        expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
        expect(errorOutput()).toContain(message);
        // The flag is reported first, not the directory it never reached.
        expect(errorOutput()).not.toContain('is not empty');
      }
    );

    it('reports an invalid flag before asking anything', async () => {
      await expect(
        projectCreator.create(undefined, { template: 'vite-typescript' })
      ).rejects.toThrow('process.exit called');

      expect(ask).not.toHaveBeenCalled();
      expect(errorOutput()).toContain('Invalid template');
    });

    it('--overwrite empties the directory, then writes the scaffold', async () => {
      await projectCreator.create('demo', { yes: true, overwrite: true });

      const emptied = fileSystem.emptyDirectory as jest.Mock;
      const copied = fileSystem.copyDirectory as jest.Mock;
      expect(emptied).toHaveBeenCalledWith(expect.stringMatching(/demo$/));
      expect(emptied.mock.invocationCallOrder[0]).toBeLessThan(
        copied.mock.invocationCallOrder[0]
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Emptying demo')
      );
    });

    it('without a terminal, stops before any prompt and names --overwrite', async () => {
      setStdinTTY(undefined);

      await expect(
        projectCreator.create('demo', {
          template: 'vite',
          bulma: 'complete',
          icon: 'none',
          skills: false,
        })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(ask).not.toHaveBeenCalled();
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(errorOutput()).toContain('--overwrite');
    });

    it.each([
      'template',
      'linter',
      'bulmaFlavor',
      'iconLibrary',
      'skills',
      'immediate',
    ])(
      'accepting removal, then cancelling at the %s prompt, leaves the files alone',
      async cancelAt => {
        answerPrompts(cancelAt);

        await expect(projectCreator.create('demo', {})).rejects.toThrow(
          'process.exit called'
        );

        expect(ask).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'overwrite' })
        );
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Operation cancelled')
        );
        expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
        expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
      }
    );

    it('reads the library range before emptying, so a failed read leaves the files (#1240)', async () => {
      (libraryRange as jest.Mock).mockImplementationOnce(() => {
        throw new Error('package.json declares no @allxsmith/bestax-bulma.');
      });

      await expect(
        projectCreator.create('demo', { yes: true, overwrite: true })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
      expect(errorOutput()).toContain('declares no @allxsmith/bestax-bulma');
    });

    it('accepting removal empties the directory only after the last prompt', async () => {
      answerPrompts();

      await projectCreator.create('demo', {});

      const emptied = fileSystem.emptyDirectory as jest.Mock;
      expect(emptied).toHaveBeenCalledTimes(1);
      expect(emptied.mock.invocationCallOrder[0]).toBeGreaterThan(
        Math.max(...ask.mock.invocationCallOrder)
      );
    });
  });

  describe('create, naming the package (#950)', () => {
    beforeEach(() => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);
    });

    it.each([
      ['MyApp', 'myapp'],
      ['_under', 'under'],
    ])(
      'writes %s as %s, a name npm accepts, and says so',
      async (folder, packageName) => {
        await projectCreator.create(folder, { yes: true, skills: false });

        expect(fileSystem.updatePackageJson).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`${folder}$`)),
          packageName,
          LIBRARY_DEPENDENCY
        );
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`package.json name: ${packageName}`)
        );
      }
    );

    it('keeps a name npm already accepts, with no note', async () => {
      await projectCreator.create('my-app', { yes: true, skills: false });

      expect(fileSystem.updatePackageJson).toHaveBeenCalledWith(
        expect.stringMatching(/my-app$/),
        'my-app',
        LIBRARY_DEPENDENCY
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('package.json name')
      );
    });
  });

  describe('create, from a path (#1154)', () => {
    const scratch = path.join(os.tmpdir(), 'bestax-1154');
    let mockExit: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
      mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockImplementation(p => String(p).endsWith('index.html'));
      (
        fs.default.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(
        '<head><title>Bestax + Vite + React</title></head>' as unknown
      );
    });

    afterEach(() => {
      mockExit.mockRestore();
    });

    function writtenTitle(): string | undefined {
      const call = (
        fs.default.writeFile as unknown as jest.Mock
      ).mock.calls.find(([p]) => String(p).endsWith('index.html'));
      return String(call?.[1]).match(/<title>([^<]*)<\/title>/)?.[1];
    }

    it.each([
      ['an absolute path', path.join(scratch, 'a', 'b', 'login')],
      ['an absolute path with a trailing slash', `${scratch}/login/`],
      ['a relative path', 'scratch/a/b/login'],
      ['a relative path through the parent', '../scratch/login'],
    ])(
      'scaffolds %s where it points, named after its last part',
      async (_label, dir) => {
        const targetPath = path.resolve(process.cwd(), dir);

        await projectCreator.create(dir, { yes: true, skills: false });

        // ensureDirectory is fs.ensureDir, which creates missing parents too.
        expect(fileSystem.ensureDirectory).toHaveBeenCalledWith(targetPath);
        expect(fileSystem.copyDirectory).toHaveBeenCalledWith(
          expect.any(String),
          targetPath,
          expect.anything()
        );
        expect(fileSystem.updatePackageJson).toHaveBeenCalledWith(
          targetPath,
          'login',
          LIBRARY_DEPENDENCY
        );
        expect(writtenTitle()).toBe('login');
        expect(prompts).not.toHaveBeenCalled();
      }
    );

    it('lower-cases a capitalised last part for the package, as for a name', async () => {
      await projectCreator.create(path.join(scratch, 'MyApp'), {
        yes: true,
        skills: false,
      });

      expect(fileSystem.updatePackageJson).toHaveBeenCalledWith(
        path.join(scratch, 'MyApp'),
        'myapp',
        LIBRARY_DEPENDENCY
      );
      expect(writtenTitle()).toBe('MyApp');
    });

    it('scaffolds into an empty current directory for ".", named after it', async () => {
      listDirectoryEntries.mockResolvedValue([]);

      await projectCreator.create('.', { yes: true, skills: false });

      const cwd = process.cwd();
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(fileSystem.copyDirectory).toHaveBeenCalledWith(
        expect.any(String),
        cwd,
        expect.anything()
      );
      expect(fileSystem.updatePackageJson).toHaveBeenCalledWith(
        cwd,
        path.basename(cwd).toLowerCase(),
        LIBRARY_DEPENDENCY
      );
    });

    it('stops at "." when the current directory holds anything, --overwrite or not', async () => {
      listDirectoryEntries.mockResolvedValue(['notes.txt']);

      await expect(
        projectCreator.create('.', { yes: true, overwrite: true })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
      expect(
        (console.error as jest.Mock).mock.calls.flat().join('\n')
      ).toContain('The current directory is not empty (notes.txt)');
    });

    it.each(['..', `${scratch}/..`, `${scratch}/My App`])(
      'stops at %s before touching anything',
      async dir => {
        await expect(
          projectCreator.create(dir, { yes: true, overwrite: true })
        ).rejects.toThrow('process.exit called');

        expect(mockExit).toHaveBeenCalledWith(1);
        expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
        expect(fileSystem.ensureDirectory).not.toHaveBeenCalled();
      }
    );

    it('stops at a file in place of a parent folder before any other prompt', async () => {
      const file = path.resolve(process.cwd(), 'notes.txt');
      findNonDirectoryInPath.mockResolvedValue(file);

      await expect(
        projectCreator.create('notes.txt/login', {})
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(prompts).not.toHaveBeenCalled();
      expect(fileSystem.ensureDirectory).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`${file} already exists and is not a directory`)
      );
    });

    it('never empties the working directory reached as "../<its name>"', async () => {
      listDirectoryEntries.mockResolvedValue(['package.json']);
      const dir = `../${path.basename(process.cwd())}`;

      await expect(
        projectCreator.create(dir, { yes: true, overwrite: true })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
    });

    it('-y leaves a non-empty directory at the path untouched', async () => {
      listDirectoryEntries.mockResolvedValue(['notes.txt']);
      const dir = path.join(scratch, 'login');

      await expect(projectCreator.create(dir, { yes: true })).rejects.toThrow(
        'process.exit called'
      );

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
      expect(fileSystem.copyDirectory).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`${dir} is not empty`)
      );
    });

    it('--overwrite empties the directory the path resolves to', async () => {
      listDirectoryEntries.mockResolvedValue(['notes.txt']);

      await projectCreator.create('scratch/login', {
        yes: true,
        overwrite: true,
        skills: false,
      });

      expect(fileSystem.emptyDirectory).toHaveBeenCalledWith(
        path.resolve(process.cwd(), 'scratch/login')
      );
    });
  });
});
