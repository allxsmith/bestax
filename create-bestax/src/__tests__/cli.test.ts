import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

// Mock modules before imports
jest.unstable_mockModule('fs-extra', () => ({
  default: {
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    emptyDir: jest.fn(),
    ensureDir: jest.fn(),
    copy: jest.fn(),
    readJson: jest.fn(),
    writeJson: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  emptyDir: jest.fn(),
  ensureDir: jest.fn(),
  copy: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.unstable_mockModule('prompts', () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule('chalk', () => ({
  default: {
    yellow: jest.fn((str: string) => str),
    blue: jest.fn((str: string) => str),
    cyan: jest.fn((str: string) => str),
    magenta: jest.fn((str: string) => str),
    green: jest.fn((str: string) => str),
    red: jest.fn((str: string) => str),
    dim: jest.fn((str: string) => str),
    bold: jest.fn((str: string) => str),
    gray: jest.fn((str: string) => str),
  },
}));

// Mock the display module
jest.unstable_mockModule('../display.js', () => ({
  displayHeader: jest.fn(),
  displaySuccess: jest.fn(),
  displayError: jest.fn(),
  displayCancelled: jest.fn(),
}));

// Mock the file-system module
jest.unstable_mockModule('../file-system.js', () => ({
  checkDirectoryExists: jest.fn(),
  isDirectoryEmpty: jest.fn(),
  emptyDirectory: jest.fn(),
  ensureDirectory: jest.fn(),
  copyDirectory: jest.fn(),
  updatePackageJson: jest.fn(),
}));

// Mock the prompts module
jest.unstable_mockModule('../prompts.js', () => ({
  promptProjectName: jest.fn(),
  promptOverwriteDirectory: jest.fn(),
  promptTemplate: jest.fn(),
  promptBulmaFlavor: jest.fn(),
  promptIconLibrary: jest.fn(),
}));

// Mock the project-creator module
jest.unstable_mockModule('../project-creator.js', () => ({
  ProjectCreator: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    getProjectName: jest.fn(),
    checkExistingDirectory: jest.fn(),
    getTemplatePath: jest.fn(),
    copyTemplate: jest.fn(),
    setupBulmaFlavor: jest.fn(),
    setupIconLibrary: jest.fn(),
    setupConfigProvider: jest.fn(),
  })),
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
const { createCLI, runCLI } = cliModule;
const {
  TEMPLATES: _TEMPLATES,
  ICON_LIBRARIES: _ICON_LIBRARIES,
  BULMA_FLAVORS: _BULMA_FLAVORS,
} = constantsModule;

// Mock console methods
const originalConsole = { ...console };

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  jest.clearAllMocks();
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
    });

    it('should have correct template options in help text', () => {
      const program = createCLI();
      const templateOption = program.options.find(opt =>
        opt.flags.includes('--template')
      );
      expect(templateOption?.description).toContain('vite');
      expect(templateOption?.description).toContain('vite-ts');
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
      (ProjectCreator as jest.MockedClass<typeof ProjectCreator>).mockClear();
      process.exit = jest.fn() as unknown;
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
      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;

      // Verify create was called with correct arguments
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        template: 'vite-ts',
        bulma: 'prefixed',
        icon: 'fontawesome',
        yes: true,
      });
    });

    it('should handle no project name', async () => {
      mockProjectCreator.create.mockResolvedValue(undefined);

      const program = createCLI();
      const args = ['node', 'create-bestax'];

      await program.parseAsync(args);

      // Should call create with undefined project name
      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;
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

      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;
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

      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;
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

      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('my-project', {
        icon: 'invalid-icon',
      });
    });

    it('should handle --yes flag', async () => {
      const program = createCLI();
      const args = ['node', 'create-bestax', 'my-project', '--yes'];

      await program.parseAsync(args);

      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;
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

      const instance = (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mock.results[0]?.value;
      expect(instance.create).toHaveBeenCalledWith('test-app', {
        template: 'vite',
        bulma: 'complete',
        icon: 'mdi',
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
      process.exit = jest.fn() as unknown;

      // Capture the help output
      const helpSpy = jest
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
      const mockGetProjectName = jest.fn().mockResolvedValue('test-project');
      (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mockImplementation(
        () =>
          ({
            getProjectName: mockGetProjectName,
            create: jest.fn(),
            checkExistingDirectory: jest.fn(),
            getTemplatePath: jest.fn(),
            copyTemplate: jest.fn(),
            setupBulmaFlavor: jest.fn(),
            setupIconLibrary: jest.fn(),
            setupConfigProvider: jest.fn(),
          }) as unknown
      );

      const result = await getProjectName('my-project');
      expect(result).toBe('test-project');
      expect(mockGetProjectName).toHaveBeenCalledWith('my-project');
    });

    it('should call checkExistingDirectory through wrapper', async () => {
      const { checkExistingDirectory } = cliModule;
      const mockCheckExisting = jest.fn().mockResolvedValue(true);
      (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mockImplementation(
        () =>
          ({
            checkExistingDirectory: mockCheckExisting,
            getProjectName: jest.fn(),
            create: jest.fn(),
            getTemplatePath: jest.fn(),
            copyTemplate: jest.fn(),
            setupBulmaFlavor: jest.fn(),
            setupIconLibrary: jest.fn(),
            setupConfigProvider: jest.fn(),
          }) as unknown
      );

      const result = await checkExistingDirectory('/path', 'dir');
      expect(result).toBe(true);
      expect(mockCheckExisting).toHaveBeenCalledWith('/path', 'dir');
    });

    it('should call getTemplatePath through wrapper', () => {
      const { getTemplatePath } = cliModule;
      const mockGetTemplate = jest.fn().mockReturnValue('/template/path');
      (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mockImplementation(
        () =>
          ({
            getTemplatePath: mockGetTemplate,
            getProjectName: jest.fn(),
            checkExistingDirectory: jest.fn(),
            create: jest.fn(),
            copyTemplate: jest.fn(),
            setupBulmaFlavor: jest.fn(),
            setupIconLibrary: jest.fn(),
            setupConfigProvider: jest.fn(),
          }) as unknown
      );

      const result = getTemplatePath('vite');
      expect(result).toBe('/template/path');
      expect(mockGetTemplate).toHaveBeenCalledWith('vite');
    });

    it('should call copyTemplate through wrapper', async () => {
      const { copyTemplate } = cliModule;
      (
        fileSystem.copyDirectory as jest.MockedFunction<
          typeof fileSystem.copyDirectory
        >
      ).mockResolvedValue(undefined);

      await copyTemplate('/src', '/dest');
      expect(fileSystem.copyDirectory).toHaveBeenCalledWith('/src', '/dest');
    });

    it('should call createProject through wrapper', async () => {
      const { createProject } = cliModule;
      const mockCreate = jest.fn().mockResolvedValue(undefined);
      (
        ProjectCreator as jest.MockedClass<typeof ProjectCreator>
      ).mockImplementation(
        () =>
          ({
            create: mockCreate,
            getProjectName: jest.fn(),
            checkExistingDirectory: jest.fn(),
            getTemplatePath: jest.fn(),
            copyTemplate: jest.fn(),
            setupBulmaFlavor: jest.fn(),
            setupIconLibrary: jest.fn(),
            setupConfigProvider: jest.fn(),
          }) as unknown
      );

      await createProject('my-project', { template: 'vite' });
      expect(mockCreate).toHaveBeenCalledWith('my-project', {
        template: 'vite',
      });
    });
  });
});
