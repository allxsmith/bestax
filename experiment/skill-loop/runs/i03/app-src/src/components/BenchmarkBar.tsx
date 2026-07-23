import type React from 'react';
import {
  Box,
  Level,
  Progress,
  Span,
  Tag,
  classNames,
  useBulmaClasses,
  usePrefixedClassNames,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';
import { errorReduction, type Benchmark } from '../site/content';

export interface BenchmarkBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  benchmark: Benchmark;
  /** Show the metric/domain caption under the benchmark name. */
  showDetail?: boolean;
}

/**
 * One benchmark, two bars: Skynet against Fable, plus the error-reduction
 * multiple. Built on the shipped `Progress` element so the bar widths come from
 * a real component rather than inline styles.
 */
export function BenchmarkBar({
  benchmark,
  showDetail = true,
  className,
  ...props
}: BenchmarkBarProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('benchmarkbar');

  return (
    <Box
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      p="5"
      {...rest}
    >
      <Level isMobile mb="4">
        <Level.Left>
          <Level.Item>
            <div>
              <Span textWeight="semibold" textSize="5">
                {benchmark.name}
              </Span>
              {showDetail && (
                <Span textSize="7" textColor="grey" display="block">
                  {benchmark.domain} · {benchmark.metric}
                </Span>
              )}
            </div>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Tag color="primary" isRounded>
              {errorReduction(benchmark)}x fewer errors
            </Tag>
          </Level.Item>
        </Level.Right>
      </Level>

      <ScoreRow
        label="Skynet Ultra"
        score={benchmark.skynet}
        color="primary"
        emphasis
      />
      <ScoreRow label="Fable" score={benchmark.fable} color="dark" />
    </Box>
  );
}

interface ScoreRowProps {
  label: string;
  score: number;
  color: 'primary' | 'dark';
  emphasis?: boolean;
}

function ScoreRow({ label, score, color, emphasis }: ScoreRowProps) {
  return (
    <div>
      <Level isMobile mb="1">
        <Level.Left>
          <Level.Item>
            <Span
              textSize="7"
              textWeight={emphasis ? 'semibold' : 'normal'}
              textColor={emphasis ? undefined : 'grey'}
            >
              {label}
            </Span>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Span
              textSize="7"
              textWeight="semibold"
              textColor={emphasis ? 'primary' : 'grey'}
            >
              {score.toFixed(1)}
            </Span>
          </Level.Item>
        </Level.Right>
      </Level>
      <Progress value={score} max={100} color={color} size="small" mb="4" />
    </div>
  );
}
