import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { useEffect, useRef, useState } from 'react';

const FeatureList = [
  {
    title: 'Latest Bulma V1',
    Svg: require('@site/static/img/card/iconmonstr-synchronization-19.svg')
      .default,
    description: (
      <>
        Fully supports Bulma v1.x, unlike outdated alternatives stuck on older
        versions. Enjoy the newest features, improvements, and compatibility
        without compromises.
      </>
    ),
  },
  {
    title: 'Lightweight and Efficient',
    Svg: require('@site/static/img/card/iconmonstr-connection-2.svg').default,
    description: (
      <>
        Ultra-lightweight: Only 21KB gzipped. 3-20x smaller than most React UI
        libraries. Zero external dependencies: Clean installs, reduced bundle
        size, and fewer security concerns.
      </>
    ),
  },
  {
    title: 'Developer-Friendly',
    Svg: require('@site/static/img/card/iconmonstr-party-19.svg').default,
    description: (
      <>
        100% TypeScript, 99% unit test coverage: Reliable, stable components you
        can trust. 100% Bulma implementation: Access every Bulma element,
        layout, and component as native React pieces.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only animate once
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the section is visible
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before it's fully in view
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={clsx(styles.features, { [styles.visible]: isVisible })}
    >
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
