import type React from 'react';
import {
  Block,
  Tag,
  Title,
  SubTitle,
  classNames,
  useBulmaClasses,
  usePrefixedClassNames,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Small label above the title. */
  eyebrow?: string;
  title: React.ReactNode;
  /** Supporting line under the title. */
  lede?: React.ReactNode;
  /** Center the block (default) or left-align it. */
  align?: 'centered' | 'left';
  /** Heading level for the title — keeps the document outline sane. */
  as?: 'h1' | 'h2' | 'h3';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Eyebrow + title + lede — the header that opens every section on the site.
 * Pure composition: Tag, Title, SubTitle and helper props, no CSS.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'centered',
  as = 'h2',
  color = 'primary',
  className,
  ...props
}: SectionHeadingProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('section-heading', {
    [`is-${color}`]: !!color,
  });

  return (
    <Block
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      textAlign={align === 'centered' ? 'centered' : 'left'}
      {...rest}
    >
      {eyebrow && (
        <Tag color={color} isRounded mb="4">
          {eyebrow}
        </Tag>
      )}
      <Title as={as} size="2" mb={lede ? '3' : '0'}>
        {title}
      </Title>
      {lede && (
        <SubTitle as="p" size="5" textColor="grey" mb="0">
          {lede}
        </SubTitle>
      )}
    </Block>
  );
}
