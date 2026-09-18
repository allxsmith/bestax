import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useOtherClasses, BulmaOtherProps } from '../useOtherClasses';
import { ConfigProvider } from '../Config';
import {
  cursorClasses,
  validCursors,
  validFloats,
  validInteractions,
  validOverflows,
  validRadii,
  validResponsives,
  validShadows,
} from '../bulmaClassHelpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

  it('ignores invalid cursor and float values', () => {
    expect(
      renderUseOtherClasses({ cursor: 'grab' as any, float: 'up' as any })
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
          [`overflow="${v}"`, { overflow: v }, `is-${v}`] as [
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
          [`radius="${v}"`, { radius: v }, `is-${v}`] as [
            string,
            BulmaOtherProps,
            string,
          ]
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
    ];

    it.each(rendering)('%s renders %s', (_label, props, expected) => {
      expect(renderUseOtherClasses(props)).toBe(expected);
    });

    // The other direction: a value the tuple does not carry emits nothing,
    // which is the silence the lint rule exists to report. Each case asserts
    // its probe really is outside the tuple, so adding a value to one of them
    // cannot leave a case that passes for the wrong reason.
    const dropped: [string, readonly string[], string, BulmaOtherProps][] = [
      ['float', validFloats, 'center', { float: 'center' as any }],
      ['overflow', validOverflows, 'scroll', { overflow: 'scroll' as any }],
      [
        'interaction',
        validInteractions,
        'hover',
        { interaction: 'hover' as any },
      ],
      ['cursor', validCursors, 'grab', { cursor: 'grab' as any }],
      ['radius', validRadii, 'rounded', { radius: 'rounded' as any }],
      ['shadow', validShadows, 'none', { shadow: 'none' as any }],
      [
        'responsive',
        validResponsives,
        'tablet',
        { responsive: 'tablet' as any },
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
