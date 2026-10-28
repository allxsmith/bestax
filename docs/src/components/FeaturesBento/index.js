import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useColorMode } from '@docusaurus/theme-common';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { FEATURES } from '@site/src/components/HomepageFeatures/features';
import useInView from '@site/src/components/HomepageFeatures/useInView';
import styles from './styles.module.css';

const [BULMA, LIGHTWEIGHT, DEVELOPER] = FEATURES;

/**
 * What the Bulma v1 card's little settings window walks through. The window
 * keeps the site's color mode the whole way, so on a dark site the Dark mode
 * button stays pressed while the others take turns.
 */
const STEPS = ['Dark mode', 'CSS variables', 'Grid', 'Skeleton'];
const DARK_MODE = STEPS.indexOf('Dark mode');
const STEP_MS = 2600;

/** The six cells of the Grid step, in Bulma's color order. */
const GRID_CELLS = ['primary', 'link', 'info', 'success', 'warning', 'danger'];

/** The suggestions the editor card offers for `color`. */
const COLORS = ['primary', 'link', 'info', 'success', 'warning', 'danger'];

/** The modules the bundle card shakes out, with the two the import keeps. */
const MODULES = [
  { name: 'Button', kept: true },
  { name: 'Modal' },
  { name: 'Table' },
  { name: 'Card', kept: true },
  { name: 'Tabs' },
  { name: 'Navbar' },
  { name: 'Slider' },
  { name: 'Menu' },
];

/** Moves the card's spotlight to the pointer, through two custom properties. */
function spotlight(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--sx', `${event.clientX - rect.left}px`);
  card.style.setProperty('--sy', `${event.clientY - rect.top}px`);
}

function Card({ className, delay, children }) {
  return (
    <div
      className={clsx(styles.cardWrap, className)}
      style={{ animationDelay: delay }}
    >
      <article className={styles.card} onPointerMove={spotlight}>
        <span className={styles.spot} aria-hidden="true" />
        <div className={styles.cardInner}>
          <span className={styles.glowIn} aria-hidden="true" />
          {children}
        </div>
      </article>
    </div>
  );
}

/**
 * A settings form drawn in Bulma v1's styles, stepping through dark mode, a
 * primary hue changed through one CSS variable, the Grid, and Skeleton. Its
 * scheme comes from the site's (see `.window` in the stylesheet), not the step.
 */
function BulmaWindow({ step }) {
  return (
    <div
      className={clsx(
        styles.window,
        step === 1 ? styles.hueIndigo : styles.hueTurquoise,
        step === 2 && styles.showGrid,
        step === 3 && styles.showSkeleton
      )}
    >
      <div className={styles.windowHead}>
        <span className={styles.windowTitle}>Settings</span>
        <code className={styles.cssVar}>
          --bulma-primary-h:{' '}
          <b
            className={clsx(
              styles.hue,
              step === 1 && styles.hueChangeA,
              step === 2 && styles.hueChangeB
            )}
          >
            {step === 1 ? 233 : 171}
          </b>
          ;
        </code>
      </div>
      <div className={styles.windowBody}>
        <div className={clsx(styles.layer, styles.formLayer)}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Project</span>
            <span className={clsx(styles.input, styles.inputFocus)}>
              <span>
                my-app
                <span className={styles.inputCaret} />
              </span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Theme</span>
            <span className={styles.input}>
              <span>
                <span className={styles.themeLight}>Light</span>
                <span className={styles.themeDark}>Dark</span>
              </span>
              <svg viewBox="0 0 12 12">
                <path d="M3 4.5 6 7.5 9 4.5" />
              </svg>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Dark mode</span>
            <span className={styles.toggle}>
              <span />
            </span>
          </div>
          <div className={clsx(styles.row, styles.actions)}>
            <span className={clsx(styles.formButton, styles.formPrimary)}>
              Save
            </span>
            <span className={styles.formButton}>Cancel</span>
            <span className={styles.tag}>v1</span>
          </div>
        </div>
        <div className={clsx(styles.layer, styles.gridLayer)}>
          {GRID_CELLS.map((color, i) => (
            <span
              key={color}
              className={clsx(styles.gridCell, styles[color])}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {color}
            </span>
          ))}
        </div>
        <div className={clsx(styles.layer, styles.skeletonLayer)}>
          <span className={clsx(styles.bone, styles.boneBlock)} />
          <span className={styles.bone} style={{ width: '90%' }} />
          <span className={styles.bone} style={{ width: '75%' }} />
          <span className={styles.bone} style={{ width: '60%' }} />
          <span className={styles.bone} style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  );
}

/** An import typed in, then everything it didn't name falls out of the bundle. */
function ShakeDemo() {
  return (
    <div className={styles.code} aria-hidden="true">
      <div className={styles.importLines}>
        <span className={styles.importLine1}>
          <span className={styles.keyword}>import</span> {'{ '}
          <span className={styles.ident}>Button</span>,{' '}
          <span className={styles.ident}>Card</span>
          {' }'}
        </span>
        <span className={styles.importLine2}>
          {'  '}
          <span className={styles.keyword}>from</span>{' '}
          <span className={styles.string}>{"'@allxsmith/bestax-bulma'"}</span>
        </span>
      </div>
      <div className={styles.modules}>
        {MODULES.map((module, i) => (
          <span
            key={module.name}
            className={clsx(
              styles.module,
              module.kept ? styles.kept : styles.shaken,
              i % 2 === 1 && styles.shakenLeft
            )}
            style={module.kept ? undefined : { animationDelay: `${i * 50}ms` }}
          >
            {module.name}
          </span>
        ))}
      </div>
      <div className={styles.bundle}>
        <span>bundle</span>
        <span className={styles.bundleTrack}>
          <span className={styles.bundleFill} />
        </span>
        <span className={styles.bundleNote}>only what you import</span>
      </div>
    </div>
  );
}

/** An editor completing `color=` from the prop's type, then the result. */
function TypesDemo() {
  return (
    <div className={styles.code} aria-hidden="true">
      <div className={styles.codeLine}>
        <span className={styles.gutter}>1</span>
        <span className={styles.typedHead}>
          <span className={styles.tagName}>{'<Button'}</span>{' '}
          <span className={styles.attr}>color</span>
          <span className={styles.punct}>=</span>
          <span className={styles.string}>&quot;</span>
        </span>
        <span className={styles.typedTail}>
          <span className={styles.string}>success&quot;</span>
          <span className={styles.tagName}>{'>'}</span>
          Save
          <span className={styles.tagName}>{'</Button>'}</span>
        </span>
        <span className={styles.editorCaret} />
      </div>
      <div className={styles.suggest}>
        <span className={styles.suggestHighlight} />
        {COLORS.map(color => (
          <span key={color} className={styles.suggestion}>
            <span className={styles.suggestType}>T</span>&quot;{color}&quot;
          </span>
        ))}
      </div>
      <div className={styles.result}>
        <span className={styles.preview}>Save</span>
        <span className={styles.resultNote}>suggested by the prop types</span>
      </div>
    </div>
  );
}

/**
 * "Why bestax" as bento cards, each with a small demo of its claim: Bulma v1's
 * theming at work, tree-shaking, and typed props completing in an editor.
 */
export default function FeaturesBento({ focusOnMount = false }) {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const inView = useInView(sectionRef);
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  // Whether the Dark mode button reads as pressed. useColorMode answers "light"
  // in the prerender, so this waits for the browser rather than mismatch the
  // hydrated page; the window's own colors come from CSS and never wait.
  const { colorMode } = useColorMode();
  const dark = useIsBrowser() && colorMode === 'dark';
  // Steps of the timer to sit out after the reader picks one, so their pick
  // stays on screen long enough to look at.
  const holdTicks = useRef(0);

  // Arriving from the hex layout, focus lands here so a keyboard reader isn't
  // left on a badge that no longer exists.
  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  useEffect(() => {
    if (!inView) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (holdTicks.current > 0) {
        holdTicks.current -= 1;
        return;
      }
      setHeld(false);
      setStep(current => (current + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [inView]);

  const choose = index => {
    holdTicks.current = 2;
    setHeld(true);
    setStep(index);
  };

  return (
    <section
      ref={sectionRef}
      className={clsx(styles.section, inView && styles.inView)}
      aria-labelledby="why-bestax-title"
    >
      <div className={styles.container}>
        <h2
          ref={headingRef}
          id="why-bestax-title"
          className={styles.title}
          tabIndex={-1}
        >
          Why bestax
        </h2>
        <div className={styles.bento}>
          <Card className={styles.wide} delay="80ms">
            <div className={clsx(styles.wideInner, held && styles.held)}>
              <div>
                <span className={styles.kicker}>{BULMA.kicker}</span>
                <h3 className={styles.cardTitle}>{BULMA.title}</h3>
                <p className={styles.cardText}>{BULMA.description}</p>
                <div className={styles.steps}>
                  {STEPS.map((label, i) => {
                    const on = i === step || (i === DARK_MODE && dark);
                    return (
                      <button
                        key={label}
                        type="button"
                        className={clsx(
                          styles.step,
                          on && styles.stepOn,
                          i === step && styles.stepCurrent
                        )}
                        aria-pressed={on}
                        onClick={() => choose(i)}
                      >
                        {label}
                        <span className={styles.stepTimer} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.stage} aria-hidden="true">
                <BulmaWindow step={step} />
              </div>
            </div>
          </Card>
          <Card className={styles.half} delay="200ms">
            <div className={styles.halfInner}>
              <ShakeDemo />
              <span className={styles.kicker}>{LIGHTWEIGHT.kicker}</span>
              <h3 className={styles.cardTitle}>{LIGHTWEIGHT.title}</h3>
              <p className={styles.cardText}>{LIGHTWEIGHT.description}</p>
            </div>
          </Card>
          <Card className={styles.half} delay="320ms">
            <div className={styles.halfInner}>
              <TypesDemo />
              <span className={styles.kicker}>{DEVELOPER.kicker}</span>
              <h3 className={styles.cardTitle}>{DEVELOPER.title}</h3>
              <p className={styles.cardText}>{DEVELOPER.description}</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
