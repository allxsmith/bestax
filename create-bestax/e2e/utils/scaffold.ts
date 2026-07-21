import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Configuration for scaffolding a test app
 */
export interface ScaffoldConfig {
  template: 'vite' | 'vite-ts';
  bulmaFlavor:
    | 'complete'
    | 'prefixed'
    | 'no-helpers'
    | 'no-helpers-prefixed'
    | 'no-dark-mode';
  iconLibrary:
    | 'none'
    | 'fontawesome'
    | 'mdi'
    | 'ionicons'
    | 'material-icons'
    | 'material-symbols';
  outputDir: string;
}

/**
 * Scaffolds a new bestax app using create-bestax CLI.
 *
 * This function:
 * 1. Removes any existing test app directory
 * 2. Runs create-bestax with specified configuration
 * 3. Installs dependencies with a fresh pnpm resolve
 * 4. Builds the app for production testing
 *
 * @param config - Configuration for the scaffolded app
 * @returns Path to the scaffolded app
 */
export async function scaffoldApp(config: ScaffoldConfig): Promise<string> {
  const { template, bulmaFlavor, iconLibrary, outputDir } = config;

  console.log(`Scaffolding app: ${template}, ${bulmaFlavor}, ${iconLibrary}`);

  // Clean up existing directory
  if (await fs.pathExists(outputDir)) {
    console.log(`Removing existing directory: ${outputDir}`);
    await fs.remove(outputDir);
  }

  // Build create-bestax CLI first (ensure we're using latest code)
  const cliRoot = path.resolve(__dirname, '../..');
  console.log(`Building CLI from: ${cliRoot}`);
  execSync('pnpm run build', {
    cwd: cliRoot,
    stdio: 'inherit',
  });

  // Run create-bestax to scaffold the app
  const createBestaxPath = path.join(cliRoot, 'dist', 'index.js');
  const scaffoldCmd = `node "${createBestaxPath}" "${outputDir}" -t ${template} -b ${bulmaFlavor} -i ${iconLibrary} -y`;

  console.log(`Running: ${scaffoldCmd}`);
  execSync(scaffoldCmd, {
    cwd: path.dirname(outputDir),
    stdio: 'inherit',
  });

  // -y implies the AI-skills opt-in, so every real scaffold must contain the
  // browser-preview manifest (#337) — fail loudly if the write path regresses.
  const launchJsonPath = path.join(outputDir, '.claude', 'launch.json');
  if (!(await fs.pathExists(launchJsonPath))) {
    throw new Error(`Expected scaffold to contain ${launchJsonPath}`);
  }

  // Install dependencies in the scaffolded app with a fresh pnpm resolve.
  // --ignore-workspace: the app may live inside the monorepo tree, so treat it
  // as a standalone project rather than a workspace member.
  console.log(`Installing dependencies in ${outputDir} (pnpm install)...`);
  execSync('pnpm install --ignore-workspace --prefer-offline=false', {
    cwd: outputDir,
    stdio: 'inherit',
  });

  // Build the app
  console.log(`Building app in ${outputDir}...`);
  execSync('pnpm --ignore-workspace run build', {
    cwd: outputDir,
    stdio: 'inherit',
  });

  console.log(`App scaffolded successfully at: ${outputDir}`);
  return outputDir;
}

/**
 * Generate a unique directory name for a test app based on configuration.
 *
 * @param config - Configuration for the scaffolded app
 * @returns Directory name (e.g., "test-app-vite-complete-none")
 */
export function generateAppDirName(
  config: Omit<ScaffoldConfig, 'outputDir'>
): string {
  const { template, bulmaFlavor, iconLibrary } = config;
  return `test-app-${template}-${bulmaFlavor}-${iconLibrary}`;
}

/**
 * Clean up test app directory after tests complete.
 *
 * @param appDir - Path to the app directory to remove
 */
export async function cleanupApp(appDir: string): Promise<void> {
  if (await fs.pathExists(appDir)) {
    console.log(`Cleaning up test app: ${appDir}`);
    await fs.remove(appDir);
  }
}
