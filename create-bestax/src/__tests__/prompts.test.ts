import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

// Mock chalk to return strings as-is
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

// Mock prompts module
jest.unstable_mockModule('prompts', () => ({
  default: jest.fn(),
}));

// Mock fs-extra
jest.unstable_mockModule('fs-extra', () => ({
  default: {
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    emptyDir: jest.fn(),
  },
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  emptyDir: jest.fn(),
}));

const prompts = (await import('prompts')).default;
const _fs = await import('fs-extra');

// Import the actual prompt functions from prompts.js
const {
  promptProjectName,
  promptOverwriteDirectory,
  promptTemplate,
  promptBulmaFlavor,
  promptIconLibrary,
} = await import('../prompts.js');

// Import helper functions from cli.js
const { ProjectCreator: _ProjectCreator } = await import(
  '../project-creator.js'
);

const { validateProjectName } = await import('../validators.js');
const {
  TEMPLATES: _TEMPLATES,
  BULMA_FLAVORS,
  ICON_LIBRARIES,
} = await import('../constants.js');

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

describe('prompts', () => {
  describe('promptProjectName', () => {
    it('should prompt for project name', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        projectName: 'prompted-project',
      });
      const result = await promptProjectName();
      expect(result).toBe('prompted-project');
      expect(prompts).toHaveBeenCalledWith({
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: 'my-bestax-app',
        validate: validateProjectName,
      });
    });

    it('should return null when prompt is cancelled', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});
      const result = await promptProjectName();
      expect(result).toBeNull();
    });
  });

  describe('promptOverwriteDirectory', () => {
    it('should prompt for overwrite', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        overwrite: true,
      });

      const result = await promptOverwriteDirectory('project');

      expect(result).toBe(true);
      expect(prompts).toHaveBeenCalledWith({
        type: 'confirm',
        name: 'overwrite',
        message:
          'Directory project is not empty. Remove existing files and continue?',
        initial: false,
      });
    });

    it('should return false when user declines overwrite', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        overwrite: false,
      });

      const result = await promptOverwriteDirectory('project');

      expect(result).toBe(false);
    });

    it('should return false when user cancels prompt', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});

      const result = await promptOverwriteDirectory('project');

      expect(result).toBe(false);
    });
  });

  describe('promptTemplate', () => {
    it('should return selected template', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        template: 'vite',
      });
      const result = await promptTemplate();
      expect(result).toBe('vite');
    });

    it('should return null when cancelled', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});
      const result = await promptTemplate();
      expect(result).toBeNull();
    });

    it('should provide correct choices', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        template: 'vite',
      });
      await promptTemplate();

      const promptCall = (prompts as jest.MockedFunction<typeof prompts>).mock
        .calls[0]?.[0] as unknown;
      expect(promptCall.type).toBe('select');
      expect(promptCall.message).toBe('Select a framework:');
      expect(promptCall.choices).toHaveLength(2); // Vite and Vite+TS only
    });

    it('should format template choices correctly', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        template: 'vite-ts',
      });
      await promptTemplate();

      const promptCall = (prompts as jest.MockedFunction<typeof prompts>).mock
        .calls[0]?.[0] as unknown;
      const choices = promptCall.choices;

      // Check that choices include both JS and TS variants
      const values = choices.map((c: unknown) => c.value);
      expect(values).toContain('vite');
      expect(values).toContain('vite-ts');
    });
  });

  describe('promptBulmaFlavor', () => {
    it('should return selected Bulma flavor', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        bulmaFlavor: 'prefixed',
      });
      const result = await promptBulmaFlavor();
      expect(result).toBe('prefixed');
    });

    it('should return null when cancelled', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});
      const result = await promptBulmaFlavor();
      expect(result).toBeNull();
    });

    it('should provide correct Bulma flavor choices', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        bulmaFlavor: 'complete',
      });
      await promptBulmaFlavor();

      const promptCall = (prompts as jest.MockedFunction<typeof prompts>).mock
        .calls[0]?.[0] as unknown;
      expect(promptCall.type).toBe('select');
      expect(promptCall.message).toBe(
        'Which Bulma CSS flavor would you like to use?'
      );
      expect(promptCall.choices).toHaveLength(BULMA_FLAVORS.length);
      expect(promptCall.initial).toBe(0); // Default to first option (complete)
    });

    it('should have complete as the default flavor', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        bulmaFlavor: 'complete',
      });
      await promptBulmaFlavor();

      const promptCall = (prompts as jest.MockedFunction<typeof prompts>).mock
        .calls[0]?.[0] as unknown;
      expect(promptCall.initial).toBe(0);
      expect(BULMA_FLAVORS[0].name).toBe('complete');
    });
  });

  describe('promptIconLibrary', () => {
    it('should return selected icon library', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        iconLibrary: 'fontawesome',
      });
      const result = await promptIconLibrary();
      expect(result).toBe('fontawesome');
    });

    it('should return null when cancelled', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({});
      const result = await promptIconLibrary();
      expect(result).toBeNull();
    });

    it('should provide correct icon library choices', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        iconLibrary: 'none',
      });
      await promptIconLibrary();

      const promptCall = (prompts as jest.MockedFunction<typeof prompts>).mock
        .calls[0]?.[0] as unknown;
      expect(promptCall.type).toBe('select');
      expect(promptCall.message).toBe('Would you like to add an icon library?');
      expect(promptCall.choices).toHaveLength(ICON_LIBRARIES.length);
      expect(promptCall.initial).toBe(0); // Default to 'none'
    });

    it('should have none as the default option', async () => {
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        iconLibrary: 'none',
      });
      await promptIconLibrary();

      const promptCall = (prompts as jest.MockedFunction<typeof prompts>).mock
        .calls[0]?.[0] as unknown;
      expect(promptCall.initial).toBe(0);
      expect(ICON_LIBRARIES[0].name).toBe('none');
    });

    it('should handle all icon library options', async () => {
      for (const library of ICON_LIBRARIES) {
        (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
          iconLibrary: library.name,
        });
        const result = await promptIconLibrary();
        expect(result).toBe(library.name);
      }
    });
  });
});
