/**
 * The Templates page's filter state, which lives in the URL query so a
 * filtered view is a link that can be shared: `tags` (repeated), `operator`
 * (`AND`, or absent for OR) and `name` (the search). The hooks are the ones
 * the Docusaurus showcase uses, and like it the page renders unfiltered on
 * the server and applies the query once it hydrates.
 */
import { useCallback, useMemo } from 'react';
import { useQueryString, useQueryStringList } from '@docusaurus/theme-common';
import { TagList, sortedTemplates } from '@site/src/data/templates';

export function useSearchName() {
  return useQueryString('name');
}

/** The tags in the query, keeping only known ones, in the page's order. */
export function useTags() {
  const [tags, setTags] = useQueryStringList('tags');
  const known = useMemo(
    () => TagList.filter(tag => tags.includes(tag)),
    [tags]
  );
  return [known, setTags];
}

export function useOperator() {
  const [value, setValue] = useQueryString('operator');
  const operator = value === 'AND' ? 'AND' : 'OR';
  const toggle = useCallback(
    () => setValue(operator === 'OR' ? 'AND' : null),
    [operator, setValue]
  );
  return [operator, toggle];
}

/**
 * The templates matching a search over title, description and author, and
 * the picked tags: any of them (OR) or all of them (AND).
 */
export function filterTemplates(templates, { tags, operator, name }) {
  const query = name.trim().toLowerCase();
  return templates.filter(template => {
    if (
      query &&
      ![template.title, template.description, template.author.name].some(text =>
        text.toLowerCase().includes(query)
      )
    ) {
      return false;
    }
    if (tags.length === 0) return true;
    return operator === 'AND'
      ? tags.every(tag => template.tags.includes(tag))
      : tags.some(tag => template.tags.includes(tag));
  });
}

export function useFilteredTemplates() {
  const [tags] = useTags();
  const [operator] = useOperator();
  const [name] = useSearchName();
  return useMemo(
    () => filterTemplates(sortedTemplates, { tags, operator, name }),
    [tags, operator, name]
  );
}

/** Whether any filter is set, which decides between sections and one list. */
export function useIsFiltered() {
  const [tags] = useTags();
  const [name] = useSearchName();
  return tags.length > 0 || name.trim() !== '';
}

/** Where a card opens: the template's folder in StackBlitz, on App.tsx. */
export const stackblitzUrl = slug =>
  `https://stackblitz.com/github/allxsmith/bestax/tree/main/templates/${slug}?file=src/App.tsx`;

/** The template's folder in the repository. */
export const codeUrl = slug =>
  `https://github.com/allxsmith/bestax/tree/main/templates/${slug}`;
