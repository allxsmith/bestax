import type React from 'react';
import {
  Tag,
  Title,
  SubTitle,
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Small kicker above the title, e.g. "Benchmarks". */
  eyebrow?: string;
  /** The section title. */
  title: React.ReactNode;
  /** Optional supporting line under the title. */
  subtitle?: React.ReactNode;
  /** Heading level — visual size is `size`, so keep the outline honest. */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  /** Visual size of the title. */
  size?: '1' | '2' | '3' | '4';
}

/**
 * Eyebrow + title + subtitle block used at the top of every section.
 * Takes the library helper props: `<SectionHeading textAlign="centered" mb="6" …>`.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as = 'h2',
  size = '2',
  className,
  ...props
}: SectionHeadingProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('section-heading');

  return (
    <div
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      {...rest}
    >
      {eyebrow && (
        <Tag color="primary" mb="3">
          {eyebrow}
        </Tag>
      )}
      <Title as={as} size={size} mb={subtitle ? '3' : '0'}>
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
