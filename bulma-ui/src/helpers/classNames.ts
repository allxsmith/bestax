import { useConfig } from './Config';

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

/**
 * Creates a prefixed version of classNames that automatically applies a prefix to all class names.
 *
 * @param {string} classPrefix - The prefix to apply to all class names.
 * @returns {Function} A classNames function that applies the prefix.
 *
 * @example
 * const prefixedClassNames = createPrefixedClassNames('bulma-');
 * prefixedClassNames('button', { 'is-primary': true });
 * // => 'bulma-button bulma-is-primary'
 */
export function createPrefixedClassNames(classPrefix: string) {
  return function prefixedClassNames(
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
      if (
        item === undefined ||
        item === null ||
        item === false ||
        item === ''
      ) {
        return;
      }
      if (typeof item === 'string' || typeof item === 'number') {
        for (const cls of String(item).split(/\s+/)) {
          if (cls) {
            classSet.add(`${classPrefix}${cls}`);
          }
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
              if (cls) {
                classSet.add(`${classPrefix}${cls}`);
              }
            }
          }
        }
      }
    }

    for (const arg of args) {
      process(arg);
    }
    return Array.from(classSet).join(' ');
  };
}

export default classNames;

/**
 * A simple wrapper around classNames that applies an optional prefix to all class names.
 *
 * @param {string | undefined} prefix - The prefix to apply to all class names. If undefined, no prefix is applied.
 * @param {...(string | number | undefined | null | false | Record<string, unknown> | unknown[])} args - Class values to join.
 * @returns {string} A space-separated string of unique class names, with prefix applied if provided.
 *
 * @example
 * prefixedClassNames('bulma-', 'button', { 'is-primary': true });
 * // => 'bulma-button bulma-is-primary'
 *
 * prefixedClassNames(undefined, 'button', { 'is-primary': true });
 * // => 'button is-primary'
 */
export function prefixedClassNames(
  prefix: string | undefined,
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
  if (!prefix) {
    return classNames(...args);
  }

  return createPrefixedClassNames(prefix)(...args);
}

/**
 * Hook that automatically applies the classPrefix from Config context to class names.
 *
 * @param {...(string | number | undefined | null | false | Record<string, unknown> | unknown[])} args - Class values to join.
 * @returns {string} A space-separated string of unique class names with prefix applied from context.
 *
 * @example
 * // With ConfigProvider providing classPrefix="bulma-"
 * const classes = usePrefixedClassNames('button', { 'is-primary': true });
 * // => 'bulma-button bulma-is-primary'
 */
export function usePrefixedClassNames(
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
  const { classPrefix } = useConfig();

  return prefixedClassNames(classPrefix, ...args);
}
