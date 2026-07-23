import type React from 'react';
import {
  Card,
  Icon,
  Title,
  Content,
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface FeatureCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Font Awesome icon name. */
  icon: string;
  title: string;
  body: string;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Icon + heading + blurb card. `flexGrow="1"` is applied here so a grid of
 * these stretches to equal height inside a flex `Cell`/`Column`.
 */
export function FeatureCard({
  icon,
  title,
  body,
  color = 'primary',
  className,
  ...props
}: FeatureCardProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('featurecard');

  return (
    <Card
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      flexGrow="1"
      {...rest}
    >
      {/* Card.* sub-parts take only className + HTML attributes — helper props
          go on the parent Card or on elements nested inside. */}
      <Card.Content>
        <Icon
          name={icon}
          size="medium"
          textColor={color}
          mb="3"
          aria-hidden="true"
        />
        <Title as="h3" size="5" mb="2">
          {title}
        </Title>
        <Content textColor="grey">{body}</Content>
      </Card.Content>
    </Card>
  );
}
