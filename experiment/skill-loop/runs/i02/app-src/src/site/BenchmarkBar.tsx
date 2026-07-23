import {
  Block,
  Columns,
  Column,
  Level,
  Progress,
  Span,
  Strong,
  Tag,
} from '@allxsmith/bestax-bulma';
import type { Benchmark } from './content';

/**
 * One benchmark rendered as a two-series meter. Colour carries the series and
 * nothing else: Skynet is always brand `primary`, the baseline is always the
 * neutral default bar, on every page. Each bar is labelled with its own value,
 * so the chart is readable without comparing pixel lengths.
 */
export default function BenchmarkBar({
  benchmark,
  showBlurb = false,
}: {
  benchmark: Benchmark;
  showBlurb?: boolean;
}) {
  const delta = Math.round((benchmark.skynet - benchmark.fable) * 10) / 10;

  return (
    <Block>
      <Level isMobile mb="2">
        <Level.Left>
          <Level.Item>
            <Strong>{benchmark.name}</Strong>
          </Level.Item>
        </Level.Left>
        <Level.Right>
          <Level.Item>
            <Tag color="primary" isRounded>
              +{delta.toFixed(1)} pts
            </Tag>
          </Level.Item>
        </Level.Right>
      </Level>

      {showBlurb && (
        <Span textSize="7" textColor="grey" display="block" mb="3">
          {benchmark.blurb}
        </Span>
      )}

      <Series
        label="Skynet Opus"
        value={benchmark.skynet}
        color="primary"
        emphasise
      />
      <Series label="Fable" value={benchmark.fable} />
    </Block>
  );
}

function Series({
  label,
  value,
  color,
  emphasise = false,
}: {
  label: string;
  value: number;
  color?: 'primary';
  emphasise?: boolean;
}) {
  return (
    <Columns isMobile isVCentered isGapless mb="1">
      <Column sizeMobile={4} sizeTablet={3} sizeDesktop={2}>
        <Span
          textSize="7"
          textColor={emphasise ? 'primary' : 'grey'}
          textWeight={emphasise ? 'semibold' : 'normal'}
        >
          {label}
        </Span>
      </Column>
      <Column px="3">
        <Progress
          value={value}
          max={100}
          color={color}
          size="small"
          mb="0"
          aria-label={`${label}: ${value.toFixed(2)} percent`}
        >
          {value.toFixed(2)}%
        </Progress>
      </Column>
      <Column isNarrow textAlign="right">
        <Span
          textSize="7"
          textWeight={emphasise ? 'bold' : 'normal'}
          textColor={emphasise ? undefined : 'grey'}
        >
          {value.toFixed(2)}%
        </Span>
      </Column>
    </Columns>
  );
}
