// INTERNAL: deliberately not exported from src/index.ts. The icons the
// Carousel's rotation button draws, beside the arrows' chevrons in
// chevronIcons.tsx and drawn the same way.

/**
 * Two bars, for the button that stops autoplay while it turns.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG pause icon.
 */
export const PauseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="9" y1="6" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="18" />
  </svg>
);

/**
 * A triangle, for the button that starts autoplay again once it's stopped.
 *
 * @function
 * @returns {JSX.Element} The rendered SVG play icon.
 */
export const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
  >
    <polygon points="8 6 18 12 8 18" />
  </svg>
);
