import React, { forwardRef, useEffect } from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import { useClassPrefix } from '../helpers/Config';
import { useNumberFormat } from '../helpers/localeFormat';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { warnOnce } from '../helpers/devWarnings';

const validRingProgressColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
] as const;
/** The Bulma colors an arc takes, the ones `Progress` takes. */
export type RingProgressColor = (typeof validRingProgressColors)[number];

const validRingProgressSizes = ['small', 'medium', 'large'] as const;

/** One colored part of a ring drawn in sections. */
export interface RingProgressSection {
  /** Its size, in the same units as the ring's `max`. */
  value: number;
  /** Its color. Without one, it takes the ring's. */
  color?: RingProgressColor;
  /** What it is, such as "Photos", read in the ring's name with its share. */
  label: string;
}

/**
 * Props for the RingProgress component. The helper props, the other
 * attributes and the `ref` land on its root `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root `<div>`.
 * @extraProp {string} [aria-labelledby] - The id of a visible heading that names the ring, in place of `label`. With `sections`, use `label`, since a name from here replaces the one that lists the values.
 * @extraProp {string} [aria-valuetext] - What a screen reader says for the value, such as "7 of 10 tasks". Without it, the value is read as a percentage.
 */
export interface RingProgressProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'role'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * How far along it is, from 0 to `max`. Values outside that range are
   * drawn, and read, at the nearest end. Ignored with `sections`.
   */
  value?: number;
  /** The value that fills the ring. */
  max?: number;
  /**
   * Several values around one ring, in order clockwise from the top, each
   * with its own color and label. The ring is then an image whose name
   * writes them out, such as "Storage: Documents 40%, Photos 15%", since a
   * screen reader can't take several values from one element. Inside a
   * `LocaleProvider` with a `locale`, the shares are written as that locale
   * writes a percentage. A total over `max` fills the ring and stops.
   */
  sections?: RingProgressSection[];
  /**
   * What it shows, such as "Upload" or "Storage". It names the ring, so it's
   * read with the value. A development build warns when the ring has no
   * name.
   */
  label?: string;
  /**
   * A level within a range, such as storage used or a score, rather than a
   * task moving toward done: `role="meter"` in place of `role="progressbar"`.
   * Ignored with `sections`.
   */
  isMeter?: boolean;
  /** The arc's color, and the color of sections without one. */
  color?: RingProgressColor;
  /** The ring's size. */
  size?: (typeof validRingProgressSizes)[number];
  /** Rounds the ends of the arc. */
  isRounded?: boolean;
  /**
   * What sits in the middle of the ring, such as the value as text. It's
   * hidden from assistive tech, which reads the value from the ring itself,
   * so the value isn't heard twice. Say anything more, such as "7 of 10
   * tasks", in `aria-valuetext`.
   */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/** An arc's place on the ring, in percent of the way round. */
interface Arc {
  start: number;
  length: number;
  color?: RingProgressColor;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/**
 * The `RingProgress` component draws a value as a ring that fills as it grows, with anything you pass shown in the middle.
 *
 * It's a `progressbar` for a task moving toward done, or a `meter` with
 * `isMeter` for a level within a range, named by `label`. With `sections`
 * it draws several values around one ring and is an image whose name lists
 * them. It has no state for work with no value: that's `Loader`.
 *
 * @function
 * @param {RingProgressProps} props - Props for the RingProgress component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the root `<div>`.
 * @returns {JSX.Element} The rendered ring.
 *
 * @example
 * <RingProgress value={72} label="Upload" color="success">
 *   72%
 * </RingProgress>
 */
export const RingProgress = forwardRef<HTMLDivElement, RingProgressProps>(
  (
    {
      className,
      textColor,
      bgColor,
      value,
      max = 100,
      sections,
      label,
      isMeter,
      color,
      size,
      isRounded,
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });

    const named = Boolean(
      label || rest['aria-label'] || rest['aria-labelledby']
    );
    const mixed = sections !== undefined && value !== undefined;
    useEffect(() => {
      if (!named) {
        warnOnce(
          'RingProgress:unnamed',
          '[bestax-bulma] <RingProgress> has no accessible name. Pass ' +
            'label, so a screen reader can say what the ring shows.'
        );
      }
      if (mixed) {
        warnOnce(
          'RingProgress:value-and-sections',
          '[bestax-bulma] <RingProgress> was given both value and sections. ' +
            'It draws the sections and ignores value.'
        );
      }
    }, [named, mixed]);

    const total = max > 0 ? max : 100;
    const share = (part: number) => (clamp(part, 0, total) / total) * 100;

    // Each arc starts where the one before ended, and the last stops at the
    // top, so a total over max fills the ring and no more.
    const arcs: Arc[] = [];
    if (sections) {
      let start = 0;
      for (const section of sections) {
        const length = Math.min(share(section.value), 100 - start);
        arcs.push({ start, length, color: section.color });
        start += length;
      }
    } else {
      arcs.push({ start: 0, length: share(value ?? 0) });
    }

    const rootClass = usePrefixedClassNames('ring-progress', {
      [`is-${size}`]:
        !!size && (validRingProgressSizes as readonly string[]).includes(size),
      [`is-${color}`]:
        !!color &&
        (validRingProgressColors as readonly string[]).includes(color),
      'is-rounded': !!isRounded,
      'has-sections': !!sections,
    });
    const ringClass = usePrefixedClassNames('ring-progress-ring');
    const trackClass = usePrefixedClassNames('ring-progress-track');
    const arcClass = usePrefixedClassNames('ring-progress-arc');
    const labelClass = usePrefixedClassNames('ring-progress-label');
    // A section's color class, prefixed like the rest.
    const classPrefix = useClassPrefix();
    const formatNumber = useNumberFormat();
    const writeShare = (share: number) =>
      formatNumber
        ? formatNumber(share / 100, { style: 'percent' })
        : `${share}%`;

    const roleProps = sections
      ? {
          role: 'img',
          'aria-label': [
            label || rest['aria-label'],
            sections
              .map(
                (section, i) =>
                  `${section.label} ${writeShare(Math.round(arcs[i].length))}`
              )
              .join(', '),
          ]
            .filter(Boolean)
            .join(': '),
        }
      : {
          role: isMeter ? 'meter' : 'progressbar',
          'aria-valuenow': clamp(value ?? 0, 0, total),
          'aria-valuemin': 0,
          'aria-valuemax': total,
          'aria-label': label || rest['aria-label'],
        };

    return (
      <div
        ref={ref}
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
        {...roleProps}
      >
        <svg className={ringClass} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={trackClass} cx="50" cy="50" r="42" />
          {arcs.map(
            (arc, i) =>
              arc.length > 0 && (
                <circle
                  key={i}
                  className={classNames(
                    arcClass,
                    arc.color &&
                      (validRingProgressColors as readonly string[]).includes(
                        arc.color
                      ) &&
                      prefixedClassNames(classPrefix, `is-${arc.color}`)
                  )}
                  cx="50"
                  cy="50"
                  r="42"
                  pathLength={100}
                  style={
                    {
                      '--ring-progress-length': arc.length,
                      '--ring-progress-start': arc.start,
                    } as React.CSSProperties
                  }
                />
              )
          )}
        </svg>
        {children !== undefined && children !== null && (
          // The ring's value is already read from its role, and not every
          // browser keeps a meter's content out of the tree, so the middle
          // is for the eye only.
          <div className={labelClass} aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    );
  }
);

RingProgress.displayName = 'RingProgress';

export default RingProgress;
