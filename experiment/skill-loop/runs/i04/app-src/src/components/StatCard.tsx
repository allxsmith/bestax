import type React from 'react';
import {
  Box,
  Title,
  Icon,
  Span,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Metric label, e.g. "Sustained throughput". */
  label: string;
  /** The headline value, e.g. "1,840 tok/s". */
  value: string;
  /** Optional supporting line under the value. */
  detail?: string;
  /** Font Awesome icon name. */
  icon?: string;
  /** Bulma color for the icon. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * A single headline metric. Composition + helper props only — no CSS of its
 * own — and it accepts the library's helper props like any bestax component.
 */
export function StatCard({
  label,
  value,
  detail,
  icon,
  color = 'link',
  className,
  ...props
}: StatCardProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <Box
      className={classNames(bulmaHelperClasses, className)}
      display="flex"
      flexDirection="column"
      p="5"
      {...rest}
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
      <Title as="p" size="2" mb="2">
        {value}
      </Title>
      <Title as="p" size="6" textColor="grey" mb={detail ? '2' : '0'}>
        {label}
      </Title>
      {detail && (
        <Span textSize="7" textColor="grey">
          {detail}
        </Span>
      )}
    </Box>
  );
}
