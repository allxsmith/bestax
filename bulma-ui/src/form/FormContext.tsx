import { createContext, useContext } from 'react';

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
