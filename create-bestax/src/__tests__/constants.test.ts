import { describe, it, expect, jest } from '@jest/globals';

// Mock chalk
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

const {
  TEMPLATES,
  ICON_LIBRARIES,
  BULMA_FLAVORS,
  DEFAULT_PROJECT_NAME,
  MAX_PROJECT_NAME_LENGTH,
  PROJECT_NAME_REGEX,
  MESSAGES,
  PROMPTS,
} = await import('../constants.js');

describe('constants', () => {
  describe('TEMPLATES', () => {
    it('should have the correct templates defined', () => {
      expect(TEMPLATES).toHaveLength(2);
      expect(TEMPLATES[0].name).toBe('vite');
      expect(TEMPLATES[0].display).toBe('Vite');
      expect(TEMPLATES[1].name).toBe('vite-ts');
      expect(TEMPLATES[1].display).toBe('Vite + TypeScript');
    });

    it('should have color functions for each template', () => {
      TEMPLATES.forEach(template => {
        expect(template.color).toBeDefined();
        expect(typeof template.color).toBe('function');
      });
    });

    it('should not include Next.js templates', () => {
      const templateNames = TEMPLATES.map(t => t.name);
      expect(templateNames).not.toContain('nextjs');
      expect(templateNames).not.toContain('nextjs-ts');
    });

    it('should have correct display names', () => {
      expect(TEMPLATES[0].display).toBe('Vite');
      expect(TEMPLATES[1].display).toBe('Vite + TypeScript');
    });
  });

  describe('ICON_LIBRARIES', () => {
    it('should have all expected icon libraries', () => {
      expect(ICON_LIBRARIES).toHaveLength(6);

      const libraryNames = ICON_LIBRARIES.map(lib => lib.name);
      expect(libraryNames).toContain('none');
      expect(libraryNames).toContain('fontawesome');
      expect(libraryNames).toContain('mdi');
      expect(libraryNames).toContain('ionicons');
      expect(libraryNames).toContain('material-icons');
      expect(libraryNames).toContain('material-symbols');
    });

    it('should have none as the first option', () => {
      expect(ICON_LIBRARIES[0].name).toBe('none');
      expect(ICON_LIBRARIES[0].display).toBe("None (I'll add icons later)");
    });

    it('should have correct display names', () => {
      const expectedDisplayNames = {
        none: "None (I'll add icons later)",
        fontawesome: 'Font Awesome',
        mdi: 'Material Design Icons',
        ionicons: 'Ionicons',
        'material-icons': 'Google Material Icons',
        'material-symbols': 'Material Symbols',
      };

      ICON_LIBRARIES.forEach(library => {
        expect(library.display).toBe(expectedDisplayNames[library.name]);
      });
    });

    it('should have color functions for each library', () => {
      ICON_LIBRARIES.forEach(library => {
        expect(library.color).toBeDefined();
        expect(typeof library.color).toBe('function');
      });
    });

    it('should have correct package names', () => {
      const expectedPackages = {
        none: undefined,
        fontawesome: '@fortawesome/fontawesome-free',
        mdi: '@mdi/font',
        ionicons: undefined, // Uses CDN approach
        'material-icons': 'material-icons',
        'material-symbols': 'material-symbols',
      };

      ICON_LIBRARIES.forEach(library => {
        if (library.packageName) {
          expect(library.packageName).toBe(expectedPackages[library.name]);
        }
      });
    });

    it('should have correct import statements', () => {
      ICON_LIBRARIES.forEach(library => {
        if (library.importStatement) {
          expect(typeof library.importStatement).toBe('string');
          expect(library.importStatement.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('BULMA_FLAVORS', () => {
    it('should have all Bulma flavor options', () => {
      expect(BULMA_FLAVORS).toHaveLength(5);
      expect(BULMA_FLAVORS[0].name).toBe('complete');
      expect(BULMA_FLAVORS[1].name).toBe('prefixed');
      expect(BULMA_FLAVORS[2].name).toBe('no-helpers');
      expect(BULMA_FLAVORS[3].name).toBe('no-helpers-prefixed');
      expect(BULMA_FLAVORS[4].name).toBe('no-dark-mode');
    });

    it('should have correct display names', () => {
      expect(BULMA_FLAVORS[0].display).toBe('Complete (Recommended)');
      expect(BULMA_FLAVORS[1].display).toBe('Prefixed');
      expect(BULMA_FLAVORS[2].display).toBe('No Helpers');
      expect(BULMA_FLAVORS[3].display).toBe('No Helpers, Prefixed');
      expect(BULMA_FLAVORS[4].display).toBe('No Dark Mode');
    });

    it('should have complete as the first/default option', () => {
      expect(BULMA_FLAVORS[0].name).toBe('complete');
    });

    it('should have correct import statements', () => {
      expect(BULMA_FLAVORS[0].importStatement).toBe(
        "import 'bulma/css/bulma.min.css';"
      );
      expect(BULMA_FLAVORS[1].importStatement).toBe(
        "import 'bulma/css/versions/bulma-prefixed.min.css';"
      );
      expect(BULMA_FLAVORS[2].importStatement).toBe(
        "import 'bulma/css/versions/bulma-no-helpers.min.css';"
      );
      expect(BULMA_FLAVORS[3].importStatement).toBe(
        "import 'bulma/css/versions/bulma-no-helpers-prefixed.min.css';"
      );
      expect(BULMA_FLAVORS[4].importStatement).toBe(
        "import 'bulma/css/versions/bulma-no-dark-mode.min.css';"
      );
    });

    it('should have color functions for each flavor', () => {
      BULMA_FLAVORS.forEach(flavor => {
        expect(flavor.color).toBeDefined();
        expect(typeof flavor.color).toBe('function');
      });
    });
  });

  describe('All constants', () => {
    it('should be frozen/immutable', () => {
      // Check that arrays are frozen
      expect(Object.isFrozen(TEMPLATES)).toBe(false); // Arrays themselves might not be frozen
      expect(Object.isFrozen(ICON_LIBRARIES)).toBe(false);
      expect(Object.isFrozen(BULMA_FLAVORS)).toBe(false);
    });

    it('should have consistent structure', () => {
      // All should have name, display, and color properties
      [...TEMPLATES, ...ICON_LIBRARIES, ...BULMA_FLAVORS].forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('display');
        expect(item).toHaveProperty('color');
        expect(typeof item.name).toBe('string');
        expect(typeof item.display).toBe('string');
        expect(typeof item.color).toBe('function');
      });
    });
  });

  describe('DEFAULT_PROJECT_NAME', () => {
    it('should be a valid project name', () => {
      expect(DEFAULT_PROJECT_NAME).toBeDefined();
      expect(typeof DEFAULT_PROJECT_NAME).toBe('string');
      expect(DEFAULT_PROJECT_NAME).toBe('my-bestax-app');
      expect(PROJECT_NAME_REGEX.test(DEFAULT_PROJECT_NAME)).toBe(true);
    });
  });

  describe('MAX_PROJECT_NAME_LENGTH', () => {
    it('should be a reasonable number', () => {
      expect(MAX_PROJECT_NAME_LENGTH).toBeDefined();
      expect(typeof MAX_PROJECT_NAME_LENGTH).toBe('number');
      expect(MAX_PROJECT_NAME_LENGTH).toBe(214);
      expect(MAX_PROJECT_NAME_LENGTH).toBeGreaterThan(0);
      expect(MAX_PROJECT_NAME_LENGTH).toBeLessThan(256);
    });
  });

  describe('PROJECT_NAME_REGEX', () => {
    it('should be a valid regex', () => {
      expect(PROJECT_NAME_REGEX).toBeDefined();
      expect(PROJECT_NAME_REGEX).toBeInstanceOf(RegExp);
    });

    it('should accept valid project names', () => {
      expect(PROJECT_NAME_REGEX.test('my-project')).toBe(true);
      expect(PROJECT_NAME_REGEX.test('my_project')).toBe(true);
      expect(PROJECT_NAME_REGEX.test('my.project')).toBe(true);
      expect(PROJECT_NAME_REGEX.test('MyProject123')).toBe(true);
      expect(PROJECT_NAME_REGEX.test('123')).toBe(true);
      expect(PROJECT_NAME_REGEX.test('a')).toBe(true);
    });

    it('should reject invalid project names', () => {
      expect(PROJECT_NAME_REGEX.test('my project')).toBe(false);
      expect(PROJECT_NAME_REGEX.test('my@project')).toBe(false);
      expect(PROJECT_NAME_REGEX.test('my/project')).toBe(false);
      expect(PROJECT_NAME_REGEX.test('my\\project')).toBe(false);
      expect(PROJECT_NAME_REGEX.test('my#project')).toBe(false);
      expect(PROJECT_NAME_REGEX.test('my$project')).toBe(false);
      expect(PROJECT_NAME_REGEX.test('')).toBe(false);
    });
  });

  describe('MESSAGES', () => {
    it('should have all required message properties', () => {
      expect(MESSAGES.PROJECT_NAME_REQUIRED).toBeDefined();
      expect(MESSAGES.PROJECT_NAME_TOO_LONG).toBeDefined();
      expect(MESSAGES.PROJECT_NAME_INVALID_CHARS).toBeDefined();
      expect(MESSAGES.OPERATION_CANCELLED).toBeDefined();
      expect(MESSAGES.PROJECT_CREATED).toBeDefined();
      expect(MESSAGES.NEXT_STEPS).toBeDefined();
      expect(MESSAGES.HAPPY_CODING).toBeDefined();
    });

    it('should have correct message strings', () => {
      expect(MESSAGES.PROJECT_NAME_REQUIRED).toBe('Project name is required');
      expect(MESSAGES.PROJECT_NAME_TOO_LONG).toBe('Project name too long');
      expect(MESSAGES.PROJECT_NAME_INVALID_CHARS).toContain('contain');
      expect(MESSAGES.OPERATION_CANCELLED).toContain('cancelled');
      expect(MESSAGES.PROJECT_CREATED).toContain('created');
    });

    it('should have functions that return strings', () => {
      expect(typeof MESSAGES.DIRECTORY_NOT_EMPTY('test')).toBe('string');
      expect(MESSAGES.DIRECTORY_NOT_EMPTY('mydir')).toContain('mydir');
      expect(MESSAGES.DIRECTORY_NOT_EMPTY('mydir')).toContain('not empty');

      expect(typeof MESSAGES.EMPTYING_DIRECTORY('test')).toBe('string');
      expect(MESSAGES.EMPTYING_DIRECTORY('mydir')).toContain('mydir');

      expect(typeof MESSAGES.CREATING_PROJECT('test')).toBe('string');
      expect(MESSAGES.CREATING_PROJECT('/path')).toContain('/path');

      expect(typeof MESSAGES.TEMPLATE_NOT_FOUND('test')).toBe('string');
      expect(MESSAGES.TEMPLATE_NOT_FOUND('vite')).toContain('vite');
    });
  });

  describe('PROMPTS', () => {
    it('should have all required prompt properties', () => {
      expect(PROMPTS.PROJECT_NAME).toBeDefined();
      expect(PROMPTS.SELECT_FRAMEWORK).toBeDefined();
      expect(PROMPTS.SELECT_ICON_LIBRARY).toBeDefined();
      expect(PROMPTS.SELECT_BULMA_FLAVOR).toBeDefined();
    });

    it('should have correct prompt strings', () => {
      expect(PROMPTS.PROJECT_NAME).toBe('Project name:');
      expect(PROMPTS.SELECT_FRAMEWORK).toContain('framework');
      expect(PROMPTS.SELECT_ICON_LIBRARY).toContain('icon');
      expect(PROMPTS.SELECT_BULMA_FLAVOR).toContain('Bulma');
    });
  });
});
