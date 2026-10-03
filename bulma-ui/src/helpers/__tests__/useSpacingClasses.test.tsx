import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useSpacingClasses, BulmaSpacingProps } from '../useSpacingClasses';
import { ConfigProvider } from '../Config';
import { validGaps, type BulmaGapStep } from '../bulmaClassHelpers';

type TupleStep = (typeof validGaps)[number];
type StringStep = Extract<BulmaGapStep, string>;
type NumberStepAsString = `${Extract<BulmaGapStep, number>}`;

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('useSpacingClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseSpacingClasses = (
    props: BulmaSpacingProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useSpacingClasses(props), { wrapper }).result
      .current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseSpacingClasses({})).toBe('');
  });

  it('applies a single margin class', () => {
    expect(renderUseSpacingClasses({ m: '2' })).toBe('m-2');
  });

  it('applies combined margins and paddings in declaration order', () => {
    expect(
      renderUseSpacingClasses({
        m: '1',
        mt: '2',
        mr: '3',
        mb: '4',
        ml: '5',
        mx: '6',
        my: '0',
        p: '1',
        pt: '2',
        pr: '3',
        pb: '4',
        pl: '5',
        px: '6',
        py: 'auto',
      })
    ).toBe(
      'm-1 mt-2 mr-3 mb-4 ml-5 mx-6 my-0 p-1 pt-2 pr-3 pb-4 pl-5 px-6 py-auto'
    );
  });

  it('ignores invalid spacing values', () => {
    expect(renderUseSpacingClasses({ m: '7' as any, p: 'big' as any })).toBe(
      ''
    );
  });

  it('applies class prefix to spacing classes', () => {
    expect(renderUseSpacingClasses({ m: '2', px: '4' }, 'bulma-')).toBe(
      'bulma-m-2 bulma-px-4'
    );
  });

  // Bulma's gap helpers, half steps included. Every step renders on all three
  // props, built from the tuple so a step the library adds is covered too.
  describe('gap', () => {
    // `BulmaGapStep` spells its steps out so the API docs can print it. The
    // assignments hold both of its halves to `validGaps` in both directions,
    // so a step added to one and not the other fails `typecheck:tests`.
    it('keeps BulmaGapStep and validGaps the same steps', () => {
      const stringsCoverTuple: readonly StringStep[] = [] as TupleStep[];
      const tupleCoversStrings: readonly TupleStep[] = [] as StringStep[];
      const numbersCoverTuple: readonly NumberStepAsString[] =
        [] as TupleStep[];
      const tupleCoversNumbers: readonly TupleStep[] =
        [] as NumberStepAsString[];
      expect([
        stringsCoverTuple,
        tupleCoversStrings,
        numbersCoverTuple,
        tupleCoversNumbers,
      ]).toEqual([[], [], [], []]);
      // Each step reads back as itself through a number, which is what lets
      // the hook take a step as a number and find its class.
      expect(validGaps.map(v => String(Number(v)))).toEqual([...validGaps]);
    });

    const rendering = validGaps.flatMap(v => [
      [`gap="${v}"`, { gap: v }, `is-gap-${v}`],
      [`columnGap="${v}"`, { columnGap: v }, `is-column-gap-${v}`],
      [`rowGap="${v}"`, { rowGap: v }, `is-row-gap-${v}`],
    ]) as [string, BulmaSpacingProps, string][];

    it.each(rendering)('%s renders %s', (_label, props, expected) => {
      expect(renderUseSpacingClasses(props)).toBe(expected);
    });

    // `Grid` took its gaps as numbers before they were shared, so every gap
    // prop takes the step as a number and renders the same class.
    it('takes a step as a number', () => {
      expect(
        renderUseSpacingClasses({ gap: 0, columnGap: 1.5, rowGap: 8 })
      ).toBe('is-gap-0 is-column-gap-1.5 is-row-gap-8');
    });

    it('ignores a value that is not a step', () => {
      expect(
        renderUseSpacingClasses({
          gap: '9' as never,
          columnGap: 0.25 as never,
          rowGap: '1rem' as never,
        })
      ).toBe('');
    });

    it('renders gapless as is-gapless', () => {
      expect(renderUseSpacingClasses({ gapless: true })).toBe('is-gapless');
      expect(renderUseSpacingClasses({ gapless: false })).toBe('');
    });

    // Both set the `gap` shorthand at one class of specificity, so rendering
    // both would leave the stylesheet's rule order to choose.
    it('lets a valid gap win over gapless', () => {
      expect(renderUseSpacingClasses({ gapless: true, gap: '3' })).toBe(
        'is-gap-3'
      );
      expect(renderUseSpacingClasses({ gapless: true, gap: 0 })).toBe(
        'is-gap-0'
      );
    });

    it('keeps gapless when gap is not a step', () => {
      expect(
        renderUseSpacingClasses({ gapless: true, gap: 'wide' as never })
      ).toBe('is-gapless');
    });

    // Bulma declares the axis classes after the shorthands, so each wins its
    // own axis; the hook only has to render them side by side.
    it('renders the axis props beside gap and gapless', () => {
      expect(
        renderUseSpacingClasses({ gap: '4', columnGap: '1', rowGap: '0.5' })
      ).toBe('is-gap-4 is-column-gap-1 is-row-gap-0.5');
      expect(renderUseSpacingClasses({ gapless: true, rowGap: '2' })).toBe(
        'is-gapless is-row-gap-2'
      );
    });

    it('renders after margin and padding', () => {
      expect(renderUseSpacingClasses({ gap: '2', p: '3', m: '1' })).toBe(
        'm-1 p-3 is-gap-2'
      );
    });

    it('prefixes the gap classes', () => {
      expect(
        renderUseSpacingClasses(
          { gap: '2.5', columnGap: 3, rowGap: '7.5', gapless: true },
          'bestax-'
        )
      ).toBe('bestax-is-gap-2.5 bestax-is-column-gap-3 bestax-is-row-gap-7.5');
      expect(renderUseSpacingClasses({ gapless: true }, 'bestax-')).toBe(
        'bestax-is-gapless'
      );
    });
  });
});
