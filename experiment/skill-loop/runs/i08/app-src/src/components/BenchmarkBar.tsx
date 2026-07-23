import type React from 'react';
import {
  Level,
  Progress,
  Span,
  Tag,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';
import { errorReduction, type Benchmark } from '../data/site';

export interface BenchmarkBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  benchmark: Benchmark;
}

/**
 * One benchmark suite as a pair of progress bars — Skynet above, Fable below —
 * with the residual-error ratio called out as a tag.
 *
 * Built entirely from shipped components (`Progress`, `Level`, `Tag`, `Span`)
 * plus helper props; no bespoke meter and no CSS.
 */
export function BenchmarkBar({
  benchmark,
  className,
  ...props
}: BenchmarkBarProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const ratio = errorReduction(benchmark);

  return (
    <div className={classNames(bulmaHelperClasses, className)} {...rest}>
      <Level isMobile mb="2">
        <Level.Left>
          <Level.Item>
            <Span textWeight="semibold">{benchmark.id}</Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Tag color="primary" isRounded>
              {ratio.toFixed(1)}x fewer errors
            </Tag>
          </Level.Item>
        </Level.Right>
      </Level>

      <Span textSize="7" textColor="grey" display="block" mb="3">
        {benchmark.domain}
      </Span>

      <Level isMobile mb="1">
        <Level.Left>
          <Level.Item>
            <Span textSize="7" textWeight="medium">
              Skynet
            </Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Span textSize="7" textWeight="semibold" textColor="primary">
              {benchmark.skynet.toFixed(1)}
            </Span>
          </Level.Item>
        </Level.Right>
      </Level>
      <Progress
        color="primary"
        size="small"
        value={benchmark.skynet}
        max={100}
        mb="4"
        aria-label={`Skynet score on ${benchmark.id}`}
      >
        {benchmark.skynet}%
      </Progress>

      <Level isMobile mb="1">
        <Level.Left>
          <Level.Item>
            <Span textSize="7" textColor="grey">
              Fable
            </Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Span textSize="7" textColor="grey">
              {benchmark.fable.toFixed(1)}
            </Span>
          </Level.Item>
        </Level.Right>
      </Level>
      <Progress
        size="small"
        value={benchmark.fable}
        max={100}
        mb="0"
        aria-label={`Fable score on ${benchmark.id}`}
      >
        {benchmark.fable}%
      </Progress>
    </div>
  );
}
