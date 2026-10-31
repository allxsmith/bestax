import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import {
  validateProjectName,
  validateProjectDirectory,
  isValidProjectName,
  toValidPackageName,
} from '../validators.js';

describe('validators', () => {
  describe('validateProjectName', () => {
    it('should reject empty project name', () => {
      expect(validateProjectName('')).toBe('Project name is required');
    });

    it('should reject project name that is too long', () => {
      const longName = 'a'.repeat(215);
      expect(validateProjectName(longName)).toBe('Project name too long');
    });

    it('should reject project name with invalid characters', () => {
      expect(validateProjectName('my project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('my@project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('my/project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
    });

    it('should accept valid project names', () => {
      expect(validateProjectName('my-project')).toBe(true);
      expect(validateProjectName('my_project')).toBe(true);
      expect(validateProjectName('my.project')).toBe(true);
      expect(validateProjectName('MyProject123')).toBe(true);
      expect(validateProjectName('project-123_test.app')).toBe(true);
    });

    it('should reject project names with special characters', () => {
      expect(validateProjectName('my#project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('my$project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('my%project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('my&project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('my*project')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
    });

    it('should reject project names with spaces at the beginning or end', () => {
      expect(validateProjectName(' myproject')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName('myproject ')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
      expect(validateProjectName(' myproject ')).toBe(
        'Project name can only contain letters, numbers, dots, dashes and underscores'
      );
    });

    it('should accept project names with dots', () => {
      expect(validateProjectName('my.project')).toBe(true);
      expect(validateProjectName('my.awesome.project')).toBe(true);
      expect(validateProjectName('v1.0.0')).toBe(true);
    });

    it('should reject project names that start with a dot', () => {
      const dotMessage =
        'Project name cannot start with a dot (".." would scaffold outside a new directory) — pass a directory name, or "." alone for the current directory';
      expect(validateProjectName('.')).toBe(dotMessage);
      expect(validateProjectName('..')).toBe(dotMessage);
      expect(validateProjectName('...')).toBe(dotMessage);
      expect(validateProjectName('.hidden')).toBe(dotMessage);
      expect(validateProjectName('.dotfile')).toBe(dotMessage);
    });

    it('should accept project names with underscores', () => {
      expect(validateProjectName('my_project')).toBe(true);
      expect(validateProjectName('my_awesome_project')).toBe(true);
      expect(validateProjectName('__private__')).toBe(true);
    });

    it('should reject a name that would leave no npm package name', () => {
      const message =
        'Project name must contain a letter, number or dash (npm package names cannot start with "_" or ".")';
      expect(validateProjectName('_')).toBe(message);
      expect(validateProjectName('___')).toBe(message);
      expect(validateProjectName('_._')).toBe(message);
      expect(validateProjectName('_-')).toBe(true);
    });

    it('should accept project names with dashes', () => {
      expect(validateProjectName('my-project')).toBe(true);
      expect(validateProjectName('my-awesome-project')).toBe(true);
      expect(validateProjectName('react-app')).toBe(true);
    });

    it('should accept project names with mixed valid characters', () => {
      expect(validateProjectName('my-awesome_project.v2')).toBe(true);
      expect(validateProjectName('test_123-app.beta')).toBe(true);
      expect(validateProjectName('MyProject_v1.0-beta')).toBe(true);
    });

    it('should handle edge cases for length', () => {
      const maxLengthName = 'a'.repeat(214);
      expect(validateProjectName(maxLengthName)).toBe(true);

      const tooLongName = 'a'.repeat(215);
      expect(validateProjectName(tooLongName)).toBe('Project name too long');
    });
  });

  describe('validateProjectDirectory (#1154)', () => {
    const invalidChars =
      'Project name can only contain letters, numbers, dots, dashes and underscores';
    const dotMessage =
      'Project name cannot start with a dot (".." would scaffold outside a new directory) — pass a directory name, or "." alone for the current directory';

    it('accepts a bare name, as validateProjectName does', () => {
      expect(validateProjectDirectory('login')).toBe(true);
    });

    it.each([
      ['relative', 'apps/login'],
      ['relative from the parent', '../login'],
      ['relative from here', './login'],
      ['absolute', path.join(os.tmpdir(), 'login')],
      ['nested', 'scratch/a/b/login'],
      ['with a trailing slash', 'scratch/login/'],
      ['with trailing slashes', 'login//'],
    ])('accepts a %s path whose last part is a valid name', (_label, dir) => {
      expect(validateProjectDirectory(dir)).toBe(true);
    });

    it('judges only the last part, so a parent folder may hold a space', () => {
      expect(validateProjectDirectory('/tmp/My Projects/login')).toBe(true);
    });

    it('rejects ".." as validateProjectName does', () => {
      expect(validateProjectDirectory('..')).toBe(dotMessage);
    });

    it('takes "." alone as the current directory, named after it', () => {
      expect(validateProjectDirectory('.', '/work/my-app')).toBe(true);
      expect(validateProjectDirectory('./', '/work/my-app')).toBe(true);
      expect(validateProjectDirectory('.', '/work/My App')).toBe(
        `${invalidChars} (the project name is "My App", the current directory's name)`
      );
      expect(validateProjectDirectory('.', '/')).toBe(
        'Project name is required (the project name is "", the current directory\'s name)'
      );
    });

    it('takes only the platform separator after the dot', () => {
      // On POSIX a backslash is part of a file name, so ".\\" names a folder,
      // and the leading-dot rule refuses it as before.
      const backslash = validateProjectDirectory('.\\', '/work/my-app');
      if (path.sep === '/') {
        expect(backslash).toBe(dotMessage);
      } else {
        expect(backslash).toBe(true);
      }
    });

    it('rejects a path that ends in "." or "..", naming that part', () => {
      expect(validateProjectDirectory('apps/.')).toBe(
        `${dotMessage} (the project name is ".", the last part of the path)`
      );
      expect(validateProjectDirectory('../..')).toBe(
        `${dotMessage} (the project name is "..", the last part of the path)`
      );
    });

    it('rejects an invalid last part with the rule it broke and the part itself', () => {
      expect(validateProjectDirectory('/tmp/My App')).toBe(
        `${invalidChars} (the project name is "My App", the last part of the path)`
      );
      expect(validateProjectDirectory('apps/.hidden/')).toBe(
        `${dotMessage} (the project name is ".hidden", the last part of the path)`
      );
      expect(validateProjectDirectory('/')).toBe(
        'Project name is required (the project name is "", the last part of the path)'
      );
    });
  });

  describe('toValidPackageName (#950)', () => {
    it('lower-cases the name, as npm init does', () => {
      expect(toValidPackageName('MyApp')).toBe('myapp');
      expect(toValidPackageName('MyProject_v1.0-beta')).toBe(
        'myproject_v1.0-beta'
      );
    });

    it('drops the leading underscores npm rejects', () => {
      expect(toValidPackageName('_under')).toBe('under');
      expect(toValidPackageName('__private__')).toBe('private__');
    });

    it('leaves a name npm already accepts alone', () => {
      expect(toValidPackageName('my-app')).toBe('my-app');
      expect(toValidPackageName('my_app.v2')).toBe('my_app.v2');
    });
  });

  describe('isValidProjectName', () => {
    it('should return true for valid project names', () => {
      expect(isValidProjectName('my-project')).toBe(true);
      expect(isValidProjectName('project123')).toBe(true);
      expect(isValidProjectName('a')).toBe(true);
      expect(isValidProjectName('valid.name')).toBe(true);
      expect(isValidProjectName('my_project')).toBe(true);
      expect(isValidProjectName('MyProject')).toBe(true);
    });

    it('should return false for invalid project names', () => {
      expect(isValidProjectName('')).toBe(false);
      expect(isValidProjectName('my@project')).toBe(false);
      expect(isValidProjectName('a'.repeat(215))).toBe(false);
      expect(isValidProjectName('my project')).toBe(false);
      expect(isValidProjectName('my/project')).toBe(false);
      expect(isValidProjectName('my#project')).toBe(false);
      expect(isValidProjectName('my$project')).toBe(false);
      expect(isValidProjectName('my%project')).toBe(false);
      expect(isValidProjectName('my&project')).toBe(false);
    });

    it('should return false for dot and leading-dot project names', () => {
      expect(isValidProjectName('.')).toBe(false);
      expect(isValidProjectName('..')).toBe(false);
      expect(isValidProjectName('...')).toBe(false);
      expect(isValidProjectName('.hidden')).toBe(false);
    });

    it('should be consistent with validateProjectName', () => {
      const testNames = [
        'valid-name',
        '',
        'invalid name',
        'a'.repeat(214),
        'a'.repeat(215),
        'special@char',
        '.dotfile',
        '123numbers',
        'my_project',
        'my-awesome-project',
        'my.project.v2',
      ];

      testNames.forEach(name => {
        const isValid = isValidProjectName(name);
        const validationResult = validateProjectName(name);
        expect(isValid).toBe(validationResult === true);
      });
    });
  });
});
