import { spawn, ChildProcess } from 'child_process';
import waitOn from 'wait-on';

/**
 * Manages a Vite preview server for testing.
 */
export class ViteServer {
  private process: ChildProcess | null = null;
  private readonly appDir: string;
  private readonly port: number;

  constructor(appDir: string, port: number = 4173) {
    this.appDir = appDir;
    this.port = port;
  }

  /**
   * Start the Vite preview server.
   *
   * @returns Promise that resolves when server is ready
   */
  async start(): Promise<void> {
    console.log(
      `Starting Vite preview server in ${this.appDir} on port ${this.port}...`
    );

    return new Promise((resolve, reject) => {
      this.process = spawn(
        'npm',
        ['run', 'preview', '--', '--port', String(this.port)],
        {
          cwd: this.appDir,
          stdio: 'pipe',
          shell: true,
        }
      );

      if (!this.process.stdout || !this.process.stderr) {
        reject(new Error('Failed to create server process'));
        return;
      }

      // Log server output
      this.process.stdout.on('data', data => {
        console.log(`[Vite] ${data.toString().trim()}`);
      });

      this.process.stderr.on('data', data => {
        console.error(`[Vite Error] ${data.toString().trim()}`);
      });

      this.process.on('error', error => {
        console.error(`Failed to start Vite server:`, error);
        reject(error);
      });

      this.process.on('exit', code => {
        if (code !== 0 && code !== null) {
          console.error(`Vite server exited with code ${code}`);
        }
      });

      // Wait for server to be ready
      waitOn({
        resources: [`http://localhost:${this.port}`],
        timeout: 60000, // 60 seconds
        interval: 1000, // Check every second
      })
        .then(() => {
          console.log(`Vite server is ready at http://localhost:${this.port}`);
          resolve();
        })
        .catch(error => {
          console.error('Server failed to start within timeout:', error);
          this.stop();
          reject(error);
        });
    });
  }

  /**
   * Stop the Vite preview server.
   */
  stop(): void {
    if (this.process) {
      console.log(`Stopping Vite server on port ${this.port}...`);
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Get the server URL.
   */
  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}

/**
 * Utility function to check if a port is available.
 *
 * @param port - Port number to check
 * @returns Promise that resolves to true if port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  try {
    await waitOn({
      resources: [`tcp:localhost:${port}`],
      timeout: 1000,
      reverse: true, // Wait for resource to NOT be available
    });
    return true;
  } catch {
    return false;
  }
}
