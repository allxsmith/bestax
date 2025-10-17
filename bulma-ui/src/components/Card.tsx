import React from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Card component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the card.
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the card.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the card.
 * @property {boolean} [hasShadow] - Whether the card has a shadow (default: true).
 * @property {React.ReactNode} [header] - Card header content, rendered inside `.card-header-title`.
 * @property {boolean} [headerCentered] - If true, centers the header title.
 * @property {React.ReactNode} [headerIcon] - Card header icon, rendered as a sibling to the header title.
 * @property {React.ReactNode|React.ReactNode[]} [footer] - Card footer content, each wrapped in `.card-footer-item`.
 * @property {React.ReactNode|string} [image] - Card image node or image src string.
 * @property {string} [imageAlt] - Alternate text for the card image.
 * @property {React.ReactNode} [children] - Card content.
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  hasShadow?: boolean;
  header?: React.ReactNode;
  headerCentered?: boolean;
  headerIcon?: React.ReactNode;
  footer?: React.ReactNode | React.ReactNode[];
  image?: React.ReactNode | string;
  imageAlt?: string;
  children?: React.ReactNode;
}

// Always wrap each footer item in .card-footer-item
const renderFooter = (
  footer: CardProps['footer'],
  classPrefix: string | undefined
) => {
  if (!footer) return null;
  const items = Array.isArray(footer) ? footer : [footer];
  return items.map((item, idx) => (
    <span
      className={prefixedClassNames(classPrefix, 'card-footer-item')}
      key={idx}
    >
      {item}
    </span>
  ));
};

// Check if children contain any Card compound components
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
 * Card component for rendering a styled Bulma card.
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
  bgColor,
  hasShadow = true,
  header,
  headerCentered,
  headerIcon,
  footer,
  image,
  imageAlt,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
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

  return (
    <div className={cardClasses} {...rest}>
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
      {footer && (
        <footer className={prefixedClassNames(classPrefix, 'card-footer')}>
          {Array.isArray(footer)
            ? footer.map((item, idx) => (
                <span
                  className={prefixedClassNames(
                    classPrefix,
                    'card-footer-item'
                  )}
                  key={idx}
                >
                  {item}
                </span>
              ))
            : footer && (
                <span
                  className={prefixedClassNames(
                    classPrefix,
                    'card-footer-item'
                  )}
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
export interface CardHeaderProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
  centered?: boolean;
}

export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface CardFooterItemProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface CardHeaderTitleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  centered?: boolean;
}

export interface CardHeaderIconProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  centered,
  ...props
}) => {
  const { classPrefix } = useConfig();

  // Check if children contains a CardHeaderTitle component
  const hasHeaderTitle = React.Children.toArray(children).some(
    child =>
      React.isValidElement(child) &&
      typeof child.type === 'function' &&
      child.type === CardHeaderTitle
  );

  const headerClasses = usePrefixedClassNames('card-header');

  return (
    <header className={classNames(headerClasses, className)} {...props}>
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

const CardHeaderTitle: React.FC<CardHeaderTitleProps> = ({
  className,
  children,
  centered,
  ...props
}) => (
  <div
    className={classNames(
      usePrefixedClassNames('card-header-title', {
        'is-centered': centered,
      }),
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeaderIcon: React.FC<CardHeaderIconProps> = ({
  className,
  children,
  ...props
}) => (
  <button
    className={classNames(usePrefixedClassNames('card-header-icon'), className)}
    aria-label={props['aria-label'] || 'more options'}
    {...props}
  >
    {children}
  </button>
);

const CardImage: React.FC<CardImageProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={classNames(usePrefixedClassNames('card-image'), className)}
    {...props}
  >
    {children}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={classNames(usePrefixedClassNames('card-content'), className)}
    {...props}
  >
    {children}
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => (
  <footer
    className={classNames(usePrefixedClassNames('card-footer'), className)}
    {...props}
  >
    {children}
  </footer>
);

const CardFooterItem: React.FC<CardFooterItemProps> = ({
  className,
  children,
  ...props
}) => (
  <span
    className={classNames(usePrefixedClassNames('card-footer-item'), className)}
    {...props}
  >
    {children}
  </span>
);

// Create a type that extends the Card component with compound components
type CardWithCompounds = typeof CardComponent & {
  Header: typeof CardHeader & {
    Title: typeof CardHeaderTitle;
    Icon: typeof CardHeaderIcon;
  };
  Image: typeof CardImage;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
  FooterItem: typeof CardFooterItem;
};

// Cast Card to the compound type and assign compound components
const CardWithSubComponents = CardComponent as CardWithCompounds;

// Create CardHeader with nested Title and Icon components
const CardHeaderWithTitle = CardHeader as typeof CardHeader & {
  Title: typeof CardHeaderTitle;
  Icon: typeof CardHeaderIcon;
};
CardHeaderWithTitle.Title = CardHeaderTitle;
CardHeaderWithTitle.Icon = CardHeaderIcon;

CardWithSubComponents.Header = CardHeaderWithTitle;
CardWithSubComponents.Image = CardImage;
CardWithSubComponents.Content = CardContent;
CardWithSubComponents.Footer = CardFooter;
CardWithSubComponents.FooterItem = CardFooterItem;

// Export the compound component
export { CardWithSubComponents as Card };

// Only for test coverage
export const __test_exports__ = { renderFooter };
