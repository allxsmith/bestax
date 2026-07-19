/**
 * Attaches compound sub-components as statics on a base component and
 * optionally sets the parent's displayName.
 *
 * Internal helper — it MUST mutate and return the same function object
 * (`Object.assign`), never wrap the base in a new function: identity checks
 * like `child.type === ModalCard` (Modal) and Field's displayName-based
 * child detection rely on the attached component being the same object as
 * the separately exported one.
 *
 * displayName is only ever set on the parent (and only when provided) —
 * sub-components keep whatever displayName they declare themselves.
 */
export function withSubComponents<
  Base extends { displayName?: string },
  Subs extends Record<string, unknown>,
>(base: Base, subs: Subs, displayName?: string): Base & Subs {
  const compound = Object.assign(base, subs) as Base & Subs;
  if (displayName !== undefined) {
    compound.displayName = displayName;
  }
  return compound;
}
