import fs from 'fs-extra';
import path from 'path';
import { MESSAGES } from './constants.js';

export async function checkDirectoryExists(
  targetPath: string
): Promise<boolean> {
  return fs.existsSync(targetPath);
}

export async function isDirectoryEmpty(targetPath: string): Promise<boolean> {
  if (!fs.existsSync(targetPath)) {
    return true;
  }
  const files = fs.readdirSync(targetPath);
  return files.length === 0;
}

export async function emptyDirectory(targetPath: string): Promise<void> {
  await fs.emptyDir(targetPath);
}

export async function ensureDirectory(targetPath: string): Promise<void> {
  await fs.ensureDir(targetPath);
}

export async function copyDirectory(
  source: string,
  destination: string
): Promise<void> {
  if (!(await checkDirectoryExists(source))) {
    throw new Error(MESSAGES.TEMPLATE_NOT_FOUND(source));
  }
  await fs.copy(source, destination);
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  return fs.readJson(filePath);
}

export async function writeJsonFile(
  filePath: string,
  data: unknown,
  spaces = 2
): Promise<void> {
  await fs.writeJson(filePath, data, { spaces });
}

export async function updatePackageJson(
  targetPath: string,
  projectName: string
): Promise<void> {
  const packageJsonPath = path.join(targetPath, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
}
