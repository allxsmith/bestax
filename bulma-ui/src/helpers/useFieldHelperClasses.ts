import { classNames } from './classNames';
import { useBulmaClasses, BulmaClassesProps } from './useBulmaClasses';

/**
 * Splits the helper props of a field drawn by an `.input` inside a wrapper
 * of the component's own, such as a picker's container, into the classes
 * each element needs.
 *
 * Bulma's `.input` sets its own background, font weight, alignment, case
 * and family, so the background and text helpers style nothing in the field
 * from the wrapper. They come back apart from the rest, for the component to
 * put on the field and its inputs. The text helpers can stay on the wrapper
 * as well, where something inside it, such as a popover, takes them.
 *
 * @function useFieldHelperClasses
 * @param props - The component's remaining props, helper props among them.
 * @returns `backgroundClasses` and `textClasses` from the background and
 * text helpers, `otherClasses` from the rest, `bulmaHelperClasses` from all
 * of them, for an element that takes them all, and `rest`, the props that
 * aren't helper props.
 */
export const useFieldHelperClasses = <T extends object>(
  props: BulmaClassesProps & T
): {
  bulmaHelperClasses: string;
  backgroundClasses: string;
  textClasses: string;
  otherClasses: string;
  rest: Omit<T, keyof BulmaClassesProps>;
} => {
  const {
    backgroundColor,
    backgroundColorShade,
    textSize,
    textAlign,
    textTransform,
    textWeight,
    fontFamily,
    textSizeMobile,
    textSizeTablet,
    textSizeDesktop,
    textSizeWidescreen,
    textSizeFullhd,
    textAlignMobile,
    textAlignTablet,
    textAlignDesktop,
    textAlignWidescreen,
    textAlignFullhd,
    ...others
  } = props;
  const { bulmaHelperClasses: backgroundClasses } = useBulmaClasses({
    backgroundColor,
    backgroundColorShade,
  });
  // `viewport` suffixes the text classes and the display classes alike, so
  // both take it.
  const { bulmaHelperClasses: textClasses } = useBulmaClasses({
    textSize,
    textAlign,
    textTransform,
    textWeight,
    fontFamily,
    textSizeMobile,
    textSizeTablet,
    textSizeDesktop,
    textSizeWidescreen,
    textSizeFullhd,
    textAlignMobile,
    textAlignTablet,
    textAlignDesktop,
    textAlignWidescreen,
    textAlignFullhd,
    viewport: props.viewport,
  });
  const { bulmaHelperClasses: otherClasses, rest } = useBulmaClasses(others);
  return {
    bulmaHelperClasses: classNames(
      otherClasses,
      textClasses,
      backgroundClasses
    ),
    backgroundClasses,
    textClasses,
    otherClasses,
    rest: rest as Omit<T, keyof BulmaClassesProps>,
  };
};
