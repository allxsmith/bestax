import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import Button from '@theme/CodeBlock/Buttons/Button';
import IconCopy from '@theme/Icon/Copy';
import IconSuccess from '@theme/Icon/Success';
import IconClose from '../IconClose';

import styles from './styles.module.css';

function CustomCopyButton({ code, className }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const copyTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 1300);
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      setIsError(true);
      setIsCopied(false);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setIsError(false), 1300);
    }
  };

  useEffect(() => {
    return () => {
      // Clear all timeouts on component unmount
      copyTimeoutRef.current && clearTimeout(copyTimeoutRef.current);
      errorTimeoutRef.current && clearTimeout(errorTimeoutRef.current);
    };
  }, []);

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
