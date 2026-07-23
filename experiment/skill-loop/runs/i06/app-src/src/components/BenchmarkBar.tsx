import type React from 'react';
import {
  classNames,
  useBulmaClasses,
  Block,
  Level,
  Progress,
  Paragraph,
  Span,
  Strong,
  Tag,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';
import { errorMultiple, type Benchmark } from '../data/site';

export interface BenchmarkBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  benchmark: Benchmark;
  /** Show the one-line description of what the benchmark measures. */
  showBlurb?: boolean;
}

/**
 * Side-by-side score bars for one benchmark: Skynet against Fable, plus the
 * residual-error multiple that the two scores imply.
 */
export function BenchmarkBar({
  benchmark,
  showBlurb = true,
  className,
  ...props
}: BenchmarkBarProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <Block className={classNames(bulmaHelperClasses, className)} {...rest}>
      <Level isMobile mb="2">
        <Level.Left>
          <Level.Item>
            <Strong>{benchmark.name}</Strong>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Tag color="primary" isRounded>
              {errorMultiple(benchmark)}× fewer errors
            </Tag>
          </Level.Item>
        </Level.Right>
      </Level>

      {showBlurb && (
        <Paragraph mb="3">
          <Span textSize="7" textColor="grey">
            {benchmark.blurb}
          </Span>
        </Paragraph>
      )}

      <Paragraph mb="1">
        <Span textSize="7" textWeight="semibold" textColor="primary">
          Skynet Ultra — {benchmark.skynet.toFixed(1)}%
        </Span>
      </Paragraph>
      <Progress
        color="primary"
        size="small"
        value={benchmark.skynet}
        max={100}
        mb="3"
        aria-label={`Skynet Ultra on ${benchmark.name}`}
      />

      <Paragraph mb="1">
        <Span textSize="7" textColor="grey">
          Fable — {benchmark.fable.toFixed(1)}%
        </Span>
      </Paragraph>
      <Progress
        size="small"
        value={benchmark.fable}
        max={100}
        mb="0"
        aria-label={`Fable on ${benchmark.name}`}
      />
    </Block>
  );
}
