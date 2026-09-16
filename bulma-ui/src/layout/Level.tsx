import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  type AnchorOnlyAttributes,
  ANCHOR_ONLY_ATTRS,
  omitAttrs,
} from '../helpers/anchorAttrs';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Level component.
 */
export interface LevelProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Keeps the level horizontal on mobile (Bulma `is-mobile`). Without it
   * the level stacks vertically below tablet. */
  isMobile?: boolean;
  /** Bulma color modifier for the level. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Level content (`Level.Left`, `Level.Right`, `Level.Item`). */
  children?: React.ReactNode;
}

/**
 * The `Level` component provides a flexible horizontal layout for your Bulma React UI, perfect for aligning items on the left and right, distributing items evenly, or centering statistics and controls.
 *
 * @function
 * @param {LevelProps} props - Props for the Level component.
 * @returns {JSX.Element} The rendered level.
 * @see {@link https://bulma.io/documentation/layout/level/ | Bulma Level documentation}
 */
const LevelComponent: React.FC<LevelProps> = ({
  isMobile,
  className,
  children,
  color,
  bgColor,
  textColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const mainClass = usePrefixedClassNames('level', {
    'is-mobile': isMobile,
  });
  const levelClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <nav className={levelClasses} {...rest}>
      {children}
    </nav>
  );
};

/**
 * Props for the LevelLeft component.
 */
export interface LevelLeftProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Left-aligned content.
 *
 * @function
 * @param {LevelLeftProps} props - Props for the LevelLeft component.
 * @returns {JSX.Element} The rendered level left section.
 */
export const LevelLeft: React.FC<LevelLeftProps> = ({
  className,
  children,
  color,
  bgColor,
  textColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const mainClass = usePrefixedClassNames('level-left');
  const levelLeftClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div className={levelLeftClasses} {...rest}>
      {children}
    </div>
  );
};

/**
 * Props for the LevelRight component.
 */
export interface LevelRightProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Right-aligned content.
 *
 * @function
 * @param {LevelRightProps} props - Props for the LevelRight component.
 * @returns {JSX.Element} The rendered level right section.
 */
export const LevelRight: React.FC<LevelRightProps> = ({
  className,
  children,
  color,
  bgColor,
  textColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const mainClass = usePrefixedClassNames('level-right');
  const levelRightClasses = classNames(
    mainClass,
    bulmaHelperClasses,
    className
  );
  return (
    <div className={levelRightClasses} {...rest}>
      {children}
    </div>
  );
};

/** The derived set plus `rel`; see the note in the render body. */
const STRIP_FROM_NON_ANCHOR: Readonly<
  Record<keyof AnchorOnlyAttributes | 'rel', true>
> = { ...ANCHOR_ONLY_ATTRS, rel: true };

/**
 * Props for the LevelItem component.
 *
 * The anchor attributes arrive through `AnchorOnlyAttributes`, at every `as`, and
 * are forwarded only when the tag is an `<a>` — so `<Level.Item as="p" download>` compiles and
 * renders a `<p>` without it. That asymmetry is deliberate for now: deriving
 * them from `as` instead is what makes the dead pair a type error, and it also
 * stops `const p: LevelItemProps = { href }` compiling for consumers who write
 * it today. #672 carries that half, labelled `next-major`.
 *
 * What that set must NOT become is a hand-written list. Enumerating only `href`,
 * `target` and `rel` made every other anchor attribute a type error even at
 * `as="a"`, which is what #641 reported; `helpers/anchorAttrs.ts` derives it from
 * React instead, and `ANCHOR_ONLY_ATTRS` there is the guard to protect.
 */
export interface LevelItemProps
  extends
    AnchorOnlyAttributes,
    React.HTMLAttributes<
      HTMLDivElement | HTMLParagraphElement | HTMLAnchorElement
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Element type to render. */
  as?: 'div' | 'p' | 'a';
  /** Center the text in the item. */
  hasTextCentered?: boolean;
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Individual item, can be rendered as `div`, `p`, or `a`.
 *
 * @function
 * @param {LevelItemProps} props - Props for the LevelItem component.
 * @returns {JSX.Element} The rendered level item.
 */
export const LevelItem: React.FC<LevelItemProps> = ({
  as = 'div',
  hasTextCentered,
  className,
  children,
  color,
  bgColor,
  textColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const Tag = as;

  const mainClass = usePrefixedClassNames('level-item', {
    'has-text-centered': hasTextCentered,
  });
  const levelItemClasses = classNames(mainClass, bulmaHelperClasses, className);

  // The anchor's own attributes reach an `<a>` and nothing else. The type
  // declares them at every `as` — narrowing that is source-breaking (#672) — so
  // the runtime is what keeps `<Level.Item as="p" download>` from rendering a
  // dead attribute.
  //
  // The derived set plus `rel`. `rel` is not an anchor-only attribute — React
  // declares it on every element — but this component has always withheld it
  // from a non-anchor, so it is named separately rather than folded in, and
  // that separation is what says which names come from where. The annotation is
  // what holds it: without it a typo adds a key nobody strips.

  if (Tag === 'a') {
    return (
      <a className={levelItemClasses} {...rest}>
        {children}
      </a>
    );
  }

  const withoutAnchorAttrs = omitAttrs(rest, STRIP_FROM_NON_ANCHOR);

  return (
    <Tag className={levelItemClasses} {...withoutAnchorAttrs}>
      {children}
    </Tag>
  );
};

export const Level = withSubComponents(
  LevelComponent,
  {
    Left: LevelLeft,
    Right: LevelRight,
    Item: LevelItem,
  },
  'Level'
);

export default Level;
