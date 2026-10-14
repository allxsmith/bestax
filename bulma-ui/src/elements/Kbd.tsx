import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { flattenChildren } from '../helpers/flattenChildren';
import { visuallyHidden } from '../helpers/statusRegion';
import { withSubComponents } from '../helpers/withSubComponents';

/**
 * Props for the Kbd component. The helper props, the other attributes and
 * the `ref` land on the `<kbd>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<kbd>`.
 */
export interface KbdProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The key as it's printed on the keyboard: a word (`Ctrl`, `Esc`), a
   * letter, or a symbol (`⌘`).
   */
  children?: React.ReactNode;
  /**
   * What a screen reader says in place of a symbol, in your app's language:
   * `label="Command"` on `⌘`. The symbol is hidden from assistive tech with
   * `aria-hidden`, and the label is read in its place, from text that's
   * visually hidden. Use it for a glyph that isn't a word, such as `⌘`, `⌥`,
   * `⇧`, `⌃` or `⏎`, and leave it off a key written as a word. Copying the
   * key copies the label along with the glyph. Don't reach for `aria-label`
   * instead: ARIA in HTML prohibits naming a `<kbd>`, so nothing obliges a
   * screen reader to read it.
   */
  label?: string;
  /**
   * Text color helper. The key's edge and fill are mixed from its text
   * color, so they follow it.
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. It replaces the key's faint fill. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for Kbd.Group, keys pressed together or one after another. The
 * group renders the outer `<kbd>` of a combination, and the helper props,
 * the other attributes and the `ref` land on it.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the outer `<kbd>`.
 */
export interface KbdGroupProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The keys, a `Kbd` each, in the order they're pressed. The group renders
   * the outer `<kbd>` around them, so it doesn't go inside a `Kbd` of its
   * own, and it puts the separator between them, so don't type one: a `+`
   * of your own doubles up. A child that renders nothing (`null`, `false`)
   * gets no separator.
   */
  children?: React.ReactNode;
  /**
   * What goes between the keys, shown and read aloud, with a space either
   * side. Use `'then'` for a sequence pressed one key after another. It's a
   * string because a screen reader has to read it.
   */
  separator?: string;
  /** Text color helper. The keys and separators inside follow it. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Keys pressed together or one after another, in the outer `<kbd>` HTML gives a combination, with the separator between each pair as text.
 *
 * It doesn't wrap in the middle and isn't drawn as a key itself. It sets no
 * font size, so the keys in it are the size of a key on its own.
 *
 * @function
 * @param {KbdGroupProps} props - Props for Kbd.Group.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the outer `<kbd>`.
 * @returns {JSX.Element} The rendered combination.
 *
 * @example
 * <Kbd.Group>
 *   <Kbd>Ctrl</Kbd>
 *   <Kbd>Shift</Kbd>
 *   <Kbd>P</Kbd>
 * </Kbd.Group>
 *
 * @example
 * <Kbd.Group separator="then">
 *   <Kbd>G</Kbd>
 *   <Kbd>I</Kbd>
 * </Kbd.Group>
 */
export const KbdGroup = forwardRef<HTMLElement, KbdGroupProps>(
  ({ className, textColor, separator = '+', children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });
    const groupClass = usePrefixedClassNames('kbd-group');
    const separatorClass = usePrefixedClassNames('kbd-separator');

    // Null, undefined and booleans drop out, and Fragments are opened up, so
    // an empty Fragment leaves no separator behind and the keys in one are
    // separated like the rest. The spaces are part of the text, so a screen
    // reader reads "Ctrl plus S" rather than one run-together word, whatever
    // the CSS does.
    const keys = flattenChildren(children);

    return (
      <kbd
        ref={ref}
        className={classNames(groupClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {keys.map((key, index) => (
          // Each wrapper takes its child's own React key, so a child that
          // moves keeps its node. Text has none, so it goes by its place.
          <React.Fragment
            key={React.isValidElement(key) && key.key != null ? key.key : index}
          >
            {index > 0 && (
              <span className={separatorClass}>{` ${separator} `}</span>
            )}
            {key}
          </React.Fragment>
        ))}
      </kbd>
    );
  }
);

KbdGroup.displayName = 'Kbd.Group';

/**
 * The `Kbd` component renders a `<kbd>` drawn as a keycap, for a key the reader presses.
 *
 * It only shows the key: it doesn't listen for it. The key takes its colors
 * from the text it sits in, and its size in `em`, so it fits a paragraph, a
 * title or a filled button as it is, and `textSize` sizes it outright. For a
 * combination or a sequence, put the keys in a `Kbd.Group`. What tells
 * assistive tech a control has a shortcut is `aria-keyshortcuts` on that
 * control, with `Kbd` as the hint people see next to it.
 *
 * @function
 * @param {KbdProps} props - Props for the Kbd component.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<kbd>`.
 * @returns {JSX.Element} The rendered key.
 *
 * @example
 * <Kbd>Esc</Kbd>
 *
 * @example
 * <Kbd label="Command">⌘</Kbd>
 */
const KbdRoot = forwardRef<HTMLElement, KbdProps>(
  ({ className, textColor, bgColor, label, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const kbdClass = usePrefixedClassNames('kbd');

    // The name is text rather than an aria-label, which ARIA in HTML
    // prohibits on kbd. Its styles are inline, so it stays hidden in a
    // modular build that leaves out Bulma's helper classes.
    return (
      <kbd
        ref={ref}
        className={classNames(kbdClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {label ? (
          <>
            <span aria-hidden="true">{children}</span>
            <span style={visuallyHidden}>{label}</span>
          </>
        ) : (
          children
        )}
      </kbd>
    );
  }
);

export const Kbd = withSubComponents(KbdRoot, { Group: KbdGroup }, 'Kbd');

export default Kbd;
