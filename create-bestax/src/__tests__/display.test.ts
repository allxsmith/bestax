import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { execFileSync } from 'node:child_process';

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

// Mock figures
jest.unstable_mockModule('figures', () => ({
  default: {
    star: '⭐',
    cross: '✖',
    tick: '✔',
    bullet: '●',
    pointer: '❯',
  },
}));

const chalk = (await import('chalk')).default;
const {
  displayHeader,
  displaySuccess,
  displayError,
  displayInfo,
  displayCancelled,
  quoteShellArgument,
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

  describe('quoteShellArgument (#1154)', () => {
    const unsafe: Array<[string, string, string]> = [
      ['a space', '/tmp/My Projects/login', `'/tmp/My Projects/login'`],
      ['an apostrophe', "/tmp/Alex's/login", `'/tmp/Alex'\\''s/login'`],
      ['a $', '/tmp/$HOME/login', `'/tmp/$HOME/login'`],
      ['backticks', '/tmp/a`b`/login', "'/tmp/a`b`/login'"],
      ['a leading ~', '~/login', `'~/login'`],
    ];

    it('leaves a path of plain characters bare', () => {
      for (const dir of ['login', '../apps/my-app', '/tmp/a_b/v1.0/login']) {
        expect(quoteShellArgument(dir, 'linux')).toBe(dir);
      }
    });

    it.each(unsafe)(
      'single-quotes a path holding %s for POSIX shells',
      (_label, dir, quoted) => {
        expect(quoteShellArgument(dir, 'darwin')).toBe(quoted);
      }
    );

    // The proof that matters: a POSIX shell reads each one back unchanged.
    (process.platform === 'win32' ? it.skip : it).each(unsafe)(
      'gives back a path holding %s when sh reads it',
      (_label, dir) => {
        const echoed = execFileSync('/bin/sh', [
          '-c',
          `printf '%s' ${quoteShellArgument(dir, 'linux')}`,
        ]).toString();
        expect(echoed).toBe(dir);
      }
    );

    it('double-quotes for Windows, where backslashes need no quoting', () => {
      expect(quoteShellArgument('apps\\login', 'win32')).toBe('apps\\login');
      expect(quoteShellArgument('C:\\My Projects\\login', 'win32')).toBe(
        '"C:\\My Projects\\login"'
      );
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

    it('leaves out the cd for a scaffold into the current directory', () => {
      displaySuccess('.');

      const lines = (
        console.log as jest.MockedFunction<typeof console.log>
      ).mock.calls.map(call => call.join(' '));
      expect(lines.some(line => line.trim().startsWith('cd '))).toBe(false);
      expect(lines.some(line => /^\s+\w+ install$/.test(line))).toBe(true);
    });

    it('lists no next steps when --immediate is about to run them', () => {
      displaySuccess('my-app', true);

      const output = (
        console.log as jest.MockedFunction<typeof console.log>
      ).mock.calls
        .map(call => call.join(' '))
        .join('\n');
      expect(output).toContain('Project created successfully');
      expect(output).not.toContain('Next steps');
      expect(output).not.toContain('cd my-app');
    });

    it('quotes a path with a space in its cd line, and leaves others bare (#1154)', () => {
      displaySuccess('/tmp/My Projects/login');
      displaySuccess('/tmp/projects/login');

      const lines = (
        console.log as jest.MockedFunction<typeof console.log>
      ).mock.calls.map(call => call.join(' '));
      expect(lines).toContain(
        `  cd ${quoteShellArgument('/tmp/My Projects/login')}`
      );
      expect(lines).toContain('  cd /tmp/projects/login');
    });

    describe('next-steps package manager', () => {
      const originalUserAgent = process.env.npm_config_user_agent;

      beforeEach(() => {
        delete process.env.npm_config_user_agent;
      });

      afterEach(() => {
        if (originalUserAgent === undefined) {
          delete process.env.npm_config_user_agent;
        } else {
          process.env.npm_config_user_agent = originalUserAgent;
        }
      });

      it('should fall back to npm commands without an invoking package manager', () => {
        displaySuccess('my-app');

        const calls = (console.log as jest.MockedFunction<typeof console.log>)
          .mock.calls;
        const output = calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('cd my-app');
        expect(output).toContain('npm install');
        expect(output).toContain('npm run dev');
      });

      it('should mirror the invoking package manager from npm_config_user_agent', () => {
        process.env.npm_config_user_agent =
          'pnpm/9.12.0 npm/? node/v22.0.0 darwin arm64';
        displaySuccess('my-app');

        const calls = (console.log as jest.MockedFunction<typeof console.log>)
          .mock.calls;
        const output = calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('cd my-app');
        expect(output).toContain('pnpm install');
        expect(output).toContain('pnpm run dev');
      });
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
