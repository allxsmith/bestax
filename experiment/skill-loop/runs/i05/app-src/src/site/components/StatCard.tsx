import type React from 'react';
import {
  Box,
  Icon,
  Title,
  Paragraph,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** The headline figure, e.g. "10×". */
  value: string;
  /** What the figure measures. */
  label: string;
  /** Font Awesome icon name. */
  icon?: string;
  /** Bulma color for the icon and the figure. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * A single headline metric. Built from Box + Icon + Title with helper props —
 * no inline style, no hand-written Bulma classes.
 */
export function StatCard({
  value,
  label,
  icon,
  color = 'primary',
  className,
  ...props
}: StatCardProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <Box
      className={classNames(bulmaHelperClasses, className)}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      p="5"
      {...(rest as Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>)}
    >
      {icon && (
        <Icon
          name={icon}
          size="medium"
          textColor={color}
          mb="3"
          aria-hidden="true"
        />
      )}
      {/* as="p": these sizes are visual scale, not document structure. */}
      <Title as="p" size="1" textColor={color} mb="2">
        {value}
      </Title>
      <Paragraph textColor="grey" mb="0">
        {label}
      </Paragraph>
    </Box>
  );
}
