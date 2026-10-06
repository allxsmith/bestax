import React, { createContext, useContext } from 'react';
import { warnOnce } from '../helpers/devWarnings';

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

interface OwnFieldOptions {
  /** `useInsideField()` as the wrapper read it. */
  insideField: boolean;
  /** `useInsideControl()` as the wrapper read it. */
  insideControl: boolean;
  /** The convenience `label` prop as passed by the caller. */
  label: React.ReactNode;
  /** The convenience `message` prop as passed by the caller. */
  message: React.ReactNode;
}

/**
 * Whether a convenience form wrapper renders a `Field` of its own (#905).
 * Never inside an outer `Field`. Inside a `Control` with no `Field` around
 * it, a `Field` of its own would put a `.field` inside the `.control`, where
 * Bulma's control styles break (its icon rules are sibling selectors on the
 * input), so it renders one only to hold a `label` or `message` and warns in
 * development that the fix is a `Field` around that `Control`. A `label` or
 * `message` counts when it is truthy, the same test that decides whether
 * `Field` renders the label and the wrapper renders the message.
 * Internal; not part of the public API.
 */
export const rendersOwnField = (
  component: string,
  { insideField, insideControl, label, message }: OwnFieldOptions
): boolean => {
  if (insideField) return false;
  if (!insideControl) return true;
  const held = [label && 'label', message && 'message'].filter(
    (name): name is string => Boolean(name)
  );
  if (held.length === 0) return false;
  warnOnce(
    `${component}:Field-in-bare-Control:${held.join('+')}`,
    `[bestax-bulma] <${component} ${held.join(' ')}> inside a <Control> ` +
      `with no <Field> around it renders its own <Field> to hold the ` +
      `${held.join(' and ')}, which puts a .field inside the .control, a ` +
      `nesting Bulma's styles are not written for. Wrap the <Control> in a ` +
      `<Field> instead` +
      (label ? `, and give the label to that <Field>.` : '.')
  );
  return true;
};

const FieldLabelIdContext = createContext<string | undefined>(undefined);

/**
 * The id a labeled Field wants its single composed control to adopt (#495).
 * `undefined` outside a Field, in unlabeled/grouped/addons Fields, or when the
 * user took over the association with an explicit `labelProps.htmlFor`.
 * Consumed only by the single-control bases (InputBase, SelectBase,
 * TextAreaBase). Internal; not part of the public API.
 */
export const useFieldLabelId = () => useContext(FieldLabelIdContext);

/** Provider for the Field label-target id — used internally by Field. */
export const FieldLabelIdProvider = FieldLabelIdContext.Provider;

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
