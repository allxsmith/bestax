import React, { useState } from 'react';
import clsx from 'clsx';
import Button from '@theme/CodeBlock/Buttons/Button';
import IconCopy from '@theme/Icon/Copy';
import IconSuccess from '@theme/Icon/Success';
import IconClose from '../IconClose';

import styles from './styles.module.css';

function CustomCopyButton({ code, className }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setIsError(false);
      setTimeout(() => setIsCopied(false), 2000);
      setTimeout(() => setIsError(false), 2000);
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      setIsError(true);
      setIsCopied(false);
      setTimeout(() => setIsError(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      aria-label={isCopied ? 'Copied' : 'Copy code to clipboard'}
      title="Copy"
      className={clsx(
        className,
        isCopied && styles.copyButtonCopied,
        isError && styles.copyButtonError
      )}
      onClick={handleCopy}
    >
      <span className={styles.copyButtonIcons} aria-hidden="true">
        <IconCopy className={styles.copyButtonIcon} />
        <IconSuccess className={styles.copyButtonSuccessIcon} />
        <IconClose className={styles.copyButtonErrorIcon} />
      </span>
    </Button>
  );
}

export default CustomCopyButton;
