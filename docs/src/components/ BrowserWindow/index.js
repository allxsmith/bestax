import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function BrowserWindow({
  children,
  minHeight,
  url = 'Live Editor',
  style,
  bodyStyle,
}) {
  return (
    <div className={clsx(styles.browserWindow)} style={style}>
      <div className={styles.browserWindowHeader}>
        <div className={styles.buttons}>
          <span className={styles.dot} style={{ background: '#f25f58' }} />
          <span className={styles.dot} style={{ background: '#fbbe3c' }} />
          <span className={styles.dot} style={{ background: '#58cb42' }} />
        </div>
        <div className={styles.browserWindowAddressBar}>{url}</div>
      </div>
      <div
        className={styles.browserWindowBody}
        style={{ minHeight, ...bodyStyle }}
      >
        {children}
      </div>
    </div>
  );
}
