import type { MigrationSource } from '../../types.js';
import { flaggableRoot } from './class-map.js';
import { analyzeProject } from './project.js';
import transform from './transform.js';
import { transformStyles } from './styles.js';
import { updateDependencies } from './deps.js';

/**
 * The first line of an unparseable file whose markup carries a class this
 * source converts or flags: in a `class` or `className` attribute (not
 * `data-class`), including the strings inside a computed one
 * (`className={cn("button", x)}`).
 */
function findUnsupportedReference(text: string): number | null {
  const lines = text.split('\n');
  const index = lines.findIndex(line =>
    [
      ...line.matchAll(
        /(?<![\w-])class(?:Name)?=(\{.*|"[^"]*"|'[^']*'|`[^`]*`)/g
      ),
    ].some(match =>
      [...match[1].matchAll(/["'`]([^"'`]*)["'`]/g)].some(literal =>
        literal[1].split(/\s+/).some(token => flaggableRoot(token))
      )
    )
  );
  return index === -1 ? null : index + 1;
}

export const bulmaClasses: MigrationSource = {
  name: 'bulma-classes',
  label: 'Bulma classes → @allxsmith/bestax-bulma',
  packageName: null,
  // The app's own Bulma stylesheet already styles every class a converted
  // element renders; swapping it for bestax.css would restyle the app's own
  // markup too (bestax's extras use generic names, and its primary differs).
  defaultCssMode: 'keep',
  analyzeProject,
  findUnsupportedReference,
  // Formats that can render React components; a .vue or .svelte file cannot
  // use bestax whatever classes it carries.
  unsupportedExtensions: ['mdx', 'astro'],
  transform,
  transformStyles,
  updateDependencies,
};
