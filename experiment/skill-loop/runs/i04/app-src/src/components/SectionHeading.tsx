import type React from 'react';
import {
  Block,
  Tag,
  Title,
  SubTitle,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Small label above the title. */
  eyebrow?: string;
  /** The section title. */
  title: string;
  /** Supporting line under the title. */
  lead?: string;
  /** Center the block (default) or left-align it. */
  align?: 'centered' | 'left';
}

/**
 * Eyebrow + title + lead, the repeated heading unit of every marketing
 * section on this site. Takes the library's helper props like any bestax
 * component, so callers tune spacing with `mt`/`mb` rather than CSS.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'centered',
  className,
  ...props
}: SectionHeadingProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <Block
      className={classNames(bulmaHelperClasses, className)}
      textAlign={align === 'centered' ? 'centered' : 'left'}
      mb="6"
      {...rest}
    >
      {eyebrow && (
        <Tag color="link" isRounded mb="4" textWeight="semibold">
          {eyebrow}
        </Tag>
      )}
      <Title size="2">{title}</Title>
      {lead && (
        <SubTitle size="5" textColor="grey" mt="3">
          {lead}
        </SubTitle>
      )}
    </Block>
  );
}
