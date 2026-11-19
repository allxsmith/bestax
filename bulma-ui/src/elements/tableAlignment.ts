/**
 * The `isAligned` values `Th` and `Td` accept. Each one writes
 * `has-text-<value>` on the cell, and a value outside the tuple adds no class.
 *
 * One copy, imported by both cells, so a header and its body cells always
 * take the same values.
 *
 * Its own module rather than `Th.tsx` or `Td.tsx` because `src/index.ts`
 * wildcard-exports those files, and everything published there is public
 * forever. `iconProps.ts` makes the same call.
 */
export const validTableAlignments = ['left', 'right', 'centered'] as const;

/**
 * Valid alignment values for the Th and Td components.
 */
export type TableAlignment = (typeof validTableAlignments)[number];
