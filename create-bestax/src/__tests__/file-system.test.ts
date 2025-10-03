import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import path from 'path';
const _path = path;

// Mock fs-extra
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

const fs = await import('fs-extra');
const {
  checkDirectoryExists,
  isDirectoryEmpty,
  emptyDirectory,
  ensureDirectory,
  copyDirectory,
  updatePackageJson,
  readJsonFile,
  writeJsonFile,
} = await import('../file-system.js');

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

describe('file-system', () => {
  describe('checkDirectoryExists', () => {
    it('should return true when directory exists', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      const result = await checkDirectoryExists('/test/path');
      expect(result).toBe(true);
      expect(fs.default.existsSync).toHaveBeenCalledWith('/test/path');
    });

    it('should return false when directory does not exist', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);
      const result = await checkDirectoryExists('/test/path');
      expect(result).toBe(false);
    });
  });

  describe('isDirectoryEmpty', () => {
    it('should return true for non-existent directory', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);
      const result = await isDirectoryEmpty('/test/path');
      expect(result).toBe(true);
    });

    it('should return true for empty directory', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readdirSync as jest.MockedFunction<typeof fs.readdirSync>
      ).mockReturnValue([] as unknown);
      const result = await isDirectoryEmpty('/test/path');
      expect(result).toBe(true);
    });

    it('should return false for non-empty directory', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readdirSync as jest.MockedFunction<typeof fs.readdirSync>
      ).mockReturnValue(['file.txt'] as unknown);
      const result = await isDirectoryEmpty('/test/path');
      expect(result).toBe(false);
    });
  });

  describe('emptyDirectory', () => {
    it('should empty a directory', async () => {
      await emptyDirectory('/test/path');
      expect(fs.default.emptyDir).toHaveBeenCalledWith('/test/path');
    });
  });

  describe('ensureDirectory', () => {
    it('should ensure a directory exists', async () => {
      await ensureDirectory('/test/path');
      expect(fs.default.ensureDir).toHaveBeenCalledWith('/test/path');
    });
  });

  describe('copyDirectory', () => {
    it('should copy directory successfully', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);

      await copyDirectory('/source', '/target');

      expect(fs.default.copy).toHaveBeenCalledWith('/source', '/target');
    });

    it('should throw error when source does not exist', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await expect(
        copyDirectory('/source/invalid', '/target')
      ).rejects.toThrow();
    });

    it('should not call copy when source does not exist', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      try {
        await copyDirectory('/source/invalid', '/target');
      } catch {
        // Expected to throw
      }

      expect(fs.default.copy).not.toHaveBeenCalled();
    });
  });

  describe('updatePackageJson', () => {
    it('should update package.json with project name', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({ name: 'old-name', version: '1.0.0' });

      await updatePackageJson('/target', 'new-project');

      expect(fs.default.readJson).toHaveBeenCalledWith('/target/package.json');
      expect(fs.default.writeJson).toHaveBeenCalledWith(
        '/target/package.json',
        { name: 'new-project', version: '1.0.0' },
        { spaces: 2 }
      );
    });

    it('should do nothing when package.json does not exist', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      await updatePackageJson('/target', 'new-project');

      expect(fs.default.readJson).not.toHaveBeenCalled();
      expect(fs.default.writeJson).not.toHaveBeenCalled();
    });

    it('should preserve other package.json properties', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({
        name: 'old-name',
        version: '1.0.0',
        description: 'test app',
        author: 'test',
      });

      await updatePackageJson('/target', 'new-project');

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        '/target/package.json',
        {
          name: 'new-project',
          version: '1.0.0',
          description: 'test app',
          author: 'test',
        },
        { spaces: 2 }
      );
    });
  });

  describe('isDirectoryEmpty', () => {
    it('should return true for non-existent directory', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(false);

      const result = await isDirectoryEmpty('/path/to/dir');
      expect(result).toBe(true);
    });

    it('should return true for empty directory', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readdirSync as jest.MockedFunction<typeof fs.readdirSync>
      ).mockReturnValue([] as unknown);

      const result = await isDirectoryEmpty('/path/to/dir');
      expect(result).toBe(true);
    });

    it('should return false for directory with files', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readdirSync as jest.MockedFunction<typeof fs.readdirSync>
      ).mockReturnValue(['file.txt'] as unknown);

      const result = await isDirectoryEmpty('/path/to/dir');
      expect(result).toBe(false);
    });

    it('should return false for directory with hidden files only', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readdirSync as jest.MockedFunction<typeof fs.readdirSync>
      ).mockReturnValue(['.gitignore', '.DS_Store'] as unknown);

      const result = await isDirectoryEmpty('/path/to/dir');
      expect(result).toBe(false);
    });
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file', async () => {
      const mockData = { name: 'test', version: '1.0.0' };
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue(mockData);

      const result = await readJsonFile('/path/to/file.json');
      expect(result).toEqual(mockData);
      expect(fs.default.readJson).toHaveBeenCalledWith('/path/to/file.json');
    });

    it('should throw error for invalid JSON file', async () => {
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockRejectedValue(new Error('Invalid JSON'));

      await expect(readJsonFile('/path/to/invalid.json')).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should throw error for non-existent file', async () => {
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockRejectedValue(new Error('ENOENT'));

      await expect(readJsonFile('/path/to/missing.json')).rejects.toThrow(
        'ENOENT'
      );
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON data to file', async () => {
      const mockData = { name: 'test', version: '1.0.0' };

      await writeJsonFile('/path/to/file.json', mockData);

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        '/path/to/file.json',
        mockData,
        { spaces: 2 }
      );
    });

    it('should write JSON with custom spacing', async () => {
      const mockData = { name: 'test' };

      await writeJsonFile('/path/to/file.json', mockData, 4);

      expect(fs.default.writeJson).toHaveBeenCalledWith(
        '/path/to/file.json',
        mockData,
        { spaces: 4 }
      );
    });

    it('should throw error for write failure', async () => {
      (
        fs.default.writeJson as jest.MockedFunction<typeof fs.writeJson>
      ).mockRejectedValue(new Error('Permission denied'));

      await expect(
        writeJsonFile('/path/to/protected.json', {})
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('emptyDirectory edge cases', () => {
    it('should handle permission errors', async () => {
      (
        fs.default.emptyDir as jest.MockedFunction<typeof fs.emptyDir>
      ).mockRejectedValue(new Error('Permission denied'));

      await expect(emptyDirectory('/protected/path')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('ensureDirectory edge cases', () => {
    it('should handle permission errors', async () => {
      (
        fs.default.ensureDir as jest.MockedFunction<typeof fs.ensureDir>
      ).mockRejectedValue(new Error('Permission denied'));

      await expect(ensureDirectory('/protected/path')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('updatePackageJson edge cases', () => {
    it('should handle readJson errors gracefully', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockRejectedValue(new Error('Corrupted JSON'));

      await expect(updatePackageJson('/target', 'new-project')).rejects.toThrow(
        'Corrupted JSON'
      );
    });

    it('should handle writeJson errors', async () => {
      (
        fs.default.existsSync as jest.MockedFunction<typeof fs.existsSync>
      ).mockReturnValue(true);
      (
        fs.default.readJson as jest.MockedFunction<typeof fs.readJson>
      ).mockResolvedValue({ name: 'old-name' });
      (
        fs.default.writeJson as jest.MockedFunction<typeof fs.writeJson>
      ).mockRejectedValue(new Error('Write failed'));

      await expect(updatePackageJson('/target', 'new-project')).rejects.toThrow(
        'Write failed'
      );
    });
  });
});
