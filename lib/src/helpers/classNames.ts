/**
 * Returns a space-separated string of class names based on input arguments.
 *
 * Accepts any mix of strings, numbers, arrays, or objects. Falsy values are ignored.
 * Array and object values are recursively flattened, and object keys are included
 * if their value is truthy. Duplicate class names are removed.
 *
 * @param {...(string | number | undefined | null | false | Record<string, unknown> | unknown[])} args - Class values to join.
 * @returns {string} A space-separated string of unique class names.
 *
 * @example
 * classNames('foo', ['bar', { baz: true }], { qux: false, quux: true });
 * // => 'foo bar baz quux'
 */
export function classNames(
  ...args: (
    | string
    | number
    | undefined
    | null
    | false
    | Record<string, unknown>
    | unknown[]
  )[]
): string {
  const classSet = new Set<string>();

  function process(
    item:
      | string
      | number
      | undefined
      | null
      | false
      | Record<string, unknown>
      | unknown[]
  ) {
    if (item === undefined || item === null || item === false || item === '') {
      return;
    }
    if (typeof item === 'string' || typeof item === 'number') {
      for (const cls of String(item).split(/\s+/)) {
        if (cls) classSet.add(cls);
      }
    } else if (Array.isArray(item)) {
      for (const sub of item as (
        | string
        | number
        | undefined
        | null
        | false
        | Record<string, unknown>
        | unknown[]
      )[])
        process(sub);
    } else if (typeof item === 'object') {
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) && item[key]) {
          for (const cls of key.split(/\s+/)) {
            if (cls) classSet.add(cls);
          }
        }
      }
    }
  }

  for (const arg of args) {
    process(arg);
  }
  return Array.from(classSet).join(' ');
}

export default classNames;
