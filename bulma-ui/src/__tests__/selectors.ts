// Selector text helpers the styles suites share.

/** `selector` without its `:where()` groups, which add no specificity. */
export function withoutWhere(selector: string): string {
  let out = '';
  for (let i = 0; i < selector.length;) {
    if (!selector.startsWith(':where(', i)) {
      out += selector[i++];
      continue;
    }
    let depth = 0;
    let j = i + ':where'.length;
    for (; j < selector.length; j++) {
      if (selector[j] === '(') depth++;
      else if (selector[j] === ')' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

/** A selector list's selectors, split at the commas outside any parentheses. */
export function selectorsIn(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
}
