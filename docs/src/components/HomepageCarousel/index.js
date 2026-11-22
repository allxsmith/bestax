import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Heading from '@theme/Heading';
import {
  Carousel,
  CarouselItem,
  Columns,
  Column,
  Title,
  Content,
} from '@allxsmith/bestax-bulma';
import ShadowPreview from '@site/src/components/ShadowPreview';
import { SlideShowStoppedContext } from './useDemoLoop';
import styles from './styles.module.css';

const SLIDE_CSS = `
  .homepage-slide {
    padding: 1.5rem var(--homepage-slide-x-padding, 2rem) 2rem;
    min-height: var(--homepage-slide-min-height, 420px);
    margin: 0;
  }
  .homepage-slide-demo {
    max-height: var(--homepage-slide-demo-max-height, 460px);
    overflow: visible;
  }
  @media screen and (max-width: 768px) {
    .homepage-slide {
      padding: 1rem var(--homepage-slide-x-padding-mobile, 1rem) 2rem;
    }
  }
  .homepage-carousel {
    position: relative;
  }
  /* The rotation control, drawn like the carousel's arrows, in the corner
     above the previous one. */
  .homepage-carousel .homepage-rotation.button {
    position: absolute;
    top: 1rem;
    inset-inline-start: 1rem;
    z-index: 11;
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: var(--bulma-radius);
    background-color: hsla(
      var(--bulma-scheme-h),
      var(--bulma-scheme-s),
      var(--bulma-scheme-main-l),
      0.8
    );
    color: var(--bulma-text);
    transition:
      background-color var(--bulma-duration),
      transform var(--bulma-duration);
  }
  .homepage-carousel .homepage-rotation.button:hover {
    background-color: hsla(
      var(--bulma-scheme-h),
      var(--bulma-scheme-s),
      var(--bulma-scheme-main-l),
      0.95
    );
    transform: scale(1.05);
  }
  @media (prefers-reduced-motion: reduce) {
    .homepage-carousel .homepage-rotation.button {
      transition: none;
    }
  }
  .homepage-rotation svg {
    width: 24px;
    height: 24px;
  }
  @media screen and (max-width: 768px) {
    .homepage-carousel .homepage-rotation.button {
      top: 0.5rem;
      inset-inline-start: 0.5rem;
      width: 36px;
      height: 36px;
    }
    .homepage-rotation svg {
      width: 18px;
      height: 18px;
    }
  }
`;

// Feather's pause and play glyphs, in the stroke the arrows' chevrons use.
const PauseGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);
const PlayGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

function CarouselSlides({
  label,
  slides,
  autoplay,
  rotates,
  interval,
  hasDrag,
  arrow,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  // The rotation control stops the slides and the demos in them until it's
  // pressed again (#2206). Rotation also holds while the pointer is over the
  // slides or focus is in them, which the Carousel does for focus itself. The
  // control isn't part of that, so pressing Start starts the slides at once.
  const [stopped, setStopped] = useState(false);
  // The Carousel's own hover pause misses a pointer that comes into the
  // shadow root from outside (#2309), so the bubbling over and out events
  // hold it here.
  const [hovered, setHovered] = useState(false);

  return (
    <ShadowPreview extraStyles={SLIDE_CSS}>
      <div className="homepage-carousel">
        {/* First in the carousel's tab order. Its name says what pressing it
            does, so it changes with the state rather than taking a pressed
            state of its own. */}
        {rotates && (
          <button
            type="button"
            className="button homepage-rotation"
            aria-label={
              stopped
                ? 'Start automatic slide show'
                : 'Stop automatic slide show'
            }
            onClick={() => setStopped(was => !was)}
          >
            {stopped ? <PlayGlyph /> : <PauseGlyph />}
          </button>
        )}
        <SlideShowStoppedContext.Provider value={stopped}>
          <div
            onPointerOver={() => setHovered(true)}
            onPointerOut={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setHovered(false);
              }
            }}
          >
            {/* Named with the heading's text, since the carousel renders in a
          shadow root, where aria-labelledby can't reach the heading */}
            <Carousel
              ariaLabel={label}
              autoplay={autoplay && !stopped && !hovered}
              interval={interval}
              pauseOnHover
              arrow={arrow}
              indicator={false}
              hasDrag={hasDrag}
              repeat
              onChange={setActiveIndex}
            >
              {slides.map((slide, i) => (
                <CarouselItem key={slide.key}>
                  <Columns isVCentered className="homepage-slide">
                    <Column size="two-fifths" className="homepage-slide-text">
                      <Title size="3">{slide.title}</Title>
                      <Content>
                        <p>{slide.description}</p>
                      </Content>
                      <Link className="button is-primary" to={slide.link}>
                        {slide.linkLabel}
                      </Link>
                    </Column>
                    <Column className="homepage-slide-demo">
                      {typeof slide.demo === 'function'
                        ? slide.demo({ active: i === activeIndex })
                        : slide.demo}
                    </Column>
                  </Columns>
                </CarouselItem>
              ))}
            </Carousel>
          </div>
        </SlideShowStoppedContext.Provider>
      </div>
    </ShadowPreview>
  );
}

/**
 * Homepage section embedding a bestax-bulma Carousel inside a shadow root,
 * with one live component demo per slide (wording left, component right).
 */
export default function HomepageCarousel({
  heading,
  intro,
  slides,
  autoplay = true,
  interval = 7000,
  hasDrag = true,
  arrow = false,
  slideMinHeight,
  alt = false,
}) {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  // Hold the autoplay timer until the section scrolls into view, so the
  // first slide's demo doesn't play out while nobody is looking.
  useEffect(() => {
    if (!sectionRef.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Custom properties inherit through the shadow boundary, so setting these
  // here cascades into the live demos inside ShadowPreview.
  const sectionVars = {};
  if (slideMinHeight) {
    sectionVars['--homepage-slide-min-height'] = slideMinHeight;
    sectionVars['--homepage-slide-demo-max-height'] = slideMinHeight;
  }
  // The arrows are 48px wide at a 1rem offset, so the slide needs wider side
  // padding to keep them from overlapping the slide content.
  if (arrow) {
    sectionVars['--homepage-slide-x-padding'] = '5rem';
    sectionVars['--homepage-slide-x-padding-mobile'] = '3.25rem';
  }
  const sectionStyle = Object.keys(sectionVars).length
    ? sectionVars
    : undefined;

  return (
    <section
      ref={sectionRef}
      className={clsx(styles.carouselSection, alt && styles.alt)}
      style={sectionStyle}
    >
      <div className="container">
        <Heading as="h2" className={styles.heading}>
          {heading}
        </Heading>
        <p className={styles.intro}>{intro}</p>
        <BrowserOnly
          fallback={
            <div
              className={styles.fallback}
              style={slideMinHeight ? { minHeight: slideMinHeight } : undefined}
            />
          }
        >
          {() => (
            <CarouselSlides
              label={heading}
              slides={slides}
              autoplay={autoplay && inView}
              rotates={autoplay}
              interval={interval}
              hasDrag={hasDrag}
              arrow={arrow}
            />
          )}
        </BrowserOnly>
      </div>
    </section>
  );
}
