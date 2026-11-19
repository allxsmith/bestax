// INTERNAL: deliberately not exported from src/index.ts.

/**
 * A check mark, 1em square and drawn in `currentColor`, so it takes the text
 * color around it, the system's in forced colors included. Combobox draws it
 * beside a chosen item, and CopyButton after a copy. It's decorative: put it
 * inside something `aria-hidden`.
 *
 * @function CheckIcon
 * @returns The check mark's `<svg>`.
 */
export function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      focusable="false"
    >
      <polyline points="3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}
