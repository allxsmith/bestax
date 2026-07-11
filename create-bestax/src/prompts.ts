import prompts from 'prompts';
import {
  TEMPLATES,
  DEFAULT_PROJECT_NAME,
  PROMPTS as PROMPT_MESSAGES,
  MESSAGES,
  ICON_LIBRARIES,
  BULMA_FLAVORS,
} from './constants.js';
import { validateProjectName } from './validators.js';
import { displayError } from './display.js';

/**
 * Guard against hanging forever in non-interactive environments (CI, agents,
 * piped stdin): every interactive question must fail fast with actionable
 * guidance when stdin is not a TTY (#192).
 */
function ensureInteractive(): void {
  if (!process.stdin.isTTY) {
    displayError(MESSAGES.NO_TTY);
    process.exit(1);
  }
}

export async function promptProjectName(): Promise<string | null> {
  ensureInteractive();
  const response = await prompts({
    type: 'text',
    name: 'projectName',
    message: PROMPT_MESSAGES.PROJECT_NAME,
    initial: DEFAULT_PROJECT_NAME,
    validate: validateProjectName,
  });

  return response.projectName || null;
}

export async function promptOverwriteDirectory(
  targetDir: string
): Promise<boolean> {
  ensureInteractive();
  const response = await prompts({
    type: 'confirm',
    name: 'overwrite',
    message: MESSAGES.DIRECTORY_NOT_EMPTY(targetDir),
    initial: false,
  });

  return response.overwrite === true;
}

export async function promptInstallSkills(): Promise<boolean> {
  ensureInteractive();
  const response = await prompts({
    type: 'confirm',
    name: 'skills',
    message: PROMPT_MESSAGES.INSTALL_SKILLS,
    initial: true,
  });

  return response.skills === true;
}

export async function promptTemplate(): Promise<string | null> {
  ensureInteractive();
  const response = await prompts({
    type: 'select',
    name: 'template',
    message: PROMPT_MESSAGES.SELECT_FRAMEWORK,
    choices: TEMPLATES.map(template => ({
      title: template.color(template.display),
      value: template.name,
    })),
  });

  return response.template || null;
}

export async function promptIconLibrary(): Promise<string | null> {
  ensureInteractive();
  const response = await prompts({
    type: 'select',
    name: 'iconLibrary',
    message: PROMPT_MESSAGES.SELECT_ICON_LIBRARY,
    choices: ICON_LIBRARIES.map(lib => ({
      title: lib.color(lib.display),
      value: lib.name,
    })),
    initial: 0, // Default to 'none'
  });

  return response.iconLibrary || null;
}

export async function promptBulmaFlavor(): Promise<string | null> {
  ensureInteractive();
  const response = await prompts({
    type: 'select',
    name: 'bulmaFlavor',
    message: PROMPT_MESSAGES.SELECT_BULMA_FLAVOR,
    choices: BULMA_FLAVORS.map(flavor => ({
      title: flavor.color(
        `${flavor.display}${flavor.description ? ` - ${flavor.description}` : ''}`
      ),
      value: flavor.name,
    })),
    initial: 0, // Default to 'complete' (recommended)
  });

  return response.bulmaFlavor || null;
}
