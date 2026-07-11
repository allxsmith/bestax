/**
 * House conformance for Storybook stories: every argType must carry a
 * `description` (it feeds the autodocs prop table). Enforced at runtime by
 * importing each story's meta — argTypes are usually multiline objects, so
 * a regex can't check this reliably.
 *
 * LEGACY_EXEMPT lists story files that predate the rule. Shrink it as they
 * are backfilled; never add a new file to it.
 */
import { readdirSync } from 'fs';
import { join, relative } from 'path';

const SRC = join(__dirname, '..');

const LEGACY_EXEMPT = new Set<string>([
  'components/Breadcrumb.stories.tsx',
  'components/Tabs.stories.tsx',
  'elements/Buttons.stories.tsx',
  'elements/Delete.stories.tsx',
  'elements/Icon.stories.tsx',
  'elements/IconText.stories.tsx',
  'elements/Image.stories.tsx',
  'elements/Notification.stories.tsx',
  'elements/Progress.stories.tsx',
  'elements/SubTitle.stories.tsx',
  'elements/Table.stories.tsx',
  'elements/Tag.stories.tsx',
  'elements/Tags.stories.tsx',
  'elements/Title.stories.tsx',
  'form/DateInput.stories.tsx',
  'form/DateTimeInput.stories.tsx',
  'form/TimeInput.stories.tsx',
  'helpers/useBulmaClasses.stories.tsx',
]);

function storyFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...storyFiles(full));
    else if (entry.name.endsWith('.stories.tsx')) out.push(full);
  }
  return out;
}

describe('story conformance', () => {
  it('every argType has a description (autodocs prop table)', async () => {
    const failures: Record<string, string[]> = {};
    for (const file of storyFiles(SRC)) {
      const rel = relative(SRC, file).split('\\').join('/');
      if (LEGACY_EXEMPT.has(rel)) continue;
      const meta = (await import(file)).default;
      const argTypes: Record<string, { description?: string }> =
        meta?.argTypes ?? {};
      const missing = Object.entries(argTypes)
        .filter(([, v]) => !v?.description)
        .map(([k]) => k);
      if (missing.length) failures[rel] = missing;
    }
    // A failure here means a story's argTypes entries lack `description`
    // strings. Add one sentence per prop (see Reveal.stories.tsx).
    expect(failures).toEqual({});
  });
});
