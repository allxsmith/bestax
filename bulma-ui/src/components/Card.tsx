import React from 'react';
import classNames from '../helpers/classNames';
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
const renderFooter = (footer: CardProps['footer']) => {
  if (!footer) return null;
  const items = Array.isArray(footer) ? footer : [footer];
  return items.map((item, idx) => (
    <span className="card-footer-item" key={idx}>
      {item}
    </span>
  ));
};

/**
 * Card component for rendering a styled Bulma card.
 *
 * @function
 * @param {CardProps} props - Props for the Card component.
 * @returns {JSX.Element} The rendered card element.
 * @see {@link https://bulma.io/documentation/components/card/ | Bulma Card documentation}
 */
export const Card: React.FC<CardProps> = ({
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

  const mainClass = classPrefix ? `${classPrefix}card` : 'card';
  const cardClasses = classNames(mainClass, className, bulmaHelperClasses, {
    'is-shadowless': !hasShadow,
  });

  // Render header with optional icon and is-centered modifier
  const renderHeader = (
    header: React.ReactNode,
    headerIcon: React.ReactNode,
    headerCentered?: boolean
  ) => {
    if (!header && !headerIcon) return null;
    return (
      <header className="card-header">
        {header && (
          <div
            className={classNames('card-header-title', {
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
      {renderHeader(header, headerIcon, headerCentered)}
      {image && (
        <div className="card-image">
          {typeof image === 'string' ? (
            <figure className="image">
              <img src={image} alt={imageAlt ?? 'Card image'} />
            </figure>
          ) : (
            image
          )}
        </div>
      )}
      {/* Only render card-content if children is specified */}
      {typeof children !== 'undefined' &&
        children !== null &&
        children !== '' && <div className="card-content">{children}</div>}
      {footer && (
        <footer className="card-footer">{renderFooter(footer)}</footer>
      )}
    </div>
  );
};

// Only for test coverage
export const __test_exports__ = { renderFooter };
