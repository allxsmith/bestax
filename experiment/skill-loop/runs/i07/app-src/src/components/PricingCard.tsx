import type React from 'react';
import {
  Box,
  Button,
  Icon,
  IconText,
  ListItem,
  Paragraph,
  Span,
  Tag,
  Title,
  UnorderedList,
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';
import './PricingCard.css';

export interface PricingCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  ctaHref?: string;
  /** Highlights the tier and gives it the solid CTA. */
  featured?: boolean;
}

/**
 * One pricing tier. Built on `Box` rather than `Card` so the helper props
 * (`display="flex"`, `mt="auto"`) can pin the CTA to the bottom edge —
 * `Card.*` sub-parts take only className + HTML attributes.
 */
export function PricingCard({
  name,
  price,
  period,
  blurb,
  features,
  cta,
  ctaHref = '#/contact',
  featured = false,
  className,
  ...props
}: PricingCardProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('pricingcard', {
    'is-featured': featured,
  });

  return (
    <Box
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      display="flex"
      flexDirection="column"
      flexGrow="1"
      p="5"
      {...rest}
    >
      <Title as="h3" size="5" mb="3">
        {name}
        {featured && (
          <Tag color="primary" ml="3">
            Most popular
          </Tag>
        )}
      </Title>

      <Title as="p" size="1" mb="1">
        {price}
      </Title>
      <Paragraph textSize="7" textColor="grey" mb="4">
        {period}
      </Paragraph>
      <Paragraph mb="5">{blurb}</Paragraph>

      <UnorderedList mb="5">
        {features.map(feature => (
          <ListItem key={feature} mb="2">
            <IconText>
              <Icon name="check" textColor="success" aria-hidden="true" />
              <Span>{feature}</Span>
            </IconText>
          </ListItem>
        ))}
      </UnorderedList>

      {/* mt="auto" pushes the CTA to the bottom so every tier's button lines up. */}
      <Button
        as="a"
        href={ctaHref}
        color="primary"
        isOutlined={!featured}
        isFullWidth
        mt="auto"
      >
        {cta}
      </Button>
    </Box>
  );
}
