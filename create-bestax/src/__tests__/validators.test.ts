import { describe, it, expect } from '@jest/globals';
import { validateProjectName, isValidProjectName } from '../validators.js';

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

    it('should accept project names with underscores', () => {
      expect(validateProjectName('my_project')).toBe(true);
      expect(validateProjectName('my_awesome_project')).toBe(true);
      expect(validateProjectName('__private__')).toBe(true);
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
