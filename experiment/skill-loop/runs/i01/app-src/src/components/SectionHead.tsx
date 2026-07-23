import {
  Block,
  Column,
  Columns,
  SubTitle,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Left-align instead of the default centered treatment. */
  align?: 'centered' | 'left';
}

/** The repeated eyebrow + title + subtitle block that opens every section. */
export function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = 'centered',
}: SectionHeadProps) {
  const centered = align === 'centered';

  const heading = (
    <>
      {eyebrow && (
        <Tag color="primary" isRounded mb="3" textWeight="semibold">
          {eyebrow}
        </Tag>
      )}
      <Title size="2" as="h2" isSpaced={!subtitle}>
        {title}
      </Title>
      {subtitle && (
        <SubTitle size="5" textColor="grey">
          {subtitle}
        </SubTitle>
      )}
    </>
  );

  return (
    <Block textAlign={centered ? 'centered' : undefined} mb="6">
      {/* Centered heads read better with a measure narrower than the container,
          so the subtitle wraps instead of running the full page width. */}
      {centered ? (
        <Columns isCentered>
          <Column sizeTablet={10} sizeDesktop={8}>
            {heading}
          </Column>
        </Columns>
      ) : (
        heading
      )}
    </Block>
  );
}
