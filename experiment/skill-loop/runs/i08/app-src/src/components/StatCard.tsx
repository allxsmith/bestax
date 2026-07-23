import type React from 'react';
import {
  Box,
  Icon,
  Title,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Metric label, e.g. "Context window". */
  label: string;
  /** Headline value, e.g. "8M tokens". */
  value: string;
  /** Font Awesome icon name. */
  icon?: string;
  /** Bulma color for the icon. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * A single headline metric: icon on the left, label over value on the right.
 * Composition + helper props only — no CSS of its own.
 */
export function StatCard({
  label,
  value,
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
      alignItems="center"
      p="4"
      {...rest}
    >
      {icon && (
        <Icon
          name={icon}
          size="large"
          textColor={color}
          mr="4"
          aria-hidden="true"
        />
      )}
      <div>
        {/* as="p": these sizes are visual scale, not document structure. */}
        <Title as="p" size="6" textColor="grey" textWeight="normal" mb="1">
          {label}
        </Title>
        <Title as="p" size="3" mb="0">
          {value}
        </Title>
      </div>
    </Box>
  );
}
