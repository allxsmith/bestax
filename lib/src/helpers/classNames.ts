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
