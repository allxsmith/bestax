/**
 * The `size` values bestax takes on the components a source's group or
 * message `size` carries onto, keyed by the name the mappings use as their
 * `target`. rbx and react-bulma-components both accept any string there, so
 * a mapping passes a size through only when it is in this list
 * (`PropAction.allowed`), and anything else keeps a TODO rather than becoming
 * output that does not compile.
 *
 * bulma-ui keeps these unions in module-local constants, so this is a hand
 * copy. `e2e/size-unions.test.ts` holds each row to the library's own type in
 * both directions, and checks every mapping that names a row uses it.
 */
export const SIZE_UNIONS = {
  Buttons: ['small', 'medium', 'large'],
  Tags: ['medium', 'large'],
  Message: ['small', 'medium', 'large'],
} as const satisfies Record<string, readonly string[]>;
