import type React from 'react';
import {
  Tag,
  Title,
  SubTitle,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'textAlign'> {
  /** Small label above the title, e.g. "Benchmarks". */
  eyebrow?: string;
  /** The heading itself. */
  title: React.ReactNode;
  /** Supporting line under the heading. */
  subtitle?: React.ReactNode;
  /** Heading scale — matches Title's size prop. */
  size?: '1' | '2' | '3' | '4';
  /** Center the block (default) or left-align it. */
  align?: 'centered' | 'left';
}

/**
 * Eyebrow + title + subtitle — the heading at the top of every marketing
 * section. Composition and helper props only; no CSS of its own.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  size = '2',
  align = 'centered',
  className,
  ...props
}: SectionHeadingProps) {
  // The library's own spine: helper props in, Bulma classes out.
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
    textAlign: align,
  });

  return (
    <div
      className={classNames(bulmaHelperClasses, className)}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      {eyebrow && (
        <Tag color="primary" mb="4" textWeight="semibold">
          {eyebrow}
        </Tag>
      )}
      <Title size={size} mb={subtitle ? '3' : '0'}>
        {title}
      </Title>
      {subtitle && (
        <SubTitle as="p" size="5" textColor="grey" mb="0">
          {subtitle}
        </SubTitle>
      )}
    </div>
  );
}
