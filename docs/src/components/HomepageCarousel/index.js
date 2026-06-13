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
    padding: 1.5rem 2rem 2rem;
    min-height: 420px;
    margin: 0;
  }
  .homepage-slide-demo {
    max-height: 460px;
    overflow: visible;
  }
  @media screen and (max-width: 768px) {
    .homepage-slide {
      padding: 1rem 1rem 2rem;
    }
  }
`;

function CarouselSlides({ slides, autoplay, interval, hasDrag }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <ShadowPreview extraStyles={SLIDE_CSS}>
      <Carousel
        autoplay={autoplay}
        interval={interval}
        pauseOnHover
        arrow={false}
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

  return (
    <section
      ref={sectionRef}
      className={clsx(styles.carouselSection, alt && styles.alt)}
    >
      <div className="container">
        <Heading as="h2" className={styles.heading}>
          {heading}
        </Heading>
        <p className={styles.intro}>{intro}</p>
        <BrowserOnly fallback={<div className={styles.fallback} />}>
          {() => (
            <CarouselSlides
              slides={slides}
              autoplay={autoplay && inView}
              interval={interval}
              hasDrag={hasDrag}
            />
          )}
        </BrowserOnly>
      </div>
    </section>
  );
}
