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

  if (!PROJECT_NAME_REGEX.test(value)) {
    return MESSAGES.PROJECT_NAME_INVALID_CHARS;
  }

  return true;
}

export function isValidProjectName(name: string): boolean {
  return validateProjectName(name) === true;
}
