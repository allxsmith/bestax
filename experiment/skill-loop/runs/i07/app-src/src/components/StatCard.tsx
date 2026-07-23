import type React from 'react';
import {
  Box,
  Icon,
  Title,
  Paragraph,
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Headline figure, e.g. "10×". */
  value: string;
  /** What the figure is, e.g. "fewer errors". */
  label: string;
  /** Optional one-line footnote under the label. */
  caption?: string;
  /** Font Awesome icon name (library set once on ConfigProvider). */
  icon?: string;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/** A single headline metric. Composition only — no custom CSS. */
export function StatCard({
  value,
  label,
  caption,
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
      flexDirection="column"
      alignItems="flex-start"
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
      {/* as="p": these sizes are visual scale, not document structure. */}
      <Title as="p" size="1" textColor={color} mb="2">
        {value}
      </Title>
      <Title as="p" size="6" textWeight="semibold" mb={caption ? '2' : '0'}>
        {label}
      </Title>
      {caption && (
        <Paragraph textSize="7" textColor="grey" mb="0">
          {caption}
        </Paragraph>
      )}
    </Box>
  );
}
