import type React from 'react';
import {
  Level,
  Progress,
  Span,
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface ScoreBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  label: string;
  /** Score out of `max`. */
  value: number;
  max?: number;
  /** Rendered next to the label instead of the raw number. */
  valueLabel?: string;
  /**
   * Omit for the neutral bar — Bulma's default progress fill follows the
   * scheme text color, so it stays legible in light and dark mode. Bulma has
   * no `.progress.is-grey`, so don't reach for one.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

/** A labelled progress bar for one benchmark score. */
export function ScoreBar({
  label,
  value,
  max = 100,
  valueLabel,
  color,
  className,
  ...props
}: ScoreBarProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('scorebar');

  return (
    <div
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      {...rest}
    >
      <Level isMobile mb="1">
        <Level.Left>
          <Level.Item>
            <Span textSize="7" textWeight="medium">
              {label}
            </Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Span textSize="7" textWeight="semibold" fontFamily="monospace">
              {valueLabel ?? value.toFixed(1)}
            </Span>
          </Level.Item>
        </Level.Right>
      </Level>
      <Progress
        value={value}
        max={max}
        color={color}
        size="small"
        aria-label={`${label}: ${valueLabel ?? value}`}
      />
    </div>
  );
}
