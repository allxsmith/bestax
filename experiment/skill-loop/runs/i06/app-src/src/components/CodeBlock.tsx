import type React from 'react';
import {
  classNames,
  useBulmaClasses,
  Pre,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface CodeBlockProps
  extends Omit<React.HTMLAttributes<HTMLPreElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  code: string;
  /** Announced label for the snippet, e.g. "Python quickstart". */
  label?: string;
}

/**
 * A scrollable code sample. `Pre` already carries Bulma's code styling, so this
 * only adds the accessible label and the helper-prop spine.
 */
export function CodeBlock({ code, label, className, ...props }: CodeBlockProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <Pre
      className={classNames(bulmaHelperClasses, className)}
      textSize="7"
      tabIndex={0}
      role="region"
      aria-label={label}
      {...rest}
    >
      {code}
    </Pre>
  );
}
