import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  hasShadow?: boolean;
  /**
   * Card header content.
   * Rendered inside `.card-header-title`.
   */
  header?: React.ReactNode;
  /**
   * If true, adds the Bulma `is-centered` modifier to the header title.
   */
  headerCentered?: boolean;
  /**
   * Card header icon, rendered as a sibling to the header title, outside `.card-header-title`.
   * Use for `.card-header-icon` elements per Bulma docs.
   */
  headerIcon?: React.ReactNode;
  /**
   * Card footer content.
   * Can be a single node/string or an array of nodes/strings.
   * Each will be wrapped in .card-footer-item automatically.
   */
  footer?: React.ReactNode | React.ReactNode[];
  /**
   * Card image node or a string (img src).
   */
  image?: React.ReactNode | string;
  /**
   * Alternate text for the card image, if image is a string.
   * Defaults to "Card image" if not provided.
   */
  imageAlt?: string;
}

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
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const cardClasses = classNames('card', className, bulmaHelperClasses, {
    'is-shadowless': !hasShadow,
  });

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
