import type React from 'react';
import {
  Title,
  Icon,
  Span,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** The headline figure, e.g. "10.3x". */
  value: string;
  /** What the figure measures, e.g. "Average advantage over Fable". */
  label: string;
  /** Optional Font Awesome icon name shown above the figure. */
  icon?: string;
  /** Bulma color for the figure and icon. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * A single headline metric. Composition + helper props only — no CSS of its own,
 * and it takes the same helper props as any library component.
 */
export function StatTile({
  value,
  label,
  icon,
  color = 'primary',
  className,
  ...props
}: StatTileProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <div
      className={classNames(bulmaHelperClasses, className)}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      {icon && (
        <Icon name={icon} textColor={color} mb="2" aria-hidden="true" />
      )}
      {/* as="p": these sizes are visual scale, not document structure. */}
      <Title as="p" size="2" textColor={color} mb="1">
        {value}
      </Title>
      <Span textSize="6" textColor="grey">
        {label}
      </Span>
    </div>
  );
}
