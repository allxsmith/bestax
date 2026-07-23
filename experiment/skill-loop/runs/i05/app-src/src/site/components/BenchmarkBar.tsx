import type React from 'react';
import {
  Progress,
  Level,
  Span,
  Title,
  Tag,
  classNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';
import { BASELINE, errorReduction, type Benchmark } from '../data';

export interface BenchmarkBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** The benchmark to chart. */
  benchmark: Benchmark;
}

/**
 * One benchmark rendered as a pair of bars — Skynet against the baseline —
 * with the error-reduction multiple called out. Composed from Progress and
 * Level; every value comes from `data.ts`.
 */
export function BenchmarkBar({
  benchmark,
  className,
  ...props
}: BenchmarkBarProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const factor = errorReduction(benchmark);

  return (
    <div
      className={classNames(bulmaHelperClasses, className)}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      <Level isMobile mb="2">
        <Level.Left>
          <Level.Item>
            <Title as="p" size="6" mb="0">
              {benchmark.name}
            </Title>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Tag color="primary">{factor.toFixed(1)}× fewer errors</Tag>
          </Level.Item>
        </Level.Right>
      </Level>

      <Span textSize="7" textColor="grey" display="block" mb="3">
        {benchmark.blurb}
      </Span>

      <Level isMobile mb="1">
        <Level.Left>
          <Level.Item>
            <Span textSize="7" textWeight="semibold" textColor="primary">
              Skynet Ultra
            </Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Span textSize="7" textWeight="semibold">
              {benchmark.skynet.toFixed(1)}%
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
        aria-label={`${benchmark.name}, Skynet Ultra`}
      />

      <Level isMobile mb="1">
        <Level.Left>
          <Level.Item>
            <Span textSize="7" textColor="grey">
              {BASELINE}
            </Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Span textSize="7" textColor="grey">
              {benchmark.baseline.toFixed(1)}%
            </Span>
          </Level.Item>
        </Level.Right>
      </Level>
      <Progress
        color="grey-light"
        size="small"
        value={benchmark.baseline}
        max={100}
        mb="0"
        aria-label={`${benchmark.name}, ${BASELINE}`}
      />
    </div>
  );
}
