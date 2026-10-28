import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import '@fontsource/poppins/latin-800.css';
import BestaxBot from '@site/src/components/BestaxBot';
import Glyph from './Glyph';
import InstallBox from './InstallBox';
import { CELLS, TILES } from './field';
import styles from './styles.module.css';

const LETTERS = ['b', 'e', 's', 't', 'a', 'x'];
const SPOKEN = 'bee-stacks'.split('');

/** The feature line under the tagline. Hovering one lights up its tiles. */
const FEATURE_LINKS = [
  { label: 'TypeScript', to: '/docs/guides/intro', light: 'ts' },
  { label: 'Forms', to: '/docs/api/form/switch', light: 'forms' },
  { label: 'Layout', to: '/docs/guides/library/columns', light: 'layout' },
  { label: 'Theming', to: '/docs/api/helpers/theme', light: 'theme' },
  { label: 'AI-ready', to: '/docs/guides/llms', light: 'ai' },
];

/** Hovering Theming walks the field through these, then it settles on blue. */
const PALETTE_CYCLE = ['teal', 'violet', 'honey', 'blue'];

const PALETTE_CLASS = {
  blue: null,
  teal: styles.palTeal,
  violet: styles.palViolet,
  honey: styles.palHoney,
};
const LIGHT_CLASS = {
  forms: styles.lightForms,
  layout: styles.lightLayout,
  ts: styles.lightTs,
  ai: styles.lightAi,
};
const KIND_CLASS = {
  forms: styles.kindForms,
  layout: styles.kindLayout,
  ts: styles.kindTs,
  ai: styles.kindAi,
};
const TONE_CLASS = [
  styles.t0,
  styles.t1,
  styles.t2,
  styles.t3,
  styles.t4,
  styles.t5,
  styles.t6,
];

/**
 * A CSS animation restarts only when its name changes, so each new count
 * alternates between two class names that run the same keyframes.
 */
function replay(count, a, b) {
  if (count === 0) return null;
  return count % 2 ? a : b;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const LogoRings = () => (
  <svg viewBox="0 0 400 400" aria-hidden="true">
    <polygon
      className={clsx(styles.ring, styles.ring1)}
      points="364.54,105 364.54,295 200,390 35.46,295 35.46,105 200,10"
    />
    <polygon
      className={clsx(styles.ring, styles.ring2)}
      points="333.69,122.81 333.69,277.19 200,354.38 66.31,277.19 66.31,122.81 200,45.63"
    />
    <polygon
      className={clsx(styles.ring, styles.ring3)}
      points="302.84,140.63 302.84,259.38 200,318.75 97.16,259.38 97.16,140.63 200,81.25"
    />
    <polygon
      className={clsx(styles.ring, styles.ring4)}
      points="271.99,158.44 271.99,241.56 200,283.13 128.01,241.56 128.01,158.44 200,116.88"
    />
    <polygon
      className={clsx(styles.ring, styles.ring5)}
      points="241.14,176.25 241.14,223.75 200,247.5 158.86,223.75 158.86,176.25 200,152.5"
    />
  </svg>
);

const SpeakerIcon = () => (
  <svg className={styles.speaker} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a10 10 0 0 1 0 14" />
  </svg>
);

const ArrowIcon = () => (
  <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const GitHubIcon = () => (
  <svg className={styles.githubIcon} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

/**
 * The cell bestaxbot lives in. A poke brings him up to wave, and he ducks back
 * down on his own; until then his antennae poke out now and then as a hint.
 */
function BotCell({ cell, flash, pokes, onPoke }) {
  return (
    <div
      className={clsx(styles.botWrap, replay(pokes, styles.upA, styles.upB))}
      style={{
        left: cell.x,
        top: cell.y,
        '--in': `${cell.enter}ms`,
        '--fd': `${flash}ms`,
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        className={clsx(styles.botCell, TONE_CLASS[cell.tone])}
        onClick={onPoke}
      >
        <span className={styles.botLift}>
          <BestaxBot className={styles.bot} waveKey={pokes} />
        </span>
      </button>
      <span className={styles.bubble}>hi!</span>
    </div>
  );
}

/**
 * The homepage hero: the social card's honeycomb, alive. Component tiles flip
 * to show their names, a light follows the pointer, the logo sends a
 * shockwave through the field, and one random cell hides bestaxbot.
 *
 * Everything in the field is decoration, so it is hidden from assistive tech
 * and kept out of the tab order; what it does is play, and the copy carries
 * the meaning.
 */
export default function HiveHero() {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const fieldRef = useRef(null);
  const copyRef = useRef(null);
  const logoRef = useRef(null);

  const [palette, setPalette] = useState('blue');
  const [light, setLight] = useState(null);
  const [pinned, setPinned] = useState(() => new Set());
  const [autoFlip, setAutoFlip] = useState(null);
  const [origin, setOrigin] = useState({ ox: -205, oy: -250 });
  const [waves, setWaves] = useState(0);
  const [hops, setHops] = useState(0);
  const [spoken, setSpoken] = useState(0);
  const [bot, setBot] = useState({ index: null, pokes: 0 });

  // The auto-flip timer reads these without restarting whenever they change.
  const lightRef = useRef(light);
  const pinnedRef = useRef(pinned);
  useEffect(() => {
    lightRef.current = light;
    pinnedRef.current = pinned;
  }, [light, pinned]);

  const visible = useRef(true);
  // Ticks of the auto-flip timer to sit out after the reader plays with the
  // field, so a tile they just flipped isn't upstaged by one flipping itself.
  const quietTicks = useRef(0);
  const cycle = useRef(null);
  const glowFrame = useRef(0);

  // Pause the field while the hero is scrolled away: the loops are cheap, but
  // not free, and nobody is watching them.
  useEffect(() => {
    const hero = heroRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      hero.toggleAttribute('data-offscreen', !entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Every few seconds one tile flips by itself to show what it is.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let unflip;
    const timer = setInterval(() => {
      if (!visible.current || document.hidden || lightRef.current) return;
      if (quietTicks.current > 0) {
        quietTicks.current -= 1;
        return;
      }
      const pool = TILES.filter(tile => !pinnedRef.current.has(tile.id));
      const tile = pool[Math.floor(Math.random() * pool.length)];
      if (!tile) return;
      setAutoFlip(tile.id);
      clearTimeout(unflip);
      unflip = setTimeout(
        () => setAutoFlip(current => (current === tile.id ? null : current)),
        2300
      );
    }, 2700);
    return () => {
      clearInterval(timer);
      clearTimeout(unflip);
    };
  }, []);

  // bestaxbot moves in once the field has powered on, into a random cell that
  // is on screen and clear of the copy, so a visitor can actually find him.
  useEffect(() => {
    const timer = setTimeout(() => {
      const hero = heroRef.current.getBoundingClientRect();
      const copy = copyRef.current.getBoundingClientRect();
      const margin = 40;
      const homes = [];
      heroRef.current.querySelectorAll('[data-cell]').forEach(node => {
        const cell = node.getBoundingClientRect();
        const onScreen =
          cell.left >= hero.left + 8 &&
          cell.right <= hero.right - 36 &&
          cell.top >= hero.top + 36 &&
          cell.bottom <= hero.bottom - 8;
        const clearOfCopy =
          cell.right < copy.left - margin ||
          cell.left > copy.right + margin ||
          cell.bottom < copy.top - margin ||
          cell.top > copy.bottom + margin;
        if (onScreen && clearOfCopy) homes.push(Number(node.dataset.cell));
      });
      if (homes.length === 0) return;
      setBot({
        index: homes[Math.floor(Math.random() * homes.length)],
        pokes: 0,
      });
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(
    () => () => {
      clearInterval(cycle.current);
      cancelAnimationFrame(glowFrame.current);
    },
    []
  );

  // The shockwave reaches each cell when the ring does.
  const flash = useMemo(() => {
    const delay = item =>
      Math.round(Math.hypot(item.dx - origin.ox, item.dy - origin.oy) * 0.75);
    return { cells: CELLS.map(delay), tiles: TILES.map(delay) };
  }, [origin]);

  const trackGlow = event => {
    if (event.pointerType !== 'mouse') return;
    const hero = heroRef.current;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    cancelAnimationFrame(glowFrame.current);
    glowFrame.current = requestAnimationFrame(() => {
      glowRef.current.style.transform = `translate(${x}px, ${y}px)`;
      hero.setAttribute('data-tracking', '');
    });
  };

  const dropGlow = () => {
    cancelAnimationFrame(glowFrame.current);
    heroRef.current.removeAttribute('data-tracking');
  };

  const flip = id => {
    quietTicks.current = 2;
    setPinned(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAutoFlip(current => (current === id ? null : current));
  };

  const shockwave = () => {
    const logo = logoRef.current.getBoundingClientRect();
    const field = fieldRef.current.getBoundingClientRect();
    quietTicks.current = 1;
    setOrigin({
      ox: Math.round(logo.left + logo.width / 2 - field.left),
      oy: Math.round(logo.top + logo.height / 2 - field.top),
    });
    setWaves(count => count + 1);
  };

  const speak = () => {
    setSpoken(count => count + 1);
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) return;
    synth.cancel();
    const utterance = new window.SpeechSynthesisUtterance('bee stacks');
    utterance.rate = 0.9;
    synth.speak(utterance);
  };

  const startTheming = () => {
    clearInterval(cycle.current);
    let step = 0;
    setLight('theme');
    setPalette(PALETTE_CYCLE[step]);
    // With reduced motion, one palette shows the idea: the walk would keep
    // flashing the whole hero.
    if (prefersReducedMotion()) return;
    cycle.current = setInterval(() => {
      step = (step + 1) % PALETTE_CYCLE.length;
      setPalette(PALETTE_CYCLE[step]);
    }, 1000);
  };

  const stopTheming = () => {
    clearInterval(cycle.current);
    cycle.current = null;
    setLight(null);
    setPalette('blue');
  };

  const lightUp = feature =>
    feature.light === 'theme' ? startTheming : () => setLight(feature.light);
  const lightDown = feature =>
    feature.light === 'theme' ? stopTheming : () => setLight(null);

  return (
    <header
      ref={heroRef}
      className={clsx(
        styles.hero,
        PALETTE_CLASS[palette],
        LIGHT_CLASS[light] && styles.lit,
        LIGHT_CLASS[light],
        replay(waves, styles.waveA, styles.waveB)
      )}
      onPointerMove={trackGlow}
      onPointerLeave={dropGlow}
    >
      <div className={clsx(styles.glow, styles.glowDrift)} aria-hidden="true" />
      <div
        ref={glowRef}
        className={clsx(styles.glow, styles.glowTrack)}
        aria-hidden="true"
      />

      <div ref={fieldRef} className={styles.field} aria-hidden="true">
        {CELLS.map((cell, i) =>
          i === bot.index ? (
            <BotCell
              key={cell.key}
              cell={cell}
              flash={flash.cells[i]}
              pokes={bot.pokes}
              onPoke={() =>
                setBot(current => ({ ...current, pokes: current.pokes + 1 }))
              }
            />
          ) : (
            <div
              key={cell.key}
              data-cell={i}
              className={clsx(styles.cell, TONE_CLASS[cell.tone])}
              style={{
                left: cell.x,
                top: cell.y,
                '--in': `${cell.enter}ms`,
                '--fd': `${flash.cells[i]}ms`,
              }}
            />
          )
        )}
        {TILES.map((tile, i) => {
          const flipped =
            pinned.has(tile.id) ||
            autoFlip === tile.id ||
            (light !== null && tile.kind === light);
          return (
            <div
              key={tile.id}
              className={clsx(
                styles.tile,
                TONE_CLASS[tile.tone],
                KIND_CLASS[tile.kind],
                flipped && styles.flipped
              )}
              style={{
                left: tile.x,
                top: tile.y,
                '--in': `${tile.enter}ms`,
                '--fd': `${flash.tiles[i]}ms`,
              }}
            >
              <button
                type="button"
                tabIndex={-1}
                className={styles.flipper}
                onClick={() => flip(tile.id)}
              >
                <span className={clsx(styles.face, styles.front)}>
                  <span className={styles.glyph}>
                    <Glyph id={tile.id} />
                  </span>
                </span>
                <span className={clsx(styles.face, styles.back)}>
                  <span className={styles.backText}>
                    <span className={styles.backName}>{tile.name}</span>
                    <span className={styles.backGroup}>{tile.group}</span>
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.waveLayer} aria-hidden="true">
        <svg
          className={styles.waveRing}
          style={{ left: origin.ox - 60, top: origin.oy - 70 }}
          viewBox="-60 -70 120 140"
        >
          <polygon
            points="0,-62 54,-31 54,31 0,62 -54,31 -54,-31"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.wrap}>
        <div ref={copyRef} className={styles.copy}>
          <div className={styles.brandRow}>
            <button
              ref={logoRef}
              type="button"
              className={styles.logo}
              onClick={shockwave}
              aria-label="Bestax logo: send a shockwave through the honeycomb"
            >
              <LogoRings />
            </button>
            <h1
              className={clsx(
                styles.wordmark,
                replay(hops, styles.hopA, styles.hopB)
              )}
              onMouseEnter={() => setHops(count => count + 1)}
            >
              <span className={styles.srOnly}>Bestax</span>
              <span className={styles.letters} aria-hidden="true">
                {LETTERS.map((letter, i) => (
                  <span
                    key={i}
                    className={styles.dropIn}
                    style={{ animationDelay: `${160 + i * 70}ms` }}
                  >
                    <span
                      className={styles.letter}
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      {letter}
                    </span>
                  </span>
                ))}
              </span>
            </h1>
          </div>
          <p
            className={clsx(styles.pron, styles.rise)}
            style={{ animationDelay: '560ms' }}
          >
            pronounced{' '}
            <button
              type="button"
              className={clsx(
                styles.say,
                replay(spoken, styles.sayA, styles.sayB)
              )}
              onClick={speak}
              aria-label="bee-stacks, play the pronunciation"
            >
              <span aria-hidden="true">
                {SPOKEN.map((letter, i) => (
                  <span
                    key={i}
                    className={styles.sayLetter}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {letter}
                  </span>
                ))}
              </span>
              <SpeakerIcon />
            </button>
          </p>
          <p
            className={clsx(styles.tagline, styles.rise)}
            style={{ animationDelay: '660ms' }}
          >
            The complete <span className={styles.accent}>React UI library</span>
            <br className={styles.taglineBreak} /> built on Bulma
          </p>
          <ul
            className={clsx(styles.features, styles.rise)}
            style={{ animationDelay: '760ms' }}
          >
            {FEATURE_LINKS.map(feature => (
              <li key={feature.label}>
                <Link
                  className={styles.feature}
                  to={feature.to}
                  onMouseEnter={lightUp(feature)}
                  onMouseLeave={lightDown(feature)}
                  onFocus={lightUp(feature)}
                  onBlur={lightDown(feature)}
                >
                  {feature.label}
                </Link>
              </li>
            ))}
          </ul>
          <InstallBox
            className={styles.rise}
            style={{ animationDelay: '860ms' }}
          />
          <div
            className={clsx(styles.ctas, styles.rise)}
            style={{ animationDelay: '960ms' }}
          >
            <Link
              className={clsx(styles.button, styles.buttonPrimary)}
              to="/docs/guides/intro"
            >
              Get Started
              <ArrowIcon />
            </Link>
            <a
              className={clsx(styles.button, styles.buttonGhost)}
              href="https://github.com/allxsmith/bestax"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
