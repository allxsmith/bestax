import React, { createContext, useContext } from 'react';
import { warnOnce } from '../helpers/devWarnings';
import type { ControlBaseProps } from './Control';

const FieldContext = createContext(false);
const ControlContext = createContext(false);

/**
 * Hook to detect if the component is inside a Field wrapper.
 * Form components use this to skip rendering their own Field.
 */
export const useInsideField = () => useContext(FieldContext);

/**
 * Hook to detect if the component is inside a Control wrapper.
 * Form components use this to skip rendering their own Control.
 */
export const useInsideControl = () => useContext(ControlContext);

/** Provider for Field context — used internally by Field component. */
export const FieldProvider = FieldContext.Provider;

/** Provider for Control context — used internally by Control component. */
export const ControlProvider = ControlContext.Provider;

/** The wrapper props that change what its own `Field` renders. */
interface FieldShapingProps {
  /** Rendered as the `Field`'s label. */
  label?: React.ReactNode;
  /** Rendered as help text after the widget. */
  message?: React.ReactNode;
  /** Lays the `Field` out horizontally. */
  horizontal?: boolean;
  /** Set on the `Field` as its class. */
  fieldClassName?: string;
}

interface OwnFieldOptions extends FieldShapingProps {
  /** `useInsideField()` as the wrapper read it. */
  insideField: boolean;
  /** `useInsideControl()` as the wrapper read it. */
  insideControl: boolean;
}

// Each Field-shaping prop, with what takes its place on a `Field` the caller
// wraps around the `Control`. `message` needs nothing there, because the
// wrapper still renders it inside `Field > Control`. The other Field-level
// props (`labelSize`, `labelProps`, `messageColor`) change nothing unless a
// `label` or `message` renders, so on their own they keep no `Field`.
// `bare-control.test.tsx` holds this list to what each wrapper hands its
// `Field` and to which props change its markup, so a new Field-level prop
// fails there until it is sorted into one group or the other.
const FIELD_SHAPING: ReadonlyArray<
  [keyof FieldShapingProps, string | undefined]
> = [
  ['label', 'label'],
  ['message', undefined],
  ['horizontal', 'horizontal'],
  ['fieldClassName', 'className (for fieldClassName)'],
];

/** `a`, `a and b`, `a, b and c`. */
const listOf = (items: string[]): string =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
    : items[0];

/**
 * Whether a convenience form wrapper renders a `Field` of its own (#905).
 * Never inside an outer `Field`. Inside a `Control` with no `Field` around
 * it, a `Field` of its own would put a `.field` inside the `.control`, where
 * Bulma's control styles break (its icon rules are sibling selectors on the
 * input). So it renders one there only when a prop that shapes the `Field`'s
 * markup is set (`label`, `message`, `horizontal`, `fieldClassName`), keeping
 * the markup it always had, and warns in development that the fix is a
 * `Field` around that `Control`. A prop counts when it is truthy, the same
 * test that decides whether it changes the `Field`'s output.
 * Internal; not part of the public API.
 */
export const rendersOwnField = (
  component: string,
  options: OwnFieldOptions
): boolean => {
  if (options.insideField) return false;
  if (!options.insideControl) return true;
  const held = FIELD_SHAPING.filter(([prop]) => options[prop]);
  if (held.length === 0) return false;
  const names = held.map(([prop]) => prop);
  const moved = held
    .map(([, onField]) => onField)
    .filter((onField): onField is string => onField !== undefined);
  warnOnce(
    `${component}:Field-in-bare-Control:${names.join('+')}`,
    `[bestax-bulma] <${component} ${names.join(' ')}> inside a <Control> ` +
      `with no <Field> around it renders its own <Field> for ` +
      `${names.length > 1 ? 'those props' : 'that prop'}, which puts a ` +
      `.field inside the .control, a nesting Bulma's styles are not ` +
      `written for. Wrap the <Control> in a <Field> instead` +
      (moved.length > 0 ? `, and set ${listOf(moved)} on that <Field>.` : '.')
  );
  return true;
};

/** The props a convenience form wrapper hands its own `Control`. Internal. */
export interface ControlLevelProps {
  /** Shows the `Control`'s loading spinner. */
  isLoading?: boolean;
  /** The `Control`'s left icon. */
  iconLeft?: ControlBaseProps['iconLeft'];
  /** Shortcut for the left icon's name. */
  iconLeftName?: string;
  /** Shortcut for the left icon's size. */
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  /** The `Control`'s right icon. */
  iconRight?: ControlBaseProps['iconRight'];
  /** Shortcut for the right icon's name. */
  iconRightName?: string;
  /** Shortcut for the right icon's size. */
  iconRightSize?: ControlBaseProps['iconRightSize'];
  /** Reserves the `Control`'s left icon space. */
  hasIconsLeft?: boolean;
  /** Reserves the `Control`'s right icon space. */
  hasIconsRight?: boolean;
  /** Expands the `Control`. */
  isExpanded?: boolean;
  /** Set on the `Control` as its `size`. */
  controlSize?: ControlBaseProps['size'];
  /** Set on the `Control` as its class. */
  controlClassName?: string;
}

interface OwnControlOptions extends ControlLevelProps {
  /** `useInsideControl()` as the wrapper read it. */
  insideControl: boolean;
  /** A picker's `inline`, which renders no `Control` inside one or out. */
  inline?: boolean;
  /**
   * The left glyph the wrapper's own `Control` shows when the caller sets no
   * `iconLeftName`; read only then. `bare-control.test.tsx` reads that glyph
   * from what each wrapper hands its own `Control`, so a wrapper that gains
   * one fails there until it passes it here.
   */
  defaultIconLeftName?: string;
}

// Each Control-level prop, with what takes its place on the `Control` the
// caller wrapped around the wrapper. `bare-control.test.tsx` holds this to
// what each wrapper hands its own `Control`, so a new Control-level prop
// fails there until it is added here and passed to `rendersOwnControl`.
const ON_CONTROL: Record<keyof ControlLevelProps, string> = {
  isLoading: 'isLoading',
  iconLeft: 'iconLeft',
  iconLeftName: 'iconLeftName',
  iconLeftSize: 'iconLeftSize',
  iconRight: 'iconRight',
  iconRightName: 'iconRightName',
  iconRightSize: 'iconRightSize',
  hasIconsLeft: 'hasIconsLeft',
  hasIconsRight: 'hasIconsRight',
  isExpanded: 'isExpanded',
  controlSize: 'size (for controlSize)',
  controlClassName: 'className (for controlClassName)',
};

/**
 * Whether a convenience form wrapper renders a `Control` of its own (#921):
 * only outside one. Inside a `Control` it renders none, so the props it
 * would have handed its own do nothing there, and it warns in development,
 * naming them and saying to set them on that `Control`. An `inline` picker
 * renders none in either place, so it drops them inside a `Control` or not,
 * and its warning says so without pointing at a `Control`. A wrapper passes
 * only the props it hands its own `Control`, as the caller gave them, so a
 * default the wrapper fills in itself never warns. A prop counts when it is
 * truthy, since a falsy one would change nothing on a `Control` either.
 * `iconLeftSize` and `hasIconsLeft` show nothing on a `Control` without a
 * glyph, so when they move and the caller chose no left icon, the advice
 * names the wrapper's default glyph too, and following it draws what the
 * wrapper's own `Control` did.
 * Internal; not part of the public API.
 */
export const rendersOwnControl = (
  component: string,
  options: OwnControlOptions
): boolean => {
  if (!options.inline && !options.insideControl) return true;
  const held = (
    Object.keys(ON_CONTROL) as Array<keyof ControlLevelProps>
  ).filter(prop => options[prop]);
  if (held.length === 0) return false;
  const names = held.join(' ');
  const doNothing = held.length > 1 ? 'those props do' : 'that prop does';
  let message: string;
  if (options.inline) {
    message =
      `[bestax-bulma] <${component} inline ${names}> renders no <Control> ` +
      `in inline mode, inside a <Control> or not, so ${doNothing} ` +
      `nothing. Leave ${held.length > 1 ? 'them' : 'it'} out of an ` +
      `inline picker.`;
  } else {
    const toSet = held.map(prop => ON_CONTROL[prop]);
    const needsGlyph =
      (options.iconLeftSize || options.hasIconsLeft) &&
      !options.iconLeft &&
      options.iconLeftName === undefined &&
      options.defaultIconLeftName;
    if (needsGlyph) {
      toSet.push(
        `iconLeftName="${options.defaultIconLeftName}" (its default icon)`
      );
    }
    message =
      `[bestax-bulma] <${component} ${names}> inside a <Control> renders ` +
      `no <Control> of its own, so ${doNothing} nothing there. Set ` +
      `${listOf(toSet)} on that <Control> instead.`;
  }
  // Keyed by the message itself: the props named do not settle the advice
  // (an empty `iconLeftName` and an unset one name the same props), so two
  // calls that would advise differently must not share a key.
  warnOnce(message, message);
  return false;
};

const FieldLabelIdContext = createContext<string | undefined>(undefined);

/**
 * The id a labeled Field wants its single composed control to adopt (#495).
 * `undefined` outside a Field, in unlabeled/grouped/addons Fields, or when the
 * user took over the association with an explicit `labelProps.htmlFor`.
 * Consumed by the single-control bases (InputBase, SelectBase, TextAreaBase,
 * and the date and time picker bases unless inline, #968) and, through
 * `useAutoLabelId`, by the convenience inputs that render an input of their
 * own (#939). Internal; not part of the public API.
 */
export const useFieldLabelId = () => useContext(FieldLabelIdContext);

/** Provider for the Field label-target id — used internally by Field. */
export const FieldLabelIdProvider = FieldLabelIdContext.Provider;

const FieldLabelElementIdContext = createContext<string | undefined>(undefined);

/**
 * The id of a labeled Field's own `<label>`, for a group control (Radios,
 * Checkboxes, Rate, DateRangeInput) to point `aria-labelledby` at, since a group cannot take
 * the label's `htmlFor` (#939), and for a range Slider's thumbs, which each
 * need the label in a name of their own (#981). Set under the same conditions
 * as {@link useFieldLabelId}. Consumed through `useAutoLabelledBy` and
 * `useAutoLabelId`.
 * Internal; not part of the public API.
 */
export const useFieldLabelElementId = () =>
  useContext(FieldLabelElementIdContext);

/** Provider for the Field label's own id, used internally by Field. */
export const FieldLabelElementIdProvider = FieldLabelElementIdContext.Provider;

const FieldLabelForContext = createContext<string | undefined>(undefined);

/**
 * What the nearest labeled Field's `<label>` points `htmlFor` at: the id it
 * generated, or the caller's own `labelProps.htmlFor`. An unlabeled Field
 * passes it through, so a control in the inner Field of a horizontal layout
 * can tell the outer label names it. Only ever compared with a control's own
 * id, never adopted, so it hands out no id. Internal; not part of the public
 * API.
 */
export const useFieldLabelFor = () => useContext(FieldLabelForContext);

/** Provider for the Field label's `htmlFor` target, used internally by Field. */
export const FieldLabelForProvider = FieldLabelForContext.Provider;

/**
 * Shape of the Radios group context. The group provides:
 * - `name`: shared form field name (Stage 1)
 * - `value`: currently-selected radio value (Stage 2 — group-managed selection)
 * - `onChange`: dispatched by child Radios when clicked (Stage 2)
 *
 * Group sets `value`/`onChange` only when actively managing selection
 * (i.e., the user passed `value`, `defaultValue`, or `onChange` to `<Radios>`).
 * When only `name` is provided, the group is in "name-only" mode and child
 * Radios manage their own checked state independently.
 */
export interface RadiosGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Shape of the Checkboxes group context. Like Radios but with array semantics
 * for multi-select.
 */
export interface CheckboxesGroupContextValue {
  name?: string;
  value?: string[];
  onChange?: (values: string[]) => void;
}

const RadiosContext = createContext<RadiosGroupContextValue | undefined>(
  undefined
);
const CheckboxesContext = createContext<
  CheckboxesGroupContextValue | undefined
>(undefined);

/**
 * Hook to read the full surrounding `<Radios>` group context (name + selection).
 * Returns `undefined` when not inside a `<Radios>` group.
 */
export const useRadiosGroup = () => useContext(RadiosContext);

/**
 * Hook to read the full surrounding `<Checkboxes>` group context.
 * Returns `undefined` when not inside a `<Checkboxes>` group.
 */
export const useCheckboxesGroup = () => useContext(CheckboxesContext);

/**
 * Hook to read just the shared `name` from a surrounding `<Radios>` group.
 * Child `<Radio>` components fall back to this when no local `name` prop is set.
 * Returns `undefined` outside of a `<Radios>` group.
 */
export const useRadiosName = () => useRadiosGroup()?.name;

/**
 * Hook to read just the shared `name` from a surrounding `<Checkboxes>` group.
 * Returns `undefined` outside of a `<Checkboxes>` group.
 */
export const useCheckboxesName = () => useCheckboxesGroup()?.name;

/** Provider for the Radios group context — used internally by Radios. */
export const RadiosProvider = RadiosContext.Provider;

/** Provider for the Checkboxes group context — used internally by Checkboxes. */
export const CheckboxesProvider = CheckboxesContext.Provider;

// --- Backward-compat aliases (Stage 1 names) -----------------------------
// Internal callers may still import these. Both still work because they refer
// to the same providers/hooks under the new shape.

/** @deprecated Use `RadiosProvider` (provides {name, value, onChange}). */
export const RadiosNameProvider = RadiosProvider;

/** @deprecated Use `CheckboxesProvider` (provides {name, value, onChange}). */
export const CheckboxesNameProvider = CheckboxesProvider;
