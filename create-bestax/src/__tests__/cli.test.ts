import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockedClass,
  type MockedFunction,
} from 'vitest';

// Mock modules before imports
vi.doMock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    emptyDir: vi.fn(),
    ensureDir: vi.fn(),
    copy: vi.fn(),
    readJson: vi.fn(),
    writeJson: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  emptyDir: vi.fn(),
  ensureDir: vi.fn(),
  copy: vi.fn(),
  readJson: vi.fn(),
  writeJson: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.doMock('prompts', () => ({
  default: vi.fn(),
}));

vi.doMock('chalk', () => ({
  default: {
    yellow: vi.fn((str: string) => str),
    blue: vi.fn((str: string) => str),
    cyan: vi.fn((str: string) => str),
    magenta: vi.fn((str: string) => str),
    green: vi.fn((str: string) => str),
    red: vi.fn((str: string) => str),
    dim: vi.fn((str: string) => str),
    bold: vi.fn((str: string) => str),
    gray: vi.fn((str: string) => str),
  },
}));

// Mock the display module
vi.doMock('../display.js', () => ({
  displayHeader: vi.fn(),
  displaySuccess: vi.fn(),
  displayError: vi.fn(),
  displayCancelled: vi.fn(),
}));

// Mock the file-system module
vi.doMock('../file-system.js', () => ({
  checkDirectoryExists: vi.fn(),
  isDirectoryEmpty: vi.fn(),
  emptyDirectory: vi.fn(),
  ensureDirectory: vi.fn(),
  copyDirectory: vi.fn(),
  updatePackageJson: vi.fn(),
}));

// Mock the prompts module
vi.doMock('../prompts.js', () => ({
  promptProjectName: vi.fn(),
  promptOverwriteDirectory: vi.fn(),
  promptTemplate: vi.fn(),
  promptBulmaFlavor: vi.fn(),
  promptIconLibrary: vi.fn(),
}));

// Mock the project-creator module
vi.doMock('../project-creator.js', () => ({
  ProjectCreator: vi.fn().mockImplementation(function () {
    return {
      create: vi.fn(),
      getProjectName: vi.fn(),
      checkExistingDirectory: vi.fn(),
      getTemplatePath: vi.fn(),
      copyTemplate: vi.fn(),
      setupBulmaFlavor: vi.fn(),
      setupIconLibrary: vi.fn(),
      setupConfigProvider: vi.fn(),
    };
  }),
}));

// Import mocked modules - these need to be at the top level
const displayModule = await import('../display.js');
const fileSystem = await import('../file-system.js');
const _prompts = await import('../prompts.js');
const projectCreatorModule = await import('../project-creator.js');
const cliModule = await import('../cli.js');
const constantsModule = await import('../constants.js');

const {
  displayHeader: _displayHeader,
  displaySuccess: _displaySuccess,
  displayError: _displayError,
  displayCancelled: _displayCancelled,
} = displayModule;
const { ProjectCreator } = projectCreatorModule;
const { createCLI, runCLI, dropForwardedSeparator } = cliModule;
const {
  TEMPLATES: _TEMPLATES,
  ICON_LIBRARIES: _ICON_LIBRARIES,
  BULMA_FLAVORS: _BULMA_FLAVORS,
} = constantsModule;

// Mock console methods
const originalConsole = { ...console };

beforeEach(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('cli', () => {
  describe('createCLI', () => {
    it('should create a Commander program with correct configuration', () => {
      const program = createCLI();

      expect(program.name()).toBe('create-bestax');
      expect(program.description()).toBe('Create a new bestax-bulma project');

      // Check that version is set
      const versionStr = program.version();
      expect(versionStr).toBeDefined();
      expect(typeof versionStr).toBe('string');

      // Check options are configured
      const options = program.options;
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '-t, --template <template>',
        })
      );
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '--lint <linter>',
        })
      );
      for (const flags of [
        '--immediate',
        '--no-immediate',
        '--no-interactive',
      ]) {
        expect(options).toContainEqual(expect.objectContaining({ flags }));
      }
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '-b, --bulma <flavor>',
        })
      );
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '-i, --icon <library>',
        })
      );
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '-y, --yes',
        })
      );
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '--telemetry',
        })
      );
      expect(options).toContainEqual(
        expect.objectContaining({
          flags: '--no-telemetry',
        })
      );
    });

    it('should offer --overwrite and say -y never removes files (#945)', () => {
      const program = createCLI();
      const overwrite = program.options.find(opt => opt.long === '--overwrite');
      const yes = program.options.find(opt => opt.long === '--yes');
      expect(overwrite?.description).toContain('remove existing files');
      expect(yes?.description).toContain('--overwrite');

      program.parse(['my-app', '-y', '--overwrite'], { from: 'user' });
      expect(program.opts().overwrite).toBe(true);
    });

    it('should take a path as the project directory and say so (#1154)', () => {
      const program = createCLI();
      const [projectDirectory] = program.registeredArguments;
      expect(projectDirectory.name()).toBe('project-directory');
      expect(projectDirectory.description).toContain('a name or a path');

      program.parse(['/tmp/a/b/login', '-y'], { from: 'user' });
      expect(program.args).toEqual(['/tmp/a/b/login']);
    });

    it('should leave telemetry undefined when neither flag is given', () => {
      const program = createCLI();
      program.parse(['my-app', '-y'], { from: 'user' });
      expect(program.opts().telemetry).toBeUndefined();
    });

    it('should parse --telemetry and --no-telemetry into a boolean', () => {
      const on = createCLI();
      on.parse(['my-app', '-y', '--telemetry'], { from: 'user' });
      expect(on.opts().telemetry).toBe(true);

      const off = createCLI();
      off.parse(['my-app', '-y', '--no-telemetry'], { from: 'user' });
      expect(off.opts().telemetry).toBe(false);
    });

    it('should have correct template options in help text', () => {
      const program = createCLI();
      const templateOption = program.options.find(opt =>
        opt.flags.includes('--template')
      );
      expect(templateOption?.description).toBe(
        'template to use (vite, vite-ts, vite-compiler, vite-compiler-ts, react-router, react-router-ts, tanstack-router-ts, next, next-ts)'
      );
    });

    it('lists every linter in the --lint help text', () => {
      const lintOption = createCLI().options.find(opt => opt.long === '--lint');
      expect(lintOption?.description).toBe('linter (oxlint, eslint)');
    });

    it('should have correct Bulma flavor options in help text', () => {
      const program = createCLI();
      const bulmaOption = program.options.find(opt =>
        opt.flags.includes('--bulma')
      );
      expect(bulmaOption?.description).toContain('complete');
      expect(bulmaOption?.description).toContain('prefixed');
    });

    it('should have correct icon library options in help text', () => {
      const program = createCLI();
      const iconOption = program.options.find(opt =>
        opt.flags.includes('--icon')
      );
      expect(iconOption?.description).toContain('none');
      expect(iconOption?.description).toContain('fontawesome');
      expect(iconOption?.description).toContain('mdi');
      expect(iconOption?.description).toContain('ionicons');
      expect(iconOption?.description).toContain('material-icons');
      expect(iconOption?.description).toContain('material-symbols');
    });
  });

  describe('runCLI with ProjectCreator', () => {
    let mockProjectCreator: unknown;
    const originalExit = process.exit;

    beforeEach(() => {
      mockProjectCreator = new ProjectCreator();
      (ProjectCreator as MockedClass<typeof ProjectCreator>).mockClear();
      process.exit = vi.fn() as unknown;
    });

    afterEach(() => {
      process.exit = originalExit;
    });

    it('should use ProjectCreator to create project with defaults', async () => {
      const program = createCLI();

      // Simulate command line arguments for the test
      const args = ['node', 'create-bestax', 'my-project'];
      program.parse(args);

      // The CLI should create a ProjectCreator instance and call create
      expect(ProjectCreator).toHaveBeenCalled();
    });

    it('should handle CLI options correctly', async () => {
      mockProjectCreator.create.mockResolvedValue(undefined);

      const program = createCLI();
      const args = [
        'node',
        'create-bestax',
        'my-project',
        '--template',
        'vite-ts',
        '--bulma',
        'prefixed',
        '--icon',
        'fontawesome',
        '--yes',
      ];

      // Parse the arguments
      await program.parseAsync(args);

      // Verify ProjectCreator was instantiated
      expect(ProjectCreator).toHaveBeenCalled();

      // Get the created instance
      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;

      // Verify create was called with correct arguments
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        template: 'vite-ts',
        bulma: 'prefixed',
        icon: 'fontawesome',
        yes: true,
      });
    });

    it.each([
      [['--no-interactive'], { yes: true }],
      [['--immediate'], { immediate: true }],
      [['--no-immediate'], { immediate: false }],
      [['-y', '--no-interactive'], { yes: true }],
    ])('passes %j to create as %j', async (flags, expected) => {
      mockProjectCreator.create.mockResolvedValue(undefined);

      await createCLI().parseAsync(['node', 'create-bestax', 'app', ...flags]);

      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('app', expected);
    });

    it('should handle no project name', async () => {
      mockProjectCreator.create.mockResolvedValue(undefined);

      const program = createCLI();
      const args = ['node', 'create-bestax'];

      await program.parseAsync(args);

      // Should call create with undefined project name
      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith(
        undefined,
        expect.any(Object)
      );
    });

    it('should validate template option', async () => {
      const program = createCLI();
      const args = [
        'node',
        'create-bestax',
        'my-project',
        '--template',
        'invalid-template',
      ];

      // Parse should not throw, but ProjectCreator.create should handle validation
      await program.parseAsync(args);

      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        template: 'invalid-template',
      });
    });

    it('should validate bulma option', async () => {
      const program = createCLI();
      const args = [
        'node',
        'create-bestax',
        'my-project',
        '--bulma',
        'invalid-flavor',
      ];

      await program.parseAsync(args);

      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        bulma: 'invalid-flavor',
      });
    });

    it('should validate icon option', async () => {
      const program = createCLI();
      const args = [
        'node',
        'create-bestax',
        'my-project',
        '--icon',
        'invalid-icon',
      ];

      await program.parseAsync(args);

      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        icon: 'invalid-icon',
      });
    });

    it('should handle --yes flag', async () => {
      const program = createCLI();
      const args = ['node', 'create-bestax', 'my-project', '--yes'];

      await program.parseAsync(args);

      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        yes: true,
      });
    });

    it('should handle combined options', async () => {
      const program = createCLI();
      const args = [
        'node',
        'create-bestax',
        'test-app',
        '-t',
        'vite',
        '-b',
        'complete',
        '-i',
        'mdi',
        '-y',
      ];

      await program.parseAsync(args);

      const instance = (ProjectCreator as MockedClass<typeof ProjectCreator>)
        .mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('test-app', {
        template: 'vite',
        bulma: 'complete',
        icon: 'mdi',
        yes: true,
      });
    });
  });

  describe('a `--` the package manager forwards (#950)', () => {
    const argvAfter = (...userArgs: string[]) => [
      'node',
      'create-bestax',
      ...userArgs,
    ];

    it.each([
      [
        'after the name (bun create, pnpm create, bunx)',
        argvAfter('my-app', '--', '-t', 'vite-ts', '-y'),
      ],
      ['before the name', argvAfter('--', 'my-app', '-t', 'vite-ts', '-y')],
    ])('is dropped when it comes %s', (_label, argv) => {
      expect(dropForwardedSeparator(argv)).toEqual(
        argvAfter('my-app', '-t', 'vite-ts', '-y')
      );
    });

    it('leaves argv without one alone, as npm and Yarn 1 deliver it', () => {
      const argv = argvAfter('my-app', '-t', 'vite-ts', '-y');
      expect(dropForwardedSeparator(argv)).toEqual(argv);
    });

    it('drops only the first, so a second still ends the options', () => {
      expect(dropForwardedSeparator(argvAfter('--', '--', '-odd'))).toEqual(
        argvAfter('--', '-odd')
      );
    });

    it('lets runCLI read the flags after it', async () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      process.exit = vi.fn(() => {
        throw new Error('process.exit called');
      }) as unknown as typeof process.exit;
      const stderr = vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      process.argv = argvAfter('my-app', '--', '-t', 'vite-ts', '-y');

      try {
        await runCLI();
      } finally {
        process.argv = originalArgv;
        process.exit = originalExit;
        stderr.mockRestore();
      }

      const instance = (
        ProjectCreator as MockedClass<typeof ProjectCreator>
      ).mock.results.at(-1)?.value;
      expect(instance.create).toHaveBeenCalledWith('my-app', {
        template: 'vite-ts',
        yes: true,
      });
    });
  });

  describe('runCLI', () => {
    it('should be defined and callable', () => {
      expect(runCLI).toBeDefined();
      expect(typeof runCLI).toBe('function');
    });

    it('should create and configure the CLI program', async () => {
      // Mock process.argv
      const originalArgv = process.argv;
      const originalExit = process.exit;
      process.argv = ['node', 'create-bestax', '--help'];
      process.exit = vi.fn() as unknown;

      // Capture the help output
      const helpSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);

      await runCLI();

      // Verify help was displayed
      expect(helpSpy).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(0);

      helpSpy.mockRestore();
      process.argv = originalArgv;
      process.exit = originalExit;
    });
  });

  describe('CLI wrapper functions', () => {
    it('should call getProjectName through wrapper', async () => {
      const { getProjectName } = cliModule;
      const mockGetProjectName = vi.fn().mockResolvedValue('test-project');
      (ProjectCreator as MockedClass<typeof ProjectCreator>).mockImplementation(
        function () {
          return {
            getProjectName: mockGetProjectName,
            create: vi.fn(),
            checkExistingDirectory: vi.fn(),
            getTemplatePath: vi.fn(),
            copyTemplate: vi.fn(),
            setupBulmaFlavor: vi.fn(),
            setupIconLibrary: vi.fn(),
            setupConfigProvider: vi.fn(),
          } as unknown;
        }
      );

      const result = await getProjectName('my-project');
      expect(result).toBe('test-project');
      expect(mockGetProjectName).toHaveBeenCalledWith('my-project');
    });

    it('should call checkExistingDirectory through wrapper', async () => {
      const { checkExistingDirectory } = cliModule;
      const mockCheckExisting = vi.fn().mockResolvedValue(true);
      (ProjectCreator as MockedClass<typeof ProjectCreator>).mockImplementation(
        function () {
          return {
            checkExistingDirectory: mockCheckExisting,
            getProjectName: vi.fn(),
            create: vi.fn(),
            getTemplatePath: vi.fn(),
            copyTemplate: vi.fn(),
            setupBulmaFlavor: vi.fn(),
            setupIconLibrary: vi.fn(),
            setupConfigProvider: vi.fn(),
          } as unknown;
        }
      );

      const result = await checkExistingDirectory('/path', 'dir');
      expect(result).toBe(true);
      expect(mockCheckExisting).toHaveBeenCalledWith('/path', 'dir');
    });

    it('should call getTemplatePath through wrapper', () => {
      const { getTemplatePath } = cliModule;
      const mockGetTemplate = vi.fn().mockReturnValue('/template/path');
      (ProjectCreator as MockedClass<typeof ProjectCreator>).mockImplementation(
        function () {
          return {
            getTemplatePath: mockGetTemplate,
            getProjectName: vi.fn(),
            checkExistingDirectory: vi.fn(),
            create: vi.fn(),
            copyTemplate: vi.fn(),
            setupBulmaFlavor: vi.fn(),
            setupIconLibrary: vi.fn(),
            setupConfigProvider: vi.fn(),
          } as unknown;
        }
      );

      const result = getTemplatePath('vite');
      expect(result).toBe('/template/path');
      expect(mockGetTemplate).toHaveBeenCalledWith('vite');
    });

    it('should call copyTemplate through wrapper', async () => {
      const { copyTemplate } = cliModule;
      (
        fileSystem.copyDirectory as MockedFunction<
          typeof fileSystem.copyDirectory
        >
      ).mockResolvedValue(undefined);

      await copyTemplate('/src', '/dest');
      expect(fileSystem.copyDirectory).toHaveBeenCalledWith('/src', '/dest');
    });

    it('should call createProject through wrapper', async () => {
      const { createProject } = cliModule;
      const mockCreate = vi.fn().mockResolvedValue(undefined);
      (ProjectCreator as MockedClass<typeof ProjectCreator>).mockImplementation(
        function () {
          return {
            create: mockCreate,
            getProjectName: vi.fn(),
            checkExistingDirectory: vi.fn(),
            getTemplatePath: vi.fn(),
            copyTemplate: vi.fn(),
            setupBulmaFlavor: vi.fn(),
            setupIconLibrary: vi.fn(),
            setupConfigProvider: vi.fn(),
          } as unknown;
        }
      );

      await createProject('my-project', { template: 'vite' });
      expect(mockCreate).toHaveBeenCalledWith('my-project', {
        template: 'vite',
      });
    });
  });
});
