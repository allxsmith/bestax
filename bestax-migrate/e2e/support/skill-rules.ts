/**
 * Whether the bestax-migrate skill documents a bulma-classes rule, for the
 * suites that check every rule a run emits has a recipe an agent can find.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'skills',
  'bestax-migrate'
);

/** Everything the skill's bulma-classes references and SKILL.md backtick. */
function backticked(): Set<string> {
  const refsDir = path.join(skillDir, 'references', 'bulma-classes');
  const text = [
    ...fs
      .readdirSync(refsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(refsDir, file)),
    path.join(skillDir, 'SKILL.md'),
  ]
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n');
  return new Set([...text.matchAll(/`([^`\n]+)`/g)].map(match => match[1]));
}

/**
 * The rules the skill doesn't name. A rule is documented when the reference
 * names it, or names its kind with a placeholder (`spread:<Target>`): the
 * kinds are what a reader looks up, and the suffix is always a fixed name.
 */
export function undocumentedRules(rules: Iterable<string>): string[] {
  const names = backticked();
  const documented = (rule: string): boolean => {
    const kind = rule.split(':')[0];
    return (
      names.has(rule) || [...names].some(text => text.startsWith(`${kind}:<`))
    );
  };
  return [...new Set(rules)].sort().filter(rule => !documented(rule));
}
