import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Heading from '@theme/Heading';
import { Box, Title, Input, Button } from '@allxsmith/bestax-bulma';
import ShadowPreview from '@site/src/components/ShadowPreview';
import PickerDemo from '@site/src/components/HomepageCarousel/PickerDemo';
import { CalendarIcon, ClockIcon, CalendarClockIcon } from './icons';
import styles from './styles.module.css';

const PICKERS = {
  date: {
    name: 'DateInput',
    icon: CalendarIcon,
    desc: 'A calendar picker with bounds, disabled-date rules, and locale-aware names.',
    link: '/docs/api/form/datetime/dateinput',
    label: 'Appointment date',
    panelHeight: 720,
  },
  time: {
    name: 'TimeInput',
    icon: ClockIcon,
    desc: 'Scrolling hour, minute, and second wheels with 12- or 24-hour clocks.',
    link: '/docs/api/form/datetime/timeinput',
    label: 'Appointment time',
    panelHeight: 560,
  },
  datetime: {
    name: 'DateTimeInput',
    icon: CalendarClockIcon,
    desc: 'Calendar and time wheels combined — pick a date and a time in one control.',
    link: '/docs/api/form/datetime/datetimeinput',
    label: 'Appointment date & time',
    panelHeight: 740,
  },
};

const ORDER = ['date', 'time', 'datetime'];

// Rendered inside the shadow root.
const FORM_CSS = `
  .booking-form {
    width: 100%;
  }
  .booking-form .field:not(:last-child) {
    margin-bottom: 1rem;
  }
`;

function BookingForm({ selected, inView }) {
  const picker = PICKERS[selected];
  return (
    <ShadowPreview extraStyles={FORM_CSS}>
      <Box className="booking-form">
        <Title size="5">Reserve a session</Title>
        <Input label="Full name" value="Ada Lovelace" readOnly />
        <Input label="Email" type="email" value="ada@bestax.dev" readOnly />
        <PickerDemo
          key={selected}
          kind={selected}
          active={inView}
          label={picker.label}
        />
        <div className="mt-4">
          <Button color="primary">Reserve</Button>
        </div>
      </Box>
    </ShadowPreview>
  );
}

export default function PickerShowcase() {
  const [selected, setSelected] = useState('date');
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  // Only auto-play the demo once the section scrolls into view.
  useEffect(() => {
    if (!sectionRef.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const active = PICKERS[selected];

  return (
    <section ref={sectionRef} className={clsx(styles.section, styles.alt)}>
      <div className="container">
        <Heading as="h2" className={styles.heading}>
          Date &amp; Time Pickers
        </Heading>
        <p className={styles.intro}>
          Three pickers, one consistent API. Pick a tile to drop it into a real
          form and watch it fill itself in — then hover to try it yourself.
        </p>
        <div className={styles.layout}>
          <div className={styles.tiles}>
            {ORDER.map(key => {
              const picker = PICKERS[key];
              const Icon = picker.icon;
              return (
                <button
                  key={key}
                  type="button"
                  className={clsx(
                    styles.tile,
                    key === selected && styles.tileActive
                  )}
                  onClick={() => setSelected(key)}
                  aria-pressed={key === selected}
                >
                  <span className={styles.iconChip}>
                    <Icon />
                  </span>
                  <span className={styles.tileBody}>
                    <span className={styles.tileTitle}>{picker.name}</span>
                    <span className={styles.tileDesc}>{picker.desc}</span>
                  </span>
                </button>
              );
            })}
            <Link className={styles.docsLink} to={active.link}>
              Read the {active.name} docs →
            </Link>
          </div>
          <div
            className={styles.formPanel}
            style={{ minHeight: active.panelHeight }}
          >
            <BrowserOnly fallback={<div className={styles.fallback} />}>
              {() => <BookingForm selected={selected} inView={inView} />}
            </BrowserOnly>
          </div>
        </div>
      </div>
    </section>
  );
}
