// INTERNAL: deliberately not exported from src/index.ts. The chevrons the
// Carousel's and the Lightbox's previous and next buttons draw, and a resize
// handle's step buttons, in one place so they look the same.

/**
 * Chevron pointing left, for a previous button.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG chevron-left icon.
 */
export const ChevronPrevIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/**
 * Chevron pointing right, for a next button.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG chevron-right icon.
 */
export const ChevronNextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Two chevrons pointing left, for a button that shuts a part that way.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG double chevron-left icon.
 */
export const ChevronsPrevIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

/**
 * Two chevrons pointing right.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG double chevron-right icon.
 */
export const ChevronsNextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);
