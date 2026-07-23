import type React from 'react';
import {
  classNames,
  useBulmaClasses,
  Block,
  Tag,
  Title,
  SubTitle,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Small label rendered as a Tag above the title. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Bulma title size — defaults to "2". */
  size?: '1' | '2' | '3' | '4';
  centered?: boolean;
}

/**
 * The heading block that opens every section of the site: optional eyebrow tag,
 * a title, and a muted subtitle. Pure composition — no custom CSS.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  size = '2',
  centered,
  className,
  ...props
}: SectionHeadingProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const align = centered ? 'centered' : undefined;

  return (
    <Block className={classNames(bulmaHelperClasses, className)} {...rest}>
      {eyebrow && (
        <Block mb="3" textAlign={align}>
          <Tag color="primary" isRounded textWeight="semibold">
            {eyebrow}
          </Tag>
        </Block>
      )}
      <Title size={size} textAlign={align} mb={subtitle ? '3' : '0'}>
        {title}
      </Title>
      {subtitle && (
        <SubTitle size="5" textColor="grey" textAlign={align} mb="0">
          {subtitle}
        </SubTitle>
      )}
    </Block>
  );
}
