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
`;

function CarouselSlides({ slides, autoplay, interval, hasDrag, arrow }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <ShadowPreview extraStyles={SLIDE_CSS}>
      <Carousel
        autoplay={autoplay}
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
              slides={slides}
              autoplay={autoplay && inView}
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
