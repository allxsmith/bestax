import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

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

const chalk = (await import('chalk')).default;
const {
  displayHeader,
  displaySuccess,
  displayError,
  displayInfo,
  displayCancelled,
} = await import('../display.js');

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

describe('display', () => {
  describe('displayHeader', () => {
    it('should display header with correct formatting', () => {
      displayHeader();
      expect(console.log).toHaveBeenCalled();

      // Check that some text was logged
      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should use chalk for coloring', () => {
      displayHeader();

      // Check that chalk methods were used
      expect(chalk.cyan).toHaveBeenCalled();
      expect(chalk.bold).toHaveBeenCalled();
    });

    it('should display the Create Bestax title', () => {
      displayHeader();

      // Check for the title in the output
      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      const output = calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Create Bestax');
    });
  });

  describe('displaySuccess', () => {
    it('should display success message with next steps', () => {
      displaySuccess('my-app');
      expect(console.log).toHaveBeenCalled();

      // Check that multiple lines were logged
      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      expect(calls.length).toBeGreaterThan(3);
    });

    it('should include the project name in the output', () => {
      const projectName = 'test-project';
      displaySuccess(projectName);

      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      const output = calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain(projectName);
    });

    it('should include npm commands', () => {
      displaySuccess('my-app');

      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      const output = calls.map(call => call.join(' ')).join('\n');

      // Check for npm commands
      expect(output).toContain('cd my-app');
      expect(output).toContain('npm install');
      expect(output).toContain('npm run dev');
    });

    it('should use chalk for formatting', () => {
      displaySuccess('my-app');

      // Check that various chalk methods were used
      expect(chalk.green).toHaveBeenCalled();
      expect(chalk.cyan).toHaveBeenCalled();
      expect(chalk.yellow).toHaveBeenCalled();
    });

    it('should display success message', () => {
      displaySuccess('my-app');

      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      const output = calls.map(call => call.join(' ')).join('\n');

      // Check for success-related content
      expect(output.toLowerCase()).toMatch(/success|ready|created/);
    });

    it('should handle different project names', () => {
      const projectNames = ['app1', 'my-special-project', 'test_app'];

      projectNames.forEach(name => {
        jest.clearAllMocks();
        displaySuccess(name);

        const calls = (console.log as jest.MockedFunction<typeof console.log>)
          .mock.calls;
        const output = calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain(name);
        expect(output).toContain(`cd ${name}`);
      });
    });

    it('should provide clear next steps', () => {
      displaySuccess('my-app');

      const calls = (console.log as jest.MockedFunction<typeof console.log>)
        .mock.calls;
      const output = calls.map(call => call.join(' ')).join('\n');

      // Check for step indicators or numbered instructions
      expect(output).toMatch(/1\.|step|next|follow/i);
    });
  });

  describe('displayError', () => {
    it('should display error message with red X', () => {
      displayError('Something went wrong');

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('✖'));
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong')
      );
      expect(chalk.red).toHaveBeenCalled();
    });
  });

  describe('displayInfo', () => {
    it('should display info message in yellow', () => {
      displayInfo('This is an info message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('This is an info message')
      );
      expect(chalk.yellow).toHaveBeenCalled();
    });
  });

  describe('displayCancelled', () => {
    it('should display cancellation message in red', () => {
      displayCancelled();

      expect(console.log).toHaveBeenCalled();
      expect(chalk.red).toHaveBeenCalled();
    });
  });
});
