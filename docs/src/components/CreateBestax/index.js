import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useStorageSlot } from '@docusaurus/theme-common';
import {
  PACKAGE_MANAGERS,
  DEFAULT_PACKAGE_MANAGER,
  TAB_STORAGE_KEY,
  renderCommand,
} from '@site/src/components/PackageManagerTabs/translate.mjs';
import styles from './styles.module.css';

/**
 * The questions create-bestax asks, worded the way the CLI words them
 * (create-bestax/src/constants.ts), with the answers this run picks. Change
 * both together. The last one names the package manager running it.
 */
const prompts = manager => [
  ['Select a framework:', 'Vite + TypeScript'],
  ['Which linter would you like to use?', 'Oxlint (Recommended)'],
  ['Which Bulma CSS flavor would you like to use?', 'Complete (Recommended)'],
  ['Would you like to add an icon library?', 'Font Awesome'],
  [
    'Install the bestax AI skills (.claude/skills) for Claude Code and other agents?',
    'Yes',
  ],
  [`Install with ${manager} and start the dev server now?`, 'Yes'],
];

/** What the run writes, as it lands in the file tree. */
const FILES = [
  { name: '.claude/skills/', folder: true, ai: true },
  { name: '.claude/launch.json', ai: true },
  { name: 'CLAUDE.md', ai: true },
  { name: 'public/', folder: true },
  { name: 'src/', folder: true },
  { name: 'src/App.tsx' },
  { name: 'src/main.tsx' },
  { name: 'index.html' },
  { name: 'package.json' },
  { name: 'vite.config.ts' },
  { name: 'tsconfig.json' },
  { name: 'README.md' },
];

/*
 * The run, one step at a time: 0 types the command, 1 prints the banner,
 * 2-7 ask the questions (each answer shows as the next question arrives),
 * 8-10 write the project, 11 installs, 12 starts the dev server and 13 has
 * the app up. HOLD is how long each step stays before the next.
 */
const HIDDEN = -1;
const FIRST_PROMPT = 2;
const WRITING = 8;
const INSTALLING = 11;
const LIVE = 13;
const HOLD = [
  0, 700, 900, 900, 900, 900, 900, 1000, 1500, 1000, 900, 1400, 1100,
];

/** Tools around the scaffold that the rest of the homepage never shows. */
const TOOLS = [
  {
    key: 'migrate',
    title: 'Bring an existing app',
    text: 'bestax-migrate moves a react-bulma-components, rbx or Bloomer app, or plain Bulma class names, onto bestax with codemods.',
    to: '/docs/guides/getting-started/migration',
    cta: 'Migration guides',
    icon: 'M4 7h13l-3-3M20 17H7l3 3',
  },
  {
    key: 'lint',
    title: 'Lint the props that fail quietly',
    text: 'The ESLint plugin catches helper-prop values the library drops without a word, and props on their way out.',
    to: '/docs/guides/getting-started/eslint-plugin',
    cta: 'ESLint plugin',
    icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM8.5 12l2.5 2.5 4.5-5',
  },
  {
    key: 'templates',
    title: 'Start from a template',
    text: 'Bulma templates ported to bestax, each one click away from a running copy in StackBlitz.',
    to: '/templates',
    cta: 'Templates',
    icon: 'M5.5 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3.5 9h17M9 9v11',
  },
  {
    key: 'sandbox',
    title: 'Open any example in a sandbox',
    text: 'Live examples in the docs open in StackBlitz or CodeSandbox, with the imports they need already in place.',
    to: '/docs/api/elements/button',
    cta: 'Try one',
    icon: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  },
];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const FolderIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M1.5 3.5h4l1.5 1.5h7.5v8h-13z" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 1.5h6l3 3v10h-9z" />
  </svg>
);

const BestaxMark = () => (
  <svg viewBox="0 0 400 400" aria-hidden="true">
    <polygon
      points="364.54,105 364.54,295 200,390 35.46,295 35.46,105 200,10"
      fill="#08519c"
    />
    <polygon
      points="302.84,140.63 302.84,259.38 200,318.75 97.16,259.38 97.16,140.63 200,81.25"
      fill="#6baed6"
    />
    <polygon
      points="241.14,176.25 241.14,223.75 200,247.5 158.86,223.75 158.86,176.25 200,152.5"
      fill="#08519c"
    />
  </svg>
);

/**
 * The starter app create-bestax writes, drawn small: its title, the three
 * cards and the interactive example, whose two buttons work here too.
 */
function StarterApp() {
  const [notice, setNotice] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <div className={styles.app}>
      <div className={styles.logos} aria-hidden="true">
        <BestaxMark />
        <span>Vite</span>
        <span>React</span>
      </div>
      <p className={styles.appTitle}>Bestax + Vite + React</p>
      <div className={styles.appCards}>
        {['Quick Start', 'Documentation', 'Examples'].map((title, i) => (
          <div
            key={title}
            className={styles.appCard}
            style={{ animationDelay: `${80 + i * 80}ms` }}
          >
            {title}
            <span />
          </div>
        ))}
      </div>
      <div className={styles.appButtons}>
        <button
          type="button"
          className={styles.appPrimary}
          onClick={() => setNotice(shown => !shown)}
        >
          Toggle Notification
        </button>
        <button
          type="button"
          className={styles.appInfo}
          onClick={() => setCount(n => n + 1)}
        >
          Count: {count}
        </button>
      </div>
      {/* A status region of its own per notice, kept mounted as in the
          starter, so a screen reader announces each one as it appears. */}
      <div role="status" className={styles.status}>
        {notice && (
          <p className={clsx(styles.appNote, styles.appNoteSuccess)}>
            <strong>Success!</strong> Your Vite + Bestax setup is working
            perfectly!
          </p>
        )}
      </div>
      <div role="status" className={styles.status}>
        {count > 0 && (
          <p className={clsx(styles.appNote, styles.appNoteInfo)}>
            You&apos;ve clicked the button {count} times!
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Replaces the homepage's "New in Bulma v1" carousel: create-bestax scaffolding
 * a project in a terminal, the files landing, and the starter app coming up,
 * then the tools around it that the homepage didn't show before.
 *
 * The prerendered page carries the finished run, so it reads complete without
 * JavaScript. In the browser the run hides until the section scrolls into
 * view, then plays once; Replay plays it again. The run follows the package
 * manager picked in the hero, the same way the docs tabs do.
 */
export default function CreateBestax() {
  const [storedManager] = useStorageSlot(TAB_STORAGE_KEY);
  const manager = PACKAGE_MANAGERS.includes(storedManager)
    ? storedManager
    : DEFAULT_PACKAGE_MANAGER;
  const command = renderCommand('create bestax@latest my-app', manager);

  const terminalRef = useRef(null);
  const commandRef = useRef(command);
  useEffect(() => {
    commandRef.current = command;
  }, [command]);

  const [step, setStep] = useState(LIVE);
  // The command as typed so far; null shows all of it.
  const [typed, setTyped] = useState(null);
  const [runs, setRuns] = useState(0);
  const timers = useRef([]);
  const typer = useRef(null);
  const observerRef = useRef(null);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearInterval(typer.current);
    typer.current = null;
  }, []);

  // Disarms the observer first, so a Replay clicked before the terminal
  // reaches the threshold isn't restarted when it does.
  const play = useCallback(() => {
    stop();
    observerRef.current?.disconnect();
    setRuns(n => n + 1);
    if (prefersReducedMotion()) {
      setTyped(null);
      setStep(LIVE);
      return;
    }
    setStep(0);
    setTyped('');
    let length = 0;
    typer.current = setInterval(() => {
      length += 1;
      setTyped(commandRef.current.slice(0, length));
      if (length < commandRef.current.length) return;
      clearInterval(typer.current);
      typer.current = null;
      const advance = next => {
        setTyped(null);
        setStep(next);
        if (next < LIVE) {
          timers.current.push(setTimeout(() => advance(next + 1), HOLD[next]));
        }
      };
      timers.current.push(setTimeout(() => advance(1), 450));
    }, 40);
  }, [stop]);

  // Watches the terminal rather than the section, and by edge rather than by
  // share: on a phone the section is several screens tall, so "a third of it
  // visible" never happens and the run would never start.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
        } else {
          setStep(HIDDEN);
        }
      },
      { rootMargin: '0px 0px -25% 0px' }
    );
    observerRef.current = observer;
    observer.observe(terminalRef.current);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [play, stop]);

  const shown = at => step >= at;

  return (
    <section className={styles.section} aria-labelledby="create-bestax-title">
      <div className="container">
        <div className={styles.head}>
          <span className={styles.kicker}>create-bestax</span>
          <h2 id="create-bestax-title" className={styles.title}>
            From an empty folder to a running app
          </h2>
          <p className={styles.lede}>
            create-bestax asks a few questions, writes a Vite and React project
            with Bulma wired in, and puts the bestax AI skills next to your
            code.
          </p>
          <Link className={styles.quickStart} to="/docs/guides/intro">
            Read the Quick Start <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.stage}>
          <div ref={terminalRef} className={styles.terminal}>
            <div className={styles.bar}>
              <span>~/projects</span>
              <button
                type="button"
                className={styles.replay}
                onClick={play}
                aria-label="Replay the scaffold"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
                </svg>
                replay
              </button>
            </div>
            <div className={styles.lines} aria-hidden="true">
              <span className={clsx(styles.line, shown(0) && styles.on)}>
                <span className={styles.prompt}>$ </span>
                {typed ?? command}
                {typed !== null && <span className={styles.caret} />}
              </span>
              <span className={clsx(styles.line, shown(1) && styles.on)}>
                <span className={styles.rule}>{'━'.repeat(40)}</span>
              </span>
              <span className={clsx(styles.line, shown(1) && styles.on)}>
                {'  🐝 '}
                <strong className={styles.banner}>Create Bestax App</strong>
              </span>
              <span className={clsx(styles.line, shown(1) && styles.on)}>
                <span className={styles.rule}>{'━'.repeat(40)}</span>
              </span>
              {prompts(manager).map(([question, answer], i) => (
                <span
                  key={i}
                  className={clsx(
                    styles.line,
                    shown(FIRST_PROMPT + i) && styles.on
                  )}
                >
                  <span className={styles.question}>? </span>
                  {question} <span className={styles.dim}>› </span>
                  {shown(FIRST_PROMPT + i + 1) && (
                    <span className={styles.answer}>{answer}</span>
                  )}
                </span>
              ))}
              <span className={clsx(styles.line, shown(WRITING) && styles.on)}>
                <span className={styles.ok}>✔ </span>Creating project in
                ~/projects/my-app
              </span>
              <span
                className={clsx(styles.line, shown(WRITING + 1) && styles.on)}
              >
                <span className={styles.ok}>✔ </span>Installed bestax AI skills
                into .claude/skills/ (+ CLAUDE.md, .claude/launch.json)
              </span>
              <span
                className={clsx(styles.line, shown(WRITING + 2) && styles.on)}
              >
                <span className={styles.ok}>✔ Done!</span> Project created
                successfully.
              </span>
              <span
                className={clsx(styles.line, shown(INSTALLING) && styles.on)}
              >
                {'  '}Installing dependencies with {manager}...
              </span>
              <span className={clsx(styles.line, shown(LIVE - 1) && styles.on)}>
                {'  '}Starting the dev server...
              </span>
              <span className={clsx(styles.line, shown(LIVE) && styles.on)}>
                <span className={styles.dim}>{'  ➜  Local:   '}</span>
                <span className={styles.answer}>http://localhost:5173/</span>
              </span>
            </div>
          </div>

          <div className={styles.side}>
            <div className={styles.files} aria-hidden="true">
              <div className={styles.bar}>
                <span>my-app/</span>
              </div>
              <ul className={styles.tree}>
                {FILES.map((file, i) => (
                  <li
                    key={file.name}
                    className={clsx(
                      styles.file,
                      file.folder && styles.folder,
                      file.ai && styles.aiFile,
                      shown(WRITING) && styles.on
                    )}
                    style={{ transitionDelay: `${i * 90}ms` }}
                  >
                    {file.folder ? <FolderIcon /> : <FileIcon />}
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className={clsx(styles.browser, shown(LIVE) && styles.live)}
              aria-hidden={!shown(LIVE)}
            >
              <div className={styles.url} aria-hidden="true">
                <span>localhost:5173</span>
              </div>
              <div className={styles.page}>
                {shown(LIVE) ? (
                  <StarterApp key={runs} />
                ) : (
                  <span className={styles.waiting}>
                    waiting for the dev server…
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <ul className={styles.tools}>
          {TOOLS.map(tool => (
            <li key={tool.key}>
              <Link className={styles.tool} to={tool.to}>
                <span className={styles.toolIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d={tool.icon} />
                  </svg>
                </span>
                <h3 className={styles.toolTitle}>{tool.title}</h3>
                <p className={styles.toolText}>{tool.text}</p>
                <span className={styles.toolCta}>
                  {tool.cta} <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
