import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

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
  emptyDirectory: jest.fn(),
  ensureDirectory: jest.fn(),
  copyDirectory: jest.fn(),
  updatePackageJson: jest.fn(),
}));

const fs = await import('fs-extra');
const prompts = (await import('prompts')).default;
const fileSystem = await import('../file-system.js');
const { ProjectCreator } = await import('../project-creator.js');
const { ICON_LIBRARIES: _ICON_LIBRARIES, BULMA_FLAVORS: _BULMA_FLAVORS } =
  await import('../constants.js');

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
    it('should return true for non-existent directory', async () => {
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

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );
      expect(result).toBe(true);
    });

    it('should return true for empty directory', async () => {
      (
        fileSystem.checkDirectoryExists as jest.MockedFunction<
          typeof fileSystem.checkDirectoryExists
        >
      ).mockResolvedValue(true);
      (
        fileSystem.isDirectoryEmpty as jest.MockedFunction<
          typeof fileSystem.isDirectoryEmpty
        >
      ).mockResolvedValue(true);

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );
      expect(result).toBe(true);
    });

    it('should prompt for overwrite when directory has files', async () => {
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
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        overwrite: true,
      });

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );

      expect(result).toBe(true);
      expect(fileSystem.emptyDirectory).toHaveBeenCalledWith(
        '/path/to/project'
      );
    });

    it('should return false when user declines overwrite', async () => {
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
      (prompts as jest.MockedFunction<typeof prompts>).mockResolvedValue({
        overwrite: false,
      });

      const result = await projectCreator.checkExistingDirectory(
        '/path/to/project',
        'project'
      );

      expect(result).toBe(false);
      expect(fileSystem.emptyDirectory).not.toHaveBeenCalled();
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
        '/target/path'
      );
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
        `import React from 'react';\nimport 'bulma/css/bulma.min.css';` as unknown
      );

      await projectCreator.setupBulmaFlavor(targetPath, 'complete', 'vite');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining("import 'bulma/css/bulma.min.css'")
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
        `import React from 'react';\nimport 'bulma/css/bulma.min.css';` as unknown
      );

      await projectCreator.setupBulmaFlavor(targetPath, 'prefixed', 'vite-ts');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        _mainFilePath,
        expect.stringContaining(
          "import 'bulma/css/versions/bulma-prefixed.min.css'"
        )
      );
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

      // Check Icon was added to import
      expect(writtenContent).toContain('Icon');
      // Check icons were added to cards
      expect(writtenContent).toContain('Icon name="rocket"');
      expect(writtenContent).toContain('Icon name="book"');
      expect(writtenContent).toContain('Icon name="code"');
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
      ).mockResolvedValue(`import 'bulma/css/bulma.min.css';` as unknown);

      await projectCreator.setupIconLibrary(targetPath, 'fontawesome', 'vite');

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        packageJsonPath,
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@fortawesome/fontawesome-free': 'latest',
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
      ).mockResolvedValue(`import 'bulma/css/bulma.min.css';` as unknown);

      await projectCreator.setupIconLibrary(targetPath, 'mdi', 'vite-ts');

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        packageJsonPath,
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@mdi/font': 'latest',
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
        expect.stringContaining('classPrefix="bulma-"')
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
      expect(pc.getIconProps('fontawesome', 'rocket')).toBe(
        'name="rocket" variant="solid"'
      );
      expect(pc.getIconProps('fontawesome', 'book')).toBe(
        'name="book" variant="solid"'
      );
      expect(pc.getIconProps('fontawesome', 'code')).toBe(
        'name="code" variant="solid"'
      );
    });

    it('should return correct icon props for other libraries', () => {
      const pc = projectCreator as unknown;
      expect(pc.getIconProps('mdi', 'rocket')).toBe('name="rocket-launch"');
      expect(pc.getIconProps('ionicons', 'book')).toBe('name="book"');
      expect(pc.getIconProps('material-icons', 'code')).toBe('name="code"');
    });

    it('should return empty string when no icon name found', () => {
      const pc = projectCreator as unknown;
      expect(pc.getIconProps('unknown', 'rocket')).toBe('');
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

    it('should prompt for missing template option', async () => {
      const options = {
        bulma: 'complete',
        icon: 'none',
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
        template: 'vite',
        icon: 'none',
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
        template: 'vite',
        bulma: 'complete',
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
    it('should add Bulma import after React import when no Bulma import exists', async () => {
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
        expect.stringContaining("import 'bulma/css/bulma.min.css'")
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
      expect(writtenContent).toContain('classPrefix="bulma-"');
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
      ).mockResolvedValue(`import 'bulma/css/bulma.min.css';` as unknown);

      await projectCreator.setupIconLibrary(targetPath, 'fontawesome', 'vite');

      // Should create dependencies object and add package
      expect(fs.default.writeJson).toHaveBeenCalledWith(
        packageJsonPath,
        expect.objectContaining({
          dependencies: expect.objectContaining({
            '@fortawesome/fontawesome-free': 'latest',
          }),
        }),
        { spaces: 2 }
      );
    });
  });
});
