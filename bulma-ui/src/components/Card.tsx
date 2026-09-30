import React from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  type AnchorOnlyAttributes,
  ANCHOR_ONLY_ATTRS,
  omitAttrs,
} from '../helpers/anchorAttrs';
import { buttonType } from '../helpers/buttonType';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
  validSchemeColors,
} from '../helpers/useBulmaClasses';
import { mergeBulmaStyles } from '../helpers/mergeBulmaStyles';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Card component.
 * @extraProp {'centered' | 'justified' | 'left' | 'right'} [textAlign] - Text alignment.
 */
export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color for the card. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled card variant (no `.card.is-<color>` CSS exists). Prefer
   * `textColor`, which takes precedence when both are set; use `bgColor` for
   * a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /**
   * Background color for the card. `scheme-*` values render as a
   * dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead
   * of a class. The `scheme-invert*` values do not change text color — pair
   * them with a contrasting foreground.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
  /** Whether the card has a shadow (default: `true`). */
  hasShadow?: boolean;
  /** Card header content, rendered inside `.card-header-title`. */
  header?: React.ReactNode;
  /** If true, centers the header title. */
  headerCentered?: boolean;
  /** Card header icon, rendered as a sibling to the header title. */
  headerIcon?: React.ReactNode;
  /** Card footer content; each item is wrapped in `.card-footer-item`. */
  footer?: React.ReactNode | React.ReactNode[];
  /** Card image node or image src string. */
  image?: React.ReactNode | string;
  /** Alternate text for the card image. */
  imageAlt?: string;
  /** Card content (body). */
  children?: React.ReactNode;
}

/**
 * Check if children contain any Card compound sub-components.
 * @param {React.ReactNode} children - The children to inspect.
 * @returns {boolean} True if any child is a Card compound component.
 */
const hasCompoundComponents = (children: React.ReactNode): boolean => {
  return React.Children.toArray(children).some(child => {
    if (!React.isValidElement(child)) return false;

    // Direct comparison with our compound component functions
    return (
      child.type === CardHeader ||
      child.type === CardContent ||
      child.type === CardImage ||
      child.type === CardFooter ||
      child.type === CardFooterItem ||
      child.type === CardHeaderIcon
    );
  });
};

/**
 * The `Card` component renders a Bulma-styled card with optional header, image, content, and footer.
 *
 * @function
 * @param {CardProps} props - Props for the Card component.
 * @returns {JSX.Element} The rendered card element.
 * @see {@link https://bulma.io/documentation/components/card/ | Bulma Card documentation}
 */
const CardComponent: React.FC<CardProps> = ({
  className,
  children,
  textColor,
  color,
  bgColor,
  hasShadow = true,
  header,
  headerCentered,
  headerIcon,
  footer,
  image,
  imageAlt,
  style,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('card', {
    'is-shadowless': !hasShadow,
  });

  // Combine prefixed Bulma classes with unprefixed user className and prefixed helper classes
  const cardClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  // Render header with optional icon and is-centered modifier
  const renderHeader = (
    header: React.ReactNode,
    headerIcon: React.ReactNode,
    headerCentered: boolean | undefined,
    classPrefix: string | undefined
  ) => {
    if (!header && !headerIcon) return null;
    return (
      <header className={prefixedClassNames(classPrefix, 'card-header')}>
        {header && (
          <div
            className={prefixedClassNames(classPrefix, 'card-header-title', {
              'is-centered': headerCentered,
            })}
          >
            {header}
          </div>
        )}
        {headerIcon}
      </header>
    );
  };

  // Any falsy footer (including `0`) and an empty array render no footer bar,
  // rather than a stray `0` or an empty `.card-footer`.
  const hasFooter = Array.isArray(footer) ? footer.length > 0 : Boolean(footer);
  return (
    <div
      className={cardClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
      {renderHeader(header, headerIcon, headerCentered, classPrefix)}
      {image && (
        <div className={prefixedClassNames(classPrefix, 'card-image')}>
          {typeof image === 'string' ? (
            <figure className={prefixedClassNames(classPrefix, 'image')}>
              <img src={image} alt={imageAlt ?? 'Card image'} />
            </figure>
          ) : (
            image
          )}
        </div>
      )}
      {/* Only render card-content if children is specified and doesn't contain compound components */}
      {typeof children !== 'undefined' &&
        children !== null &&
        children !== '' &&
        !hasCompoundComponents(children) && (
          <div className={prefixedClassNames(classPrefix, 'card-content')}>
            {children}
          </div>
        )}
      {/* Render children directly if they contain compound components */}
      {typeof children !== 'undefined' &&
        children !== null &&
        children !== '' &&
        hasCompoundComponents(children) &&
        children}
      {hasFooter && (
        <footer className={prefixedClassNames(classPrefix, 'card-footer')}>
          {Array.isArray(footer) ? (
            footer.map((item, idx) => (
              <span
                className={prefixedClassNames(classPrefix, 'card-footer-item')}
                key={idx}
              >
                {item}
              </span>
            ))
          ) : (
            <span
              className={prefixedClassNames(classPrefix, 'card-footer-item')}
            >
              {footer}
            </span>
          )}
        </footer>
      )}
    </div>
  );
};

// Compound components for flexible composition

/**
 * Props for the Card.Header compound component.
 */
export interface CardHeaderProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Header content. Wrap in Card.Header.Title for Bulma styling. */
  children?: React.ReactNode;
  /** Whether to center the header title text. */
  centered?: boolean;
}

/**
 * Props for the Card.Image compound component.
 */
export interface CardImageProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Image content (e.g. a `<figure>` with an `<img>`). */
  children?: React.ReactNode;
}

/**
 * Props for the Card.Content compound component.
 */
export interface CardContentProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Card body content. */
  children?: React.ReactNode;
}

/**
 * Props for the Card.Footer compound component.
 */
export interface CardFooterProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Footer content, typically Card.FooterItem elements. */
  children?: React.ReactNode;
}

/**
 * The set withheld from a non-anchor `Card.FooterItem` (`span`/`button`): the
 * derived anchor-only attributes, minus `type` (also valid on a `<button>` as
 * `submit`/`button`/`reset`, so stripping it there would remove a working
 * attribute; one set for both tags means a `type` also reaches a `<span>`,
 * which `Dropdown.Item` avoids by choosing its set per tag), plus `rel` (React
 * declares it on `HTMLAttributes` for every element, so the derived set alone
 * would not withhold it — the same addition `Level.Item` makes).
 */
const STRIP_FROM_NON_ANCHOR: Readonly<
  Record<Exclude<keyof AnchorOnlyAttributes, 'type'> | 'rel', true>
> = (() => {
  const { type: _type, ...rest } = ANCHOR_ONLY_ATTRS;
  return { ...rest, rel: true };
})();

/**
 * What `<button>` adds over the attributes every element has (`disabled`,
 * `form`, `name`, `value` and the `form*` submit overrides), subtracted from
 * React's types the way `AnchorOnlyAttributes` is, so it grows when React's
 * does. Minus `type`, which `AnchorOnlyAttributes` already declares as the
 * `<a>` MIME string: two heritage clauses declaring it differently do not
 * compile, and the `<button>` branch reads it back off the forwarded props.
 */
type ButtonOnlyAttributes = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  keyof React.HTMLAttributes<HTMLButtonElement> | 'type'
>;

/**
 * The set withheld from a non-button `Card.FooterItem` (`span`/`a`), keyed so
 * it stops compiling until a button attribute React adds is named here.
 */
const STRIP_FROM_NON_BUTTON: Readonly<
  Record<keyof ButtonOnlyAttributes, true>
> = {
  disabled: true,
  form: true,
  formAction: true,
  formEncType: true,
  formMethod: true,
  formNoValidate: true,
  formTarget: true,
  name: true,
  value: true,
};

/**
 * Props for the Card.FooterItem compound component.
 *
 * The anchor and button attributes arrive through `AnchorOnlyAttributes` and
 * `ButtonOnlyAttributes` at every `as`, and each set is forwarded only to its
 * own tag: `STRIP_FROM_NON_ANCHOR` and `STRIP_FROM_NON_BUTTON` above withhold
 * them from the others at runtime, since narrowing the type per `as` is
 * source-breaking (see `Level.Item`'s own note on #672).
 */
export interface CardFooterItemProps
  extends
    AnchorOnlyAttributes,
    ButtonOnlyAttributes,
    React.HTMLAttributes<
      HTMLSpanElement | HTMLAnchorElement | HTMLButtonElement
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Element type to render (default: `span`). Bulma's own card markup uses `a`. */
  as?: 'span' | 'a' | 'button';
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Footer item content (link, button, text, etc.). */
  children?: React.ReactNode;
}

/**
 * Props for the Card.Header.Title compound component.
 */
export interface CardHeaderTitleProps
  extends
    React.HTMLAttributes<
      HTMLDivElement | HTMLParagraphElement | HTMLHeadingElement
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Element type to render (default: `div`). Bulma's own card markup uses `p`; a heading suits a title that should read as one. */
  as?: 'div' | 'p' | 'h2' | 'h3' | 'h4';
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Title text content. */
  children?: React.ReactNode;
  /** Whether to center the title text. */
  centered?: boolean;
}

/**
 * Props for the Card.Header.Icon compound component.
 */
export interface CardHeaderIconProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier (text color helper). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color helper; wins over `color` when both are set. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Icon content (e.g. an icon element). */
  children?: React.ReactNode;
}

/**
 * Card header compound component. Wraps children in a `.card-header` element.
 *
 * @function
 * @param {CardHeaderProps} props - Props for the CardHeader component.
 * @returns {JSX.Element} The rendered card header.
 */
const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  centered,
  color,
  bgColor,
  textColor,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });

  // Check if children contains a CardHeaderTitle component
  const hasHeaderTitle = React.Children.toArray(children).some(
    child =>
      React.isValidElement(child) &&
      typeof child.type === 'function' &&
      child.type === CardHeaderTitle
  );

  const headerClasses = usePrefixedClassNames('card-header');

  return (
    <header
      className={classNames(headerClasses, bulmaHelperClasses, className)}
      {...rest}
    >
      {hasHeaderTitle ? (
        children
      ) : (
        <div
          className={classNames(
            prefixedClassNames(classPrefix, 'card-header-title', {
              'is-centered': centered,
            }),
            className
          )}
        >
          {children}
        </div>
      )}
    </header>
  );
};

/**
 * Card header title compound component. Renders a `.card-header-title` element.
 *
 * @function
 * @param {CardHeaderTitleProps} props - Props for the CardHeaderTitle component.
 * @returns {JSX.Element} The rendered card header title.
 */
const CardHeaderTitle: React.FC<CardHeaderTitleProps> = ({
  as = 'div',
  className,
  children,
  centered,
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
  return (
    <Tag
      className={classNames(
        usePrefixedClassNames('card-header-title', {
          'is-centered': centered,
        }),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/**
 * Card header icon compound component. Renders a `.card-header-icon` button.
 *
 * @function
 * @param {CardHeaderIconProps} props - Props for the CardHeaderIcon component.
 * @returns {JSX.Element} The rendered card header icon button.
 */
const CardHeaderIcon: React.FC<CardHeaderIconProps> = ({
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
  return (
    <button
      className={classNames(
        usePrefixedClassNames('card-header-icon'),
        bulmaHelperClasses,
        className
      )}
      aria-label={props['aria-label'] || 'more options'}
      {...rest}
    >
      {children}
    </button>
  );
};

/**
 * Card image compound component. Wraps children in a `.card-image` element.
 *
 * @function
 * @param {CardImageProps} props - Props for the CardImage component.
 * @returns {JSX.Element} The rendered card image container.
 */
const CardImage: React.FC<CardImageProps> = ({
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
  return (
    <div
      className={classNames(
        usePrefixedClassNames('card-image'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Card content compound component. Wraps children in a `.card-content` element.
 *
 * @function
 * @param {CardContentProps} props - Props for the CardContent component.
 * @returns {JSX.Element} The rendered card content container.
 */
const CardContent: React.FC<CardContentProps> = ({
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
  return (
    <div
      className={classNames(
        usePrefixedClassNames('card-content'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Card footer compound component. Wraps children in a `.card-footer` element.
 *
 * @function
 * @param {CardFooterProps} props - Props for the CardFooter component.
 * @returns {JSX.Element} The rendered card footer.
 */
const CardFooter: React.FC<CardFooterProps> = ({
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
  return (
    <footer
      className={classNames(
        usePrefixedClassNames('card-footer'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </footer>
  );
};

/**
 * Card footer item compound component. Wraps children in a `.card-footer-item` span.
 *
 * @function
 * @param {CardFooterItemProps} props - Props for the CardFooterItem component.
 * @returns {JSX.Element} The rendered card footer item.
 */
const CardFooterItem: React.FC<CardFooterItemProps> = ({
  as = 'span',
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
  const itemClasses = classNames(
    usePrefixedClassNames('card-footer-item'),
    bulmaHelperClasses,
    className
  );

  // The anchor's own attributes reach an `<a>` and nothing else, and the button's a
  // `<button>` — `STRIP_FROM_NON_ANCHOR` above names the anchor set and why `type`
  // stays while `rel` is added, and `STRIP_FROM_NON_BUTTON` the button set.
  if (as === 'a') {
    return (
      <a className={itemClasses} {...omitAttrs(rest, STRIP_FROM_NON_BUTTON)}>
        {children}
      </a>
    );
  }

  const forwarded = omitAttrs(rest, STRIP_FROM_NON_ANCHOR);

  if (as === 'button') {
    return (
      <button
        className={itemClasses}
        {...forwarded}
        // A footer item button must not submit an enclosing form by default —
        // `<button>` defaults to `type="submit"`, and a Save/Cancel action row
        // sitting in a form is the common case this `as` exists for.
        //
        // A MISSING `type` is not the only way that default arrives: `type` is
        // typed here as the `<a>` MIME string (`STRIP_FROM_NON_ANCHOR` above
        // says why it is not withheld), so `as="button" type="text/html"`
        // compiles, and HTML's INVALID-value default for a button's `type` is
        // submit too. `buttonType` keeps `button`, `submit` and `reset` and
        // turns anything else into `button`.
        type={buttonType((forwarded as { type?: string }).type)}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={itemClasses}
      {...omitAttrs(forwarded, STRIP_FROM_NON_BUTTON)}
    >
      {children}
    </span>
  );
};

// Attach nested Title and Icon components to CardHeader
const CardHeaderCompound = withSubComponents(CardHeader, {
  Title: CardHeaderTitle,
  Icon: CardHeaderIcon,
});

/** Card component with Header, Image, Content, Footer, and FooterItem sub-components. */
export const Card = withSubComponents(
  CardComponent,
  {
    Header: CardHeaderCompound,
    Image: CardImage,
    Content: CardContent,
    Footer: CardFooter,
    FooterItem: CardFooterItem,
  },
  'Card'
);
