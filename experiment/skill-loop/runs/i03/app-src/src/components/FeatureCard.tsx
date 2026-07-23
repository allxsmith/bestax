import type React from 'react';
import {
  Box,
  Content,
  Icon,
  Title,
  classNames,
  useBulmaClasses,
  usePrefixedClassNames,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface FeatureCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color'> {
  title: string;
  body: string;
  icon?: string;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/** Icon + heading + copy, stretched to fill its grid cell. */
export function FeatureCard({
  title,
  body,
  icon,
  color = 'primary',
  className,
  ...props
}: FeatureCardProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('featurecard');

  return (
    <Box
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      display="flex"
      flexDirection="column"
      flexGrow="1"
      p="5"
      {...rest}
    >
      {icon && (
        <Icon
          name={icon}
          size="medium"
          textColor={color}
          mb="4"
          aria-hidden="true"
        />
      )}
      <Title as="h3" size="5" mb="2">
        {title}
      </Title>
      <Content textColor="grey" mb="0">
        {body}
      </Content>
    </Box>
  );
}
