#!/usr/bin/env node

import { Command } from 'commander';
import { ProjectCreator, type CLIOptions } from './project-creator.js';
import { copyDirectory } from './file-system.js';

// Re-export for backward compatibility with tests
export { validateProjectName } from './validators.js';
export { TEMPLATES, ICON_LIBRARIES, BULMA_FLAVORS } from './constants.js';
export type { ProjectConfig, CLIOptions } from './project-creator.js';
export type { Template, IconLibrary, BulmaFlavor } from './constants.js';

// Re-export individual functions for testing
export { ProjectCreator };
export { displayHeader, displaySuccess } from './display.js';
export {
  promptProjectName,
  promptOverwriteDirectory,
  promptTemplate as selectTemplate,
  promptIconLibrary as selectIconLibrary,
  promptBulmaFlavor as selectBulmaFlavor,
} from './prompts.js';
export {
  checkDirectoryExists,
  isDirectoryEmpty,
  copyDirectory,
  updatePackageJson,
} from './file-system.js';

// Helper function for tests
export async function getProjectName(
  projectDir?: string
): Promise<string | null> {
  const projectCreator = new ProjectCreator();
  return projectCreator.getProjectName(projectDir);
}

export async function checkExistingDirectory(
  targetPath: string,
  targetDir: string
): Promise<boolean> {
  const projectCreator = new ProjectCreator();
  return projectCreator.checkExistingDirectory(targetPath, targetDir);
}

export function getTemplatePath(template: string): string {
  const projectCreator = new ProjectCreator();
  return projectCreator.getTemplatePath(template);
}

export async function copyTemplate(
  templatePath: string,
  targetPath: string
): Promise<void> {
  // Direct pass-through to copyDirectory
  return copyDirectory(templatePath, targetPath);
}

export async function createProject(
  projectDir?: string,
  options?: CLIOptions
): Promise<void> {
  const projectCreator = new ProjectCreator();
  return projectCreator.create(projectDir, options);
}

export function createCLI(): Command {
  const program = new Command();
  const projectCreator = new ProjectCreator();

  program
    .name('create-bestax')
    .description('Create a new bestax-bulma project')
    .version('0.1.0')
    .argument('[project-directory]', 'project directory to create')
    .option('-t, --template <template>', 'template to use (vite, vite-ts)')
    .option(
      '-b, --bulma <flavor>',
      'Bulma CSS flavor (complete, prefixed, no-helpers, no-helpers-prefixed, no-dark-mode)'
    )
    .option(
      '-i, --icon <library>',
      'icon library (none, fontawesome, mdi, ionicons, material-icons, material-symbols)'
    )
    .option('-y, --yes', 'skip prompts and use defaults or provided options')
    .action((projectDir?: string, options?: unknown) => {
      projectCreator.create(projectDir, options as CLIOptions);
    });

  return program;
}

export function isMainModule(importMetaUrl: string, argv1: string): boolean {
  return importMetaUrl === `file://${argv1}`;
}

export function runCLI(): void {
  const program = createCLI();
  program.parse();
}

// Only run if this is the main module
/* istanbul ignore next */
if (isMainModule(import.meta.url, process.argv[1])) {
  runCLI();
}
