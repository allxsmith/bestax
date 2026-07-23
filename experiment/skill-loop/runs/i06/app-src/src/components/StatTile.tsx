import type React from 'react';
import {
  classNames,
  useBulmaClasses,
  Block,
  Title,
  Paragraph,
  Span,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface StatTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  value: React.ReactNode;
  label: React.ReactNode;
  hint?: React.ReactNode;
  centered?: boolean;
}

/**
 * A single headline number with its label and an optional footnote.
 * Composed from Title/Paragraph/Span so it inherits theming and dark mode.
 */
export function StatTile({
  value,
  label,
  hint,
  centered = true,
  className,
  ...props
}: StatTileProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const align = centered ? 'centered' : undefined;

  return (
    <Block className={classNames(bulmaHelperClasses, className)} {...rest}>
      <Title size="2" textColor="primary" textAlign={align} mb="1">
        {value}
      </Title>
      <Paragraph textWeight="semibold" textAlign={align} mb={hint ? '1' : '0'}>
        {label}
      </Paragraph>
      {hint && (
        <Paragraph textAlign={align} mb="0">
          <Span textSize="7" textColor="grey">
            {hint}
          </Span>
        </Paragraph>
      )}
    </Block>
  );
}
