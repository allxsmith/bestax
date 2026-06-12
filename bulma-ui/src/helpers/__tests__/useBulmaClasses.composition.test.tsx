import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useBulmaClasses, BulmaClassesProps } from '../useBulmaClasses';
import { useColorClasses } from '../useColorClasses';
import { useSpacingClasses } from '../useSpacingClasses';
import { useTypographyClasses } from '../useTypographyClasses';
import { useVisibilityClasses } from '../useVisibilityClasses';
import { useFlexboxClasses } from '../useFlexboxClasses';
import { useOtherClasses } from '../useOtherClasses';
import { classNames } from '../classNames';
import { ConfigProvider } from '../Config';

describe('useBulmaClasses composition', () => {
  // Harness hook that calls both the aggregate hook and the six mini hooks
  // with the corresponding prop slices.
  const useHarness = (props: BulmaClassesProps & Record<string, unknown>) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);

    const colorClasses = useColorClasses({
      color: props.color,
      colorShade: props.colorShade,
      backgroundColor: props.backgroundColor,
      backgroundColorShade: props.backgroundColorShade,
    });

    const spacingClasses = useSpacingClasses({
      m: props.m,
      mt: props.mt,
      mr: props.mr,
      mb: props.mb,
      ml: props.ml,
      mx: props.mx,
      my: props.my,
      p: props.p,
      pt: props.pt,
      pr: props.pr,
      pb: props.pb,
      pl: props.pl,
      px: props.px,
      py: props.py,
    });

    const typographyClasses = useTypographyClasses({
      textSize: props.textSize,
      textAlign: props.textAlign,
      textTransform: props.textTransform,
      textWeight: props.textWeight,
      fontFamily: props.fontFamily,
      viewport: props.viewport,
      textSizeMobile: props.textSizeMobile,
      textSizeTablet: props.textSizeTablet,
      textSizeDesktop: props.textSizeDesktop,
      textSizeWidescreen: props.textSizeWidescreen,
      textSizeFullhd: props.textSizeFullhd,
      textAlignMobile: props.textAlignMobile,
      textAlignTablet: props.textAlignTablet,
      textAlignDesktop: props.textAlignDesktop,
      textAlignWidescreen: props.textAlignWidescreen,
      textAlignFullhd: props.textAlignFullhd,
    });

    const visibilityClasses = useVisibilityClasses({
      visibility: props.visibility,
      visibilityMobile: props.visibilityMobile,
      visibilityTablet: props.visibilityTablet,
      visibilityDesktop: props.visibilityDesktop,
      visibilityWidescreen: props.visibilityWidescreen,
      visibilityFullhd: props.visibilityFullhd,
      display: props.display,
      displayMobile: props.displayMobile,
      displayTablet: props.displayTablet,
      displayDesktop: props.displayDesktop,
      displayWidescreen: props.displayWidescreen,
      displayFullhd: props.displayFullhd,
      viewport: props.viewport,
    });

    const flexboxClasses = useFlexboxClasses({
      flexDirection: props.flexDirection,
      flexWrap: props.flexWrap,
      justifyContent: props.justifyContent,
      alignContent: props.alignContent,
      alignItems: props.alignItems,
      alignSelf: props.alignSelf,
      flexGrow: props.flexGrow,
      flexShrink: props.flexShrink,
      display: props.display,
      displayMobile: props.displayMobile,
      displayTablet: props.displayTablet,
      displayDesktop: props.displayDesktop,
      displayWidescreen: props.displayWidescreen,
      displayFullhd: props.displayFullhd,
    });

    const otherClasses = useOtherClasses({
      float: props.float,
      overflow: props.overflow,
      overlay: props.overlay,
      interaction: props.interaction,
      cursor: props.cursor,
      radius: props.radius,
      shadow: props.shadow,
      responsive: props.responsive,
      skeleton: props.skeleton,
      clearfix: props.clearfix,
      relative: props.relative,
      fullHeight: props.fullHeight,
    });

    return {
      bulmaHelperClasses,
      rest,
      colorClasses,
      spacingClasses,
      typographyClasses,
      visibilityClasses,
      flexboxClasses,
      otherClasses,
    };
  };

  const renderHarness = (
    props: BulmaClassesProps & Record<string, unknown>,
    classPrefix?: string
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConfigProvider classPrefix={classPrefix}>{children}</ConfigProvider>
    );

    return renderHook(() => useHarness(props), { wrapper }).result.current;
  };

  // Representative prop set covering every helper group plus an extra prop.
  const allGroupProps: BulmaClassesProps & Record<string, unknown> = {
    color: 'primary',
    colorShade: '50',
    backgroundColor: 'info',
    m: '2',
    mt: '1',
    px: '4',
    textSize: '3',
    textAlign: 'centered',
    textWeight: 'bold',
    viewport: 'tablet',
    textSizeMobile: '5',
    displayMobile: 'flex',
    visibilityTablet: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    flexGrow: '1',
    float: 'left',
    cursor: 'pointer',
    skeleton: true,
    'data-x': 'y',
  };

  it('aggregate equals classNames of the six mini hook outputs', () => {
    const {
      bulmaHelperClasses,
      colorClasses,
      spacingClasses,
      typographyClasses,
      visibilityClasses,
      flexboxClasses,
      otherClasses,
    } = renderHarness(allGroupProps);

    expect(bulmaHelperClasses).toBe(
      classNames(
        colorClasses,
        spacingClasses,
        typographyClasses,
        visibilityClasses,
        flexboxClasses,
        otherClasses
      )
    );
    expect(bulmaHelperClasses).not.toBe('');
  });

  it('aggregate equals classNames of the mini hook outputs with a class prefix', () => {
    const {
      bulmaHelperClasses,
      colorClasses,
      spacingClasses,
      typographyClasses,
      visibilityClasses,
      flexboxClasses,
      otherClasses,
    } = renderHarness(allGroupProps, 'bulma-');

    expect(bulmaHelperClasses).toBe(
      classNames(
        colorClasses,
        spacingClasses,
        typographyClasses,
        visibilityClasses,
        flexboxClasses,
        otherClasses
      )
    );
    expect(bulmaHelperClasses).not.toBe('');
    expect(
      bulmaHelperClasses.split(' ').every(cls => cls.startsWith('bulma-'))
    ).toBe(true);
  });

  it('rest contains only non-helper props', () => {
    const { rest } = renderHarness(allGroupProps);
    expect(rest).toEqual({ 'data-x': 'y' });
  });

  it('dedupes cross-group classes (visibilityMobile hidden + displayMobile none)', () => {
    const { bulmaHelperClasses } = renderHarness({
      visibilityMobile: 'hidden',
      displayMobile: 'none',
    });

    const occurrences = bulmaHelperClasses
      .split(' ')
      .filter(cls => cls === 'is-hidden-mobile');
    expect(occurrences).toHaveLength(1);
    expect(bulmaHelperClasses).toBe('is-hidden-mobile');
  });
});
