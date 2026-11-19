import { useId } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * bestaxbot, drawn as a robot bee: a rounded helmet with a visor for a face,
 * bee antennae with honey-lit tips, a honey-striped chassis and buzzing wings.
 *
 * Decorative, so it stays out of the accessibility tree. `waveKey` replays the
 * wave: each new value swings the raised arm again, and 0 leaves it resting.
 */
export default function BestaxBot({ className, waveKey = 0 }) {
  // The body clip needs an id unique to this drawing, and useId's output can
  // carry characters a url(#…) reference does not accept.
  const bodyClip = `bestaxbot-body-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const wave = waveKey === 0 ? null : waveKey % 2 ? styles.waveA : styles.waveB;

  return (
    <svg
      className={clsx(styles.bot, wave, className)}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(-28 16 62)">
        <ellipse className={styles.wing} cx="16" cy="62" rx="15" ry="8.5" />
      </g>
      <g transform="rotate(28 84 62)">
        <ellipse
          className={clsx(styles.wing, styles.wingLate)}
          cx="84"
          cy="62"
          rx="15"
          ry="8.5"
        />
      </g>
      <clipPath id={bodyClip}>
        <rect x="23" y="64" width="54" height="46" rx="16" />
      </clipPath>
      <g clipPath={`url(#${bodyClip})`}>
        <rect x="23" y="64" width="54" height="46" rx="16" fill="#f4bf4f" />
        <rect x="23" y="70" width="54" height="7" fill="#1c1408" />
        <rect x="23" y="95" width="54" height="7" fill="#1c1408" />
      </g>
      <polygon
        points="50,80.5 55,83.5 55,89.5 50,92.5 45,89.5 45,83.5"
        fill="none"
        stroke="#1c1408"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="42" y="57" width="16" height="9" rx="3" fill="#9fb3c8" />
      <path
        d="M40 21Q35 12 29 8M60 21Q65 12 71 8"
        fill="none"
        stroke="#9fb3c8"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle className={styles.tip} cx="29" cy="7.5" r="4.4" />
      <circle className={styles.tip} cx="71" cy="7.5" r="4.4" />
      <rect
        x="21"
        y="17"
        width="58"
        height="44"
        rx="17"
        fill="#e8eef5"
        stroke="#b6c6d6"
        strokeWidth="2"
      />
      <circle cx="21" cy="39" r="4.2" fill="#9fb3c8" />
      <circle cx="79" cy="39" r="4.2" fill="#9fb3c8" />
      <rect x="28.5" y="25" width="43" height="28" rx="11" fill="#0b1d38" />
      <g className={styles.eyes}>
        <rect x="37" y="32.5" width="7" height="9.5" rx="3.5" />
        <rect x="56" y="32.5" width="7" height="9.5" rx="3.5" />
      </g>
      <path
        d="M44 46.5Q50 51 56 46.5"
        fill="none"
        stroke="#7cc4ef"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="34" cy="47" r="2.3" fill="#f4bf4f" opacity="0.75" />
      <circle cx="66" cy="47" r="2.3" fill="#f4bf4f" opacity="0.75" />
      <g className={styles.arm}>
        <path
          d="M74 73Q85 66 88.5 52"
          fill="none"
          stroke="#c9d6e3"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle
          cx="89.5"
          cy="46.5"
          r="6.6"
          fill="#e8eef5"
          stroke="#b6c6d6"
          strokeWidth="1.6"
        />
        <path
          d="M85.5 41.5 84.6 37.6M89.6 40.2V35.8M93.6 41.8 95.2 38.4"
          stroke="#b6c6d6"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
