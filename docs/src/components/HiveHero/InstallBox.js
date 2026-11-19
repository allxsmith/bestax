import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useStorageSlot } from '@docusaurus/theme-common';
import {
  PACKAGE_MANAGERS,
  DEFAULT_PACKAGE_MANAGER,
  TAB_STORAGE_KEY,
  renderCommand,
} from '@site/src/components/PackageManagerTabs/translate.mjs';
import styles from './styles.module.css';

/** The command the hero advertises, in pnpm's authoring vocabulary. */
const HERO_COMMAND = 'add @allxsmith/bestax-bulma';
const PACKAGE = '@allxsmith/bestax-bulma';

/** The manager-and-verb half of the command, the only part a switch retypes. */
function headFor(manager) {
  const command = renderCommand(HERO_COMMAND, manager);
  return command.slice(0, command.length - PACKAGE.length).trimEnd();
}

/*
 * Icons live at module scope rather than inside InstallBox: a component
 * declared during render is a new type on every render, so React would remount
 * it instead of updating it, and the copy button swaps these two on each copy.
 */
const CopyIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
  </svg>
);

const CheckIcon = () => (
  <svg className={styles.checkIcon} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

/**
 * The install command, with the package-manager switch above it. Switching
 * retypes the manager and verb in place; the package name stays put.
 */
export default function InstallBox({ className, style }) {
  // The same storage slot Docusaurus uses for the docs tab group, so a choice
  // made here is already selected on every docs page and vice versa. The key is
  // imported rather than written out: it and the `groupId` it derives from have
  // to agree exactly, and a mismatch degrades silently to "hero and docs no
  // longer share a choice" with nothing failing.
  // useStorageSlot rather than localStorage directly: its server snapshot is null,
  // so SSR renders the default and hydration matches, and its setter dispatches a
  // synthetic storage event that live-updates any mounted tab group.
  const [storedManager, managerSlot] = useStorageSlot(TAB_STORAGE_KEY);
  const manager = PACKAGE_MANAGERS.includes(storedManager)
    ? storedManager
    : DEFAULT_PACKAGE_MANAGER;
  const command = renderCommand(HERO_COMMAND, manager);

  const [copied, setCopied] = useState(false);
  // Held in a ref so a second copy restarts the window instead of inheriting the
  // first one's deadline.
  const copyTimer = useRef(null);

  // The head while it is being retyped; null shows the real one. Only a switch
  // the reader makes animates, so a choice restored from storage on load just
  // appears.
  const [typed, setTyped] = useState(null);
  const typer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      clearInterval(typer.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Denied permission, or a non-secure context. Leaving the icon unchanged
      // is the honest signal: claiming "Copied!" when the clipboard is
      // untouched is worse than doing nothing.
      return;
    }
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const retype = (from, to) => {
    clearInterval(typer.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(null);
      return;
    }
    let text = from;
    setTyped(text);
    typer.current = setInterval(() => {
      if (!to.startsWith(text)) text = text.slice(0, -1);
      else if (text.length < to.length) text = to.slice(0, text.length + 1);
      else {
        clearInterval(typer.current);
        typer.current = null;
        setTyped(null);
        return;
      }
      setTyped(text);
    }, 32);
  };

  const pick = next => {
    if (next === manager) return;
    retype(typed ?? headFor(manager), headFor(next));
    managerSlot.set(next);
  };

  // Focus has to move with the selection, or a second arrow press would start
  // from whatever the browser still considers focused. Queried out of the group
  // rather than held in a ref array so adding a manager needs no bookkeeping.
  const switcherRef = useRef(null);
  const selectManager = index => {
    const wrapped = (index + PACKAGE_MANAGERS.length) % PACKAGE_MANAGERS.length;
    const next = PACKAGE_MANAGERS[wrapped];
    pick(next);
    switcherRef.current
      ?.querySelector(`[data-manager="${next}"]`)
      ?.focus({ preventScroll: true });
  };

  // The radiogroup key contract: arrows move *and* select, and they wrap, so
  // the group has no dead ends.
  const handleSwitcherKeyDown = event => {
    const current = PACKAGE_MANAGERS.indexOf(manager);
    const move = {
      ArrowRight: current + 1,
      ArrowDown: current + 1,
      ArrowLeft: current - 1,
      ArrowUp: current - 1,
      Home: 0,
      End: PACKAGE_MANAGERS.length - 1,
    }[event.key];

    if (move === undefined) return;
    // Claim only the keys actually handled, so Tab still leaves the group and
    // PageUp/PageDown still scroll the page.
    event.preventDefault();
    selectManager(move);
  };

  const head = typed ?? headFor(manager);

  return (
    <div
      className={clsx(styles.term, copied && styles.termCopied, className)}
      style={style}
    >
      <div className={styles.termHead}>
        {/*
          A real radiogroup, not toggle buttons: "exactly one of these four" is
          what this control means. One tab stop via roving tabindex, arrows that
          select and wrap, Home/End for the ends, and focus that follows the
          selection. Outside the copy button on purpose, so picking a manager
          never bubbles into a copy.
        */}
        <div
          className={styles.pm}
          role="radiogroup"
          aria-label="Package manager"
          ref={switcherRef}
          onKeyDown={handleSwitcherKeyDown}
        >
          {PACKAGE_MANAGERS.map(name => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={name === manager}
              tabIndex={name === manager ? 0 : -1}
              data-manager={name}
              className={clsx(
                styles.pmItem,
                name === manager && styles.pmItemActive
              )}
              onClick={() => pick(name)}
            >
              {name}
            </button>
          ))}
          <span
            className={styles.pmInk}
            style={{
              transform: `translateX(${PACKAGE_MANAGERS.indexOf(manager) * 100}%)`,
            }}
            aria-hidden="true"
          />
        </div>
        <span className={styles.termHint} aria-hidden="true">
          {copied ? 'copied' : 'click to copy'}
        </span>
      </div>
      {/*
        aria-label rather than the command text as the accessible name: the
        name should say what activating this does, and the command is still
        readable as content.
      */}
      <button
        type="button"
        className={styles.cmd}
        onClick={handleCopy}
        aria-label={`Copy install command for ${manager}`}
        title={copied ? 'Copied!' : 'Click to copy'}
      >
        <span className={styles.prompt} aria-hidden="true">
          $
        </span>
        <code className={styles.cmdCode}>
          {head}
          {head && ' '}
          <span className={styles.cmdPackage}>{PACKAGE}</span>
          <span
            className={clsx(styles.caret, typed !== null && styles.caretTyping)}
            aria-hidden="true"
          />
        </code>
        <span className={styles.cmdIcon} aria-hidden="true">
          {copied ? <CheckIcon /> : <CopyIcon />}
        </span>
      </button>
      {/*
        The icon swap is silent to assistive tech, so this confirms the copy.
        Rendered empty until then so the region is already in the accessibility
        tree when the text arrives: announcing depends on the content changing,
        not the node appearing.
      */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {copied ? 'Copied to clipboard' : ''}
      </div>
    </div>
  );
}
