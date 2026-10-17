import React, { createContext, forwardRef, useContext } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { flattenChildren } from '../helpers/flattenChildren';
import { visuallyHidden } from '../helpers/statusRegion';
import { withSubComponents } from '../helpers/withSubComponents';
import { Icon } from '../elements/Icon';

const validTimelineColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;
/** The Bulma colors a marker takes. */
export type TimelineColor = (typeof validTimelineColors)[number];

const validTimelineTitleElements = ['h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const;
/** What each item's title renders as: a heading level, or `p` for a plain line. */
export type TimelineTitleElement = (typeof validTimelineTitleElements)[number];

/** Where the rail goes. */
export type TimelineAlign = 'start' | 'end' | 'alternate';

/** Where an item is in a progress timeline. */
type TimelineState = 'completed' | 'active' | 'upcoming' | 'pending';

/**
 * What the root hands each of its items: the title's element, and in a
 * progress timeline, the item's state and the words read after its title.
 */
interface TimelineItemContextValue {
  titleAs: TimelineTitleElement;
  state?: TimelineState;
  label?: string;
}

// An item outside a Timeline is a record item with an h2 title.
const TimelineItemContext = createContext<TimelineItemContextValue>({
  titleAs: 'h2',
});

/** Whether a prop was given something to render. */
const isGiven = (node: React.ReactNode) =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';

const isTimelineColor = (color?: string): color is TimelineColor =>
  !!color && (validTimelineColors as readonly string[]).includes(color);

/**
 * Props for the Timeline component. The helper props, the other attributes
 * and the `ref` land on the `<ol>`.
 *
 * @extraProp {React.Ref<HTMLOListElement>} [ref] - Ref forwarded to the `<ol>`.
 */
export interface TimelineProps
  extends
    Omit<React.OlHTMLAttributes<HTMLOListElement>, 'color' | 'role'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * `Timeline.Item`s, in the order they're read: newest first or oldest
   * first for a record, oldest first with `active` or `pending`.
   */
  children?: React.ReactNode;
  /**
   * Marks progress. The item at this index, counting the children from 0, is
   * current; the ones before it are completed and the ones after it are
   * upcoming. Leave it out for a record, where nothing is marked. `-1` marks
   * every item upcoming, and an index past the last marks them all completed.
   * Each child counts as one item, with Fragments and arrays opened up, so
   * render one item per child. A component of your own around a
   * `Timeline.Item` still gets its state, but one that renders nothing still
   * counts.
   */
  active?: number;
  /**
   * What's under way, as a last item after the children: its title, read
   * with `pendingLabel`. Write it as words that say so ("Out for delivery").
   */
  pending?: React.ReactNode;
  /**
   * `start`: the rail at the start of the line. `end`: at the end, with the
   * text against it. `alternate`: down the middle, the items taking turns and
   * each time across the rail; below Bulma's tablet breakpoint it's `start`.
   */
  align?: TimelineAlign;
  /**
   * What every item's title renders as: a heading at the level under the
   * heading the timeline sits beneath, or `p` for a busy feed.
   */
  titleAs?: TimelineTitleElement;
  /**
   * The markers' color, and the color of progress with `active`. Neutral
   * without it, and Bulma's `link` for progress. The markers are hidden from
   * assistive tech, so say what a color means in the words too.
   */
  color?: TimelineColor;
  /** Read after a completed item's title, visually hidden. In your app's language. */
  completedLabel?: string;
  /** Read after an upcoming item's title, visually hidden. In your app's language. */
  upcomingLabel?: string;
  /** Read after the pending item's title, visually hidden. In your app's language. */
  pendingLabel?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for Timeline.Item, one event. The helper props, the other attributes
 * and the `ref` land on its `<li>`. The native `title` attribute isn't one of
 * them, since `title` here is the event's title.
 *
 * @extraProp {React.Ref<HTMLLIElement>} [ref] - Ref forwarded to the `<li>`.
 */
export interface TimelineItemProps
  extends
    Omit<React.LiHTMLAttributes<HTMLLIElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** What happened, in a line. It renders as the root's `titleAs`. */
  title?: React.ReactNode;
  /**
   * When it happened, as the reader sees it: "14 October 2026", "2 hours
   * ago". Put the whole date in the words, since screen readers mostly read
   * the text.
   */
  time?: React.ReactNode;
  /**
   * The same moment for machines, as HTML's `datetime` takes it:
   * "2026-10-14", "2026-10-14T08:12", "2026-10". With it, `time` renders in
   * a `<time>`. Keep it the same moment as `time`, since some readers speak it.
   */
  dateTime?: string;
  /**
   * A picture in the marker. A string is an `Icon` name, drawn from the icon
   * library `ConfigProvider` sets, and anything else renders as it is.
   * Without it, the marker is a dot. It's hidden from assistive tech, so
   * what it means goes in the title.
   */
  icon?: React.ReactNode;
  /** This item's marker color, over the root's. Say what it means in the words too. */
  color?: TimelineColor;
  /** Anything else about the event, under the title and the time, as written. */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * One event: a marker on the rail, then its title, its time and anything else about it.
 *
 * Outside a `Timeline` it's a record item with an `h2` title, though the
 * styles are registered on `.timeline`, so the rail and the marker need one.
 *
 * @function
 * @param {TimelineItemProps} props - Props for Timeline.Item.
 * @param {React.Ref<HTMLLIElement>} ref - Forwarded ref to the `<li>`.
 * @returns {JSX.Element} The rendered event.
 *
 * @example
 * <Timeline.Item title="Shipped" time="14 October 2026" dateTime="2026-10-14">
 *   Left the warehouse in Leeds.
 * </Timeline.Item>
 */
export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(
  (
    {
      className,
      title,
      time,
      dateTime,
      icon,
      color,
      textColor,
      bgColor,
      children,
      ...props
    },
    ref
  ) => {
    const { titleAs: TitleTag, state, label } = useContext(TimelineItemContext);
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const itemClass = usePrefixedClassNames('timeline-item', {
      [`is-${state}`]: !!state,
      [`is-${color}`]: isTimelineColor(color),
    });
    const markerClass = usePrefixedClassNames('timeline-marker', {
      'is-icon': isGiven(icon),
    });
    const contentClass = usePrefixedClassNames('timeline-content');
    const titleClass = usePrefixedClassNames('timeline-title');
    const timeClass = usePrefixedClassNames('timeline-time');

    // The state in words, read after the title so it's in the heading too:
    // "Packed completed". The current item has none, since aria-current
    // says it. The styles are inline, so the words stay hidden in a modular
    // build that leaves out Bulma's helper classes.
    const words = label ? (
      <span style={visuallyHidden}>{` ${label}`}</span>
    ) : null;

    return (
      <li
        ref={ref}
        className={classNames(itemClass, bulmaHelperClasses, className)}
        {...rest}
        // In a progress timeline the state decides, whatever was passed.
        {...(state && {
          'aria-current': state === 'active' ? 'step' : undefined,
        })}
      >
        {/* Decoration, hidden with whatever is in it, an Icon's own label
            included: the words say what a color, an icon or a state means. */}
        <div className={markerClass} aria-hidden="true">
          {isGiven(icon) &&
            (typeof icon === 'string' ? <Icon name={icon} /> : icon)}
        </div>
        <div className={contentClass}>
          {isGiven(title) ? (
            <TitleTag className={titleClass}>
              {title}
              {words}
            </TitleTag>
          ) : (
            words
          )}
          {isGiven(time) &&
            (dateTime ? (
              <time className={timeClass} dateTime={dateTime}>
                {time}
              </time>
            ) : (
              <span className={timeClass}>{time}</span>
            ))}
          {children}
        </div>
      </li>
    );
  }
);

TimelineItem.displayName = 'Timeline.Item';

/**
 * The `Timeline` component renders a list of events in the order they happened, each with a marker on a line down the side.
 *
 * By default it's a record, an order's history, a ticket's activity or a
 * changelog, and it marks nothing. With `active` it marks progress, for
 * something that moves along on its own and is reported to the user: a
 * parcel, a deployment, a claim. That reads oldest first, and `pending` ends
 * it on what's under way. A journey the user moves through themselves, like
 * a wizard or a checkout, is `Steps`.
 *
 * It's an `<ol role="list">`, so it stays a list in Safari with its numbers
 * hidden, and each title is a heading at the level `titleAs` sets. The
 * markers are decoration and hidden from assistive tech, so the states are
 * read as words: `aria-current="step"` on the current item, and "completed",
 * "upcoming" or "in progress" after the other titles, in the language the
 * label props set. Nothing here is a control or a live region, so a timeline
 * that changes on screen keeps a `role="status"` region beside it.
 *
 * @function
 * @param {TimelineProps} props - Props for the Timeline component.
 * @param {React.Ref<HTMLOListElement>} ref - Forwarded ref to the `<ol>`.
 * @returns {JSX.Element} The rendered timeline.
 *
 * @example
 * <Timeline titleAs="h3">
 *   <Timeline.Item title="Delivered" time="16 October 2026" dateTime="2026-10-16" />
 *   <Timeline.Item title="Order placed" time="12 October 2026" dateTime="2026-10-12" />
 * </Timeline>
 *
 * @example
 * <Timeline titleAs="h3" active={1} pending="Out for delivery">
 *   <Timeline.Item title="Order placed" />
 *   <Timeline.Item title="Shipped" />
 * </Timeline>
 */
const TimelineRoot = forwardRef<HTMLOListElement, TimelineProps>(
  (
    {
      className,
      children,
      active,
      pending,
      align = 'start',
      titleAs = 'h2',
      color,
      completedLabel = 'completed',
      upcomingLabel = 'upcoming',
      pendingLabel = 'in progress',
      textColor,
      bgColor,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const rootClass = usePrefixedClassNames('timeline', {
      'is-end': align === 'end',
      'is-alternate': align === 'alternate',
      [`is-${color}`]: isTimelineColor(color),
    });
    const level = validTimelineTitleElements.includes(titleAs) ? titleAs : 'h2';
    const labels: Record<TimelineState, string | undefined> = {
      completed: completedLabel,
      active: undefined,
      upcoming: upcomingLabel,
      pending: pendingLabel,
    };
    const contextFor = (state?: TimelineState) => ({
      titleAs: level,
      state,
      label: state && labels[state],
    });
    const stateAt = (index: number): TimelineState | undefined => {
      if (typeof active !== 'number') return undefined;
      if (index === active) return 'active';
      return index < active ? 'completed' : 'upcoming';
    };

    // Each child gets its state through context rather than a clone, so an
    // app's own component around a Timeline.Item still gets it. Fragments
    // and arrays are opened up first, so each item inside one counts.
    return (
      <ol
        ref={ref}
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
        role="list"
      >
        {flattenChildren(children).map((child, index) => (
          <TimelineItemContext.Provider
            key={React.isValidElement(child) ? child.key : index}
            value={contextFor(stateAt(index))}
          >
            {child}
          </TimelineItemContext.Provider>
        ))}
        {isGiven(pending) && (
          <TimelineItemContext.Provider value={contextFor('pending')}>
            <TimelineItem title={pending} />
          </TimelineItemContext.Provider>
        )}
      </ol>
    );
  }
);

export const Timeline = withSubComponents(
  TimelineRoot,
  { Item: TimelineItem },
  'Timeline'
);

export default Timeline;
