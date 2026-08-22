/**
 * Node ESM resolver hook: when a .ts parent imports `./foo.js` and `foo.ts`
 * exists, load the TypeScript. Lets root `node --test` import the CLIs' source
 * (TypeScript ESM `.js` specifiers) without a build step.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (
    context.parentURL &&
    specifier.startsWith('.') &&
    specifier.endsWith('.js')
  ) {
    const asTs = join(
      dirname(fileURLToPath(context.parentURL)),
      specifier.replace(/\.js$/, '.ts')
    );
    if (existsSync(asTs)) {
      return nextResolve(specifier.replace(/\.js$/, '.ts'), context);
    }
  }
  return nextResolve(specifier, context);
}
