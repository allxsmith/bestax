import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useOtherClasses, BulmaOtherProps } from '../useOtherClasses';
import { ConfigProvider } from '../Config';
import {
  cursorClasses,
  validAspectRatios,
  validAxisOverflows,
  validCursors,
  validFloats,
  validInteractions,
  validOverflows,
  validPositions,
  validRadii,
  validResponsives,
  validShadows,
} from '../bulmaClassHelpers';

describe('useOtherClasses', () => {
  // Helper function to render the hook with props and optional config
  const renderUseOtherClasses = (
    props: BulmaOtherProps,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useOtherClasses(props), { wrapper }).result.current;
  };

  it('returns empty string for no props', () => {
    expect(renderUseOtherClasses({})).toBe('');
  });

  it('applies a multi-prop combo in declaration order', () => {
    expect(
      renderUseOtherClasses({
        float: 'left',
        overflow: 'clipped',
        overlay: true,
        interaction: 'unselectable',
        radius: 'radiusless',
        shadow: 'shadowless',
        responsive: 'mobile',
      })
    ).toBe(
      'is-pulled-left is-clipped is-overlay is-unselectable is-radiusless is-shadowless is-mobile'
    );
  });

  it('applies boolean helper classes when true', () => {
    expect(renderUseOtherClasses({ skeleton: true })).toBe('is-skeleton');
    expect(renderUseOtherClasses({ clearfix: true })).toBe('is-clearfix');
    expect(renderUseOtherClasses({ relative: true })).toBe('is-relative');
    expect(renderUseOtherClasses({ fullHeight: true })).toBe('is-full-height');
  });

  it('skips boolean helper classes when false or undefined', () => {
    expect(
      renderUseOtherClasses({
        skeleton: false,
        clearfix: false,
        relative: false,
        fullHeight: false,
      })
    ).toBe('');
    expect(renderUseOtherClasses({ skeleton: undefined })).toBe('');
  });

  it('maps cursor pointer to is-clickable', () => {
    expect(renderUseOtherClasses({ cursor: 'pointer' })).toBe('is-clickable');
  });

  it('maps cursor help to is-cursor-help', () => {
    expect(renderUseOtherClasses({ cursor: 'help' })).toBe('is-cursor-help');
  });

  // `pos` is the position helper and `relative` the older shortcut for one of
  // its values. Two position classes would leave the stylesheet's rule order
  // to decide which applies, so a valid `pos` settles it on its own.
  describe('pos and relative', () => {
    it('keeps relative rendering is-relative when pos is unset', () => {
      expect(renderUseOtherClasses({ relative: true })).toBe('is-relative');
    });

    it('lets pos decide when both are set', () => {
      expect(renderUseOtherClasses({ relative: true, pos: 'absolute' })).toBe(
        'is-position-absolute'
      );
      expect(renderUseOtherClasses({ relative: true, pos: 'relative' })).toBe(
        'is-position-relative'
      );
    });

    it('falls back to relative when pos is not a value it accepts', () => {
      expect(
        renderUseOtherClasses({ relative: true, pos: 'center' as never })
      ).toBe('is-relative');
    });
  });

  // Bulma's overflow helpers are all `!important` at one class of specificity
  // and ordered by value, not by axis, so `is-overflow-hidden` beside
  // `is-overflow-y-auto` rendered hidden on both axes: whichever value came
  // later in the stylesheet won. The hook now never emits a both-axes class
  // beside an axis class, so each axis has exactly one class and the order
  // cannot decide anything.
  describe('overflow beside overflowX and overflowY', () => {
    it('lets the axis prop win its axis and overflow fill in the other', () => {
      expect(
        renderUseOtherClasses({ overflow: 'hidden', overflowY: 'auto' })
      ).toBe('is-overflow-x-hidden is-overflow-y-auto');
      expect(
        renderUseOtherClasses({ overflow: 'scroll', overflowX: 'visible' })
      ).toBe('is-overflow-x-visible is-overflow-y-scroll');
    });

    it('fills in clipped as hidden, which is what is-clipped sets', () => {
      expect(
        renderUseOtherClasses({ overflow: 'clipped', overflowX: 'scroll' })
      ).toBe('is-overflow-x-scroll is-overflow-y-hidden');
    });

    it('leaves overflow nothing to set when both axis props are set', () => {
      expect(
        renderUseOtherClasses({
          overflow: 'hidden',
          overflowX: 'auto',
          overflowY: 'scroll',
        })
      ).toBe('is-overflow-x-auto is-overflow-y-scroll');
    });

    it('keeps overflow whole when the axis prop is not a value it takes', () => {
      expect(
        renderUseOtherClasses({
          overflow: 'hidden',
          overflowX: 'clipped' as never,
        })
      ).toBe('is-overflow-hidden');
      expect(
        renderUseOtherClasses({
          overflow: 'clipped',
          overflowY: 'sideways' as never,
        })
      ).toBe('is-clipped');
    });

    it('sets only the axis prop when overflow is not a value it takes', () => {
      expect(
        renderUseOtherClasses({
          overflow: 'overlay' as never,
          overflowY: 'auto',
        })
      ).toBe('is-overflow-y-auto');
    });

    // Every combination, so no pairing of values can reintroduce a second
    // class on one axis.
    const overflows = [undefined, ...validOverflows];
    const axes = [undefined, ...validAxisOverflows];
    const combos = overflows.flatMap(overflow =>
      axes.flatMap(overflowX =>
        axes
          .filter(overflowY => overflowX || overflowY)
          .map(overflowY => ({ overflow, overflowX, overflowY }))
      )
    );

    it.each(combos)(
      'writes one class per axis for %o',
      ({ overflow, overflowX, overflowY }) => {
        const classes = renderUseOtherClasses({
          overflow,
          overflowX,
          overflowY,
        }).split(' ');
        const rest = overflow === 'clipped' ? 'hidden' : overflow;
        const expected = [
          (overflowX ?? rest) && `is-overflow-x-${overflowX ?? rest}`,
          (overflowY ?? rest) && `is-overflow-y-${overflowY ?? rest}`,
        ].filter(Boolean);
        expect(classes).toEqual(expected);
      }
    );
  });

  it('prefixes the new helper families', () => {
    expect(
      renderUseOtherClasses(
        {
          overflow: 'auto',
          overflowY: 'hidden',
          radius: 'rounded',
          pos: 'sticky',
          aspectRatio: '16by9',
        },
        'bestax-'
      )
    ).toBe(
      'bestax-is-overflow-x-auto bestax-is-overflow-y-hidden bestax-has-radius-rounded bestax-is-position-sticky bestax-is-aspect-ratio-16by9'
    );
  });

  it('ignores invalid cursor and float values', () => {
    expect(
      renderUseOtherClasses({ cursor: 'grab' as never, float: 'up' as never })
    ).toBe('');
  });

  it('applies class prefix to other helper classes', () => {
    expect(
      renderUseOtherClasses(
        { float: 'right', cursor: 'pointer', skeleton: true },
        'bulma-'
      )
    ).toBe('bulma-is-pulled-right bulma-is-clickable bulma-is-skeleton');
  });

  // These accepted values used to be written twice: as an inline union on
  // BulmaOtherProps and as a literal array inside the hook, with nothing
  // holding the two together and nothing outside this module able to read
  // either. That is what left `@allxsmith/eslint-plugin-bestax` no tuple to
  // check `float="center"` against while every other helper family had one.
  // These cases drive the tuples themselves, so a value added to one without
  // teaching the hook to emit it fails here rather than shipping as a prop
  // that typechecks and renders nothing.
  describe('the exported tuples are what the hook emits from', () => {
    const rendering: [string, BulmaOtherProps, string][] = [
      ...validFloats.map(
        v =>
          [`float="${v}"`, { float: v }, `is-pulled-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validOverflows.map(
        v =>
          [
            `overflow="${v}"`,
            { overflow: v },
            v === 'clipped' ? 'is-clipped' : `is-overflow-${v}`,
          ] as [string, BulmaOtherProps, string]
      ),
      ...validAxisOverflows.map(
        v =>
          [`overflowX="${v}"`, { overflowX: v }, `is-overflow-x-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validAxisOverflows.map(
        v =>
          [`overflowY="${v}"`, { overflowY: v }, `is-overflow-y-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validInteractions.map(
        v =>
          [`interaction="${v}"`, { interaction: v }, `is-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validCursors.map(
        v =>
          [`cursor="${v}"`, { cursor: v }, cursorClasses[v]] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validRadii.map(
        v =>
          [
            `radius="${v}"`,
            { radius: v },
            v === 'radiusless' ? 'is-radiusless' : `has-radius-${v}`,
          ] as [string, BulmaOtherProps, string]
      ),
      ...validShadows.map(
        v =>
          [`shadow="${v}"`, { shadow: v }, `is-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validResponsives.map(
        v =>
          [`responsive="${v}"`, { responsive: v }, `is-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validPositions.map(
        v =>
          [`pos="${v}"`, { pos: v }, `is-position-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
      ),
      ...validAspectRatios.map(
        v =>
          [
            `aspectRatio="${v}"`,
            { aspectRatio: v },
            `is-aspect-ratio-${v}`,
          ] as [string, BulmaOtherProps, string]
      ),
    ];

    it.each(rendering)('%s renders %s', (_label, props, expected) => {
      expect(renderUseOtherClasses(props)).toBe(expected);
    });

    // `as never` rather than `as any`: these values are deliberately outside
    // the prop's union, and `never` is assignable to it, so the cast says
    // "known to be invalid" instead of switching the checker off.
    //
    // The other direction: a value the tuple does not carry emits nothing,
    // which is the silence the lint rule exists to report. Each case asserts
    // its probe really is outside the tuple, so adding a value to one of them
    // cannot leave a case that passes for the wrong reason.
    const dropped: [string, readonly string[], string, BulmaOtherProps][] = [
      ['float', validFloats, 'center', { float: 'center' as never }],
      ['overflow', validOverflows, 'overlay', { overflow: 'overlay' as never }],
      [
        'overflowX',
        validAxisOverflows,
        'clipped',
        { overflowX: 'clipped' as never },
      ],
      [
        'overflowY',
        validAxisOverflows,
        'clipped',
        { overflowY: 'clipped' as never },
      ],
      [
        'interaction',
        validInteractions,
        'hover',
        { interaction: 'hover' as never },
      ],
      ['cursor', validCursors, 'grab', { cursor: 'grab' as never }],
      ['radius', validRadii, 'medium', { radius: 'medium' as never }],
      ['shadow', validShadows, 'none', { shadow: 'none' as never }],
      [
        'responsive',
        validResponsives,
        'tablet',
        { responsive: 'tablet' as never },
      ],
      ['pos', validPositions, 'center', { pos: 'center' as never }],
      [
        'aspectRatio',
        validAspectRatios,
        '16:9',
        { aspectRatio: '16:9' as never },
      ],
    ];

    it.each(dropped)(
      '%s renders nothing for "%s", which its tuple does not carry',
      (_prop, values, probe, props) => {
        expect(values).not.toContain(probe);
        expect(renderUseOtherClasses(props)).toBe('');
      }
    );
  });
});
