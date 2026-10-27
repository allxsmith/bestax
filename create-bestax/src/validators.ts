import path from 'path';
import {
  PROJECT_NAME_REGEX,
  MAX_PROJECT_NAME_LENGTH,
  MESSAGES,
} from './constants.js';

export function validateProjectName(value: string): boolean | string {
  if (!value) {
    return MESSAGES.PROJECT_NAME_REQUIRED;
  }

  if (value.length > MAX_PROJECT_NAME_LENGTH) {
    return MESSAGES.PROJECT_NAME_TOO_LONG;
  }

  // The regex below allows dots, so "." and ".." would pass and resolve to
  // the current/parent directory — which --overwrite would then empty. Rejecting
  // every leading-dot name closes that hole for these spellings ("/" and "\" are
  // already blocked). A path reaching the same directory another way, such as
  // "../<its name>", is refused where it resolves, in checkExistingDirectory.
  // "." alone is let through before this, by validateProjectDirectory, to
  // scaffold into an empty working directory.
  if (value.startsWith('.')) {
    return MESSAGES.PROJECT_NAME_DOT;
  }

  if (!PROJECT_NAME_REGEX.test(value)) {
    return MESSAGES.PROJECT_NAME_INVALID_CHARS;
  }

  if (toValidPackageName(value) === '') {
    return MESSAGES.PROJECT_NAME_NO_PACKAGE_NAME;
  }

  return true;
}

export function isValidProjectName(name: string): boolean {
  return validateProjectName(name) === true;
}

/**
 * Whether targetDir is "." alone, which scaffolds into the working directory
 * as create-vite takes it. The project is named after that directory, and
 * checkExistingDirectory lets it through only while it is empty, since the
 * working directory is never emptied (#310). A longer path ending in "." still
 * fails the leading-dot rule above.
 */
export function isCurrentDirectory(targetDir: string): boolean {
  return /^\.[\\/]?$/.test(targetDir);
}

/**
 * The project directory may be a name or a path, absolute or relative, as
 * create-vite takes it (#1154). Its last segment is the project name, the one
 * that names the package and the page title, so that is what is validated, by
 * the same rules as a bare name: a path ending in "." or ".." still fails the
 * leading-dot rule above. A rejected path names the segment it was judged by.
 */
export function validateProjectDirectory(
  targetDir: string,
  cwd: string = process.cwd()
): boolean | string {
  if (isCurrentDirectory(targetDir)) {
    const name = path.basename(cwd);
    const validation = validateProjectName(name);
    return typeof validation === 'string'
      ? MESSAGES.PROJECT_NAME_FROM_CWD(validation, name)
      : validation;
  }
  const projectName = path.basename(targetDir);
  const validation = validateProjectName(projectName);
  return typeof validation === 'string' && projectName !== targetDir
    ? MESSAGES.PROJECT_NAME_FROM_PATH(validation, projectName)
    : validation;
}

/**
 * The package.json name for a project directory. npm rejects capitals and a
 * leading "_" or ".", so the name is lower-cased the way `npm init` does and
 * those leading characters are dropped, as create-vite does (#950). The
 * directory itself keeps the name as typed.
 */
export function toValidPackageName(projectName: string): string {
  return projectName.toLowerCase().replace(/^[._]+/, '');
}
