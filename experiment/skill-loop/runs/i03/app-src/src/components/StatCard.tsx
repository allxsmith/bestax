import type React from 'react';
import {
  Box,
  Icon,
  Title,
  classNames,
  useBulmaClasses,
  usePrefixedClassNames,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Metric label, e.g. "Context window". */
  label: string;
  /** Headline value, e.g. "2M tokens". */
  value: string;
  /** Font Awesome icon name. */
  icon?: string;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/** A single headline metric. Composition + helper props only. */
export function StatCard({
  label,
  value,
  icon,
  color = 'primary',
  className,
  ...props
}: StatCardProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('statcard', {
    [`is-${color}`]: !!color,
  });

  return (
    <Box
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      display="flex"
      alignItems="center"
      p="4"
      {...rest}
    >
      {icon && (
        <Icon
          name={icon}
          size="medium"
          textColor={color}
          mr="4"
          aria-hidden="true"
        />
      )}
      <div>
        <Title as="p" size="4" mb="1">
          {value}
        </Title>
        <Title as="p" size="6" textColor="grey" textWeight="normal" mb="0">
          {label}
        </Title>
      </div>
    </Box>
  );
}
