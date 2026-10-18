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

/**
 * What stands in the way of creating targetPath as a directory: the nearest
 * of it and its parents that exists, when that is not a directory. That is a
 * file at the target itself, or a file where a parent folder should be, as in
 * `notes.txt/login` (#1154). null when the nearest existing entry is a
 * directory. listDirectoryEntries cannot read a file, so callers check first.
 *
 * It never throws. throwIfNoEntry covers a missing entry, and a path under a
 * file fails with ENOTDIR on some Node versions, so any failed stat moves on
 * to the parent, where the file that caused it is found.
 */
export async function findNonDirectoryInPath(
  targetPath: string
): Promise<string | null> {
  let current = path.resolve(targetPath);
  for (;;) {
    let stat: ReturnType<typeof fs.statSync>;
    try {
      stat = fs.statSync(current, { throwIfNoEntry: false });
    } catch {
      stat = undefined;
    }
    if (stat) {
      return stat.isDirectory() ? null : current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

/**
 * targetPath with its symbolic links resolved, so two spellings of one
 * directory compare equal (macOS's /tmp is /private/tmp). Returned resolved
 * but otherwise as given when that fails, as it does for a missing path.
 */
export async function realPath(targetPath: string): Promise<string> {
  try {
    return fs.realpathSync(targetPath);
  } catch {
    return path.resolve(targetPath);
  }
}

/** A directory's top-level entries, sorted; none when it does not exist. */
export async function listDirectoryEntries(
  targetPath: string
): Promise<string[]> {
  if (!fs.existsSync(targetPath)) {
    return [];
  }
  return fs.readdirSync(targetPath).sort();
}

export async function emptyDirectory(targetPath: string): Promise<void> {
  await fs.emptyDir(targetPath);
}

export async function ensureDirectory(targetPath: string): Promise<void> {
  await fs.ensureDir(targetPath);
}

export async function copyDirectory(
  source: string,
  destination: string,
  renames?: Record<string, string>
): Promise<void> {
  if (!(await checkDirectoryExists(source))) {
    throw new Error(MESSAGES.TEMPLATE_NOT_FOUND(source));
  }
  await fs.copy(source, destination);
  if (renames) {
    for (const [from, to] of Object.entries(renames)) {
      const copiedPath = path.join(destination, from);
      if (fs.existsSync(copiedPath)) {
        await fs.move(copiedPath, path.join(destination, to), {
          overwrite: true,
        });
      }
    }
  }
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
