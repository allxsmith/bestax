/**
 * `FIELD_SCOPED` names the bestax components that render one way inside a
 * `Field` and another outside one, which the rbx codemod flags where one sits
 * straight in a `Fieldset`. Each of them reads `useInsideField`, so this
 * holds the list to the form components that do: one that starts or stops
 * reading it fails here until the list follows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_SCOPED } from '../specials-utils.js';

const FORM = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../bulma-ui/src/form'
);

it('names every form component that reads useInsideField, and only those', () => {
  const readers = fs
    .readdirSync(FORM)
    .filter(file => file.endsWith('.tsx') && !file.endsWith('.stories.tsx'))
    .filter(file => file !== 'FormContext.tsx')
    .filter(file =>
      fs.readFileSync(path.join(FORM, file), 'utf8').includes('useInsideField(')
    )
    .map(file => file.replace(/\.tsx$/, ''))
    .sort();
  expect(readers.length).toBeGreaterThan(0);
  expect([...FIELD_SCOPED].sort()).toEqual(readers);
});
