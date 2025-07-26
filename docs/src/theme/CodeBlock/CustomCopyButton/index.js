import React, { useState } from 'react';
import clsx from 'clsx';
import Button from '@theme/CodeBlock/Buttons/Button';
import IconCopy from '@theme/Icon/Copy';
import IconSuccess from '@theme/Icon/Success';

import styles from './styles.module.css';

function CustomCopyButton({ code, className }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      alert('Failed to copy text. Please try again.');
    }
  };

  return (
    <Button
      type="button"
      aria-label={isCopied ? 'Copied' : 'Copy code to clipboard'}
      title="Copy"
      className={clsx(
        className,
        // styles.copyButton,
        isCopied && styles.copyButtonCopied
      )}
      onClick={handleCopy}
    >
      <span className={styles.copyButtonIcons} aria-hidden="true">
        <IconCopy className={styles.copyButtonIcon} />
        <IconSuccess className={styles.copyButtonSuccessIcon} />
      </span>
    </Button>
  );
}

export default CustomCopyButton;
