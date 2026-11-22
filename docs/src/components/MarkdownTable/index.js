import { useRef } from 'react';
import useScrollRegion from './useScrollRegion';
import styles from './styles.module.css';

/**
 * A Markdown table, registered for every page in `src/theme/MDXComponents.js`
 * (#2219). Infima makes a table the element that scrolls when it's wider than
 * the page, and nothing in a Markdown table takes focus, so the keyboard
 * couldn't reach its far columns. The table can't be the region itself, since
 * the role would replace its table semantics, so a wrapper does the scrolling
 * instead, and while the table overflows it, the wrapper is a region with a
 * tab stop.
 */
export default function MarkdownTable(props) {
  const ref = useRef(null);
  const regionProps = useScrollRegion(ref);
  return (
    <div ref={ref} className={styles.scroller} {...regionProps}>
      <table {...props} />
    </div>
  );
}
