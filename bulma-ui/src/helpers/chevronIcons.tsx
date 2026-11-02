// INTERNAL: deliberately not exported from src/index.ts. The chevrons the
// Carousel's and the Lightbox's previous and next buttons draw, in one place
// so the two look the same.

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
