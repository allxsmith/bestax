import styles from './styles.module.css';

const STAR =
  '12,2.8 14.47,9.4 21.51,9.71 15.99,14.1 17.88,20.89 12,17 6.12,20.89 8.01,14.1 2.49,9.71 9.53,9.4';

function Star({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <polygon points={STAR} />
    </svg>
  );
}

/**
 * The small white drawing on the front of a tile, after the ones on the social
 * card. Each runs its own short loop in CSS, so the field keeps moving without
 * a timer per tile.
 */
export default function Glyph({ id }) {
  switch (id) {
    case 'switch':
      return (
        <span className={styles.glSwitch}>
          <span className={styles.knob} />
        </span>
      );
    case 'checkbox':
      return (
        <span className={styles.glCheck}>
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      );
    case 'rate':
      return (
        <span className={styles.glStars}>
          <Star />
          <Star />
          <Star />
        </span>
      );
    case 'slider':
      return (
        <span className={styles.glSlider}>
          <span className={styles.track} />
          <span className={styles.fill} />
          <span className={styles.thumb} />
        </span>
      );
    case 'progress':
      return (
        <span className={styles.glProgress}>
          <span className={styles.bar} />
        </span>
      );
    case 'button':
      return (
        <span className={styles.glButton}>
          <span className={styles.label} />
        </span>
      );
    case 'calendar':
      return (
        <span className={styles.glCalendar}>
          <span className={styles.calHead} />
          <span className={styles.calDays}>
            {Array.from({ length: 12 }, (_, day) => (
              <span key={day} className={styles.calDay} />
            ))}
          </span>
        </span>
      );
    case 'tabs':
      return (
        <span className={styles.glTabs}>
          <span className={styles.tabRow}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.tabLine}>
            <span className={styles.tabInk} />
          </span>
          <span className={styles.tabBody} />
        </span>
      );
    case 'content':
      return (
        <span className={styles.glContent}>
          <span />
          <span />
          <span />
          <span />
        </span>
      );
    case 'select':
      return (
        <span className={styles.glSelect}>
          <span className={styles.selectBox}>
            <span />
            <svg viewBox="0 0 12 12">
              <path d="M3 4.5 6 7.5 9 4.5" />
            </svg>
          </span>
          <span className={styles.selectMenu}>
            <span />
            <span />
          </span>
        </span>
      );
    case 'notification':
      return (
        <span className={styles.glNotification}>
          <span className={styles.noteCard}>
            <span />
            <span />
          </span>
        </span>
      );
    case 'tags':
      return (
        <span className={styles.glTags}>
          <span />
          <span />
        </span>
      );
    case 'ts':
      return <span className={styles.glTs}>TS</span>;
    case 'ai':
      return (
        <svg className={styles.glAi} viewBox="0 0 44 44">
          <path d="M19 11C20 20 22 23 33 25 22 27 20 30 19 39 18 30 16 27 5 25 16 23 18 20 19 11Z" />
          <path d="M34 3C34.5 7.5 35.5 9 41 10 35.5 11 34.5 12.5 34 17 33.5 12.5 32.5 11 27 10 32.5 9 33.5 7.5 34 3Z" />
        </svg>
      );
    case 'grid':
      return (
        <span className={styles.glGrid}>
          <span />
          <span />
          <span />
        </span>
      );
    default:
      return null;
  }
}
