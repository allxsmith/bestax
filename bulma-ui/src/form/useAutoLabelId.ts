import React, { useId } from 'react';
import type { FieldProps } from './Field';
import {
  useFieldLabelElementId,
  useFieldLabelFor,
  useFieldLabelId,
} from './FormContext';

interface UseAutoLabelIdOptions {
  /** The convenience `label` prop as passed by the caller. */
  label: React.ReactNode;
  /** User-supplied id for the control, if any. */
  id?: string;
  /** User-supplied labelProps, if any. */
  labelProps?: FieldProps['labelProps'];
  /**
   * True when this render actually outputs the label wired to a control —
   * false inside an outer Field (label is dropped), in variants that render
   * no Field, and in modes with no labellable control (e.g. inline pickers).
   */
  rendersLabel: boolean;
  /**
   * False when this render has no input to label at all (an inline picker),
   * so it takes no id from a surrounding Field either. Defaults to true.
   */
  hasInput?: boolean;
}

/**
 * Associates the convenience `label` prop with its control (#368): generates
 * an id for the control and returns labelProps carrying a matching `htmlFor`.
 * A user-supplied `id` is used as the target instead of the generated one, and
 * an explicit `htmlFor` key in labelProps — even set to `undefined` — disables
 * generation entirely: the user has taken over the association (#495 presence
 * semantics). When the control renders no label of its own, it adopts the id
 * a labeled Field around it offers, the way the bases do, so that Field's
 * label names it (#939); a user `id` still wins there.
 * Internal; not part of the public API.
 */
export function useAutoLabelId({
  label,
  id,
  labelProps,
  rendersLabel,
  hasInput = true,
}: UseAutoLabelIdOptions): {
  controlId: string | undefined;
  fieldLabelProps: FieldProps['labelProps'] | undefined;
  /** Whether a rendered label, its own or a surrounding Field's, points at `controlId`. */
  labelled: boolean;
} {
  // Called unconditionally per the rules of hooks; SSR-safe on React 18 and 19.
  const generatedId = useId();
  // Read outside the control's own Field, so it is set only when an outer
  // Field holds the control, which then renders no label of its own.
  const fieldLabelId = useFieldLabelId();
  // What an outer Field's label points at, even when wired by hand.
  const fieldLabelFor = useFieldLabelFor();
  // Truthiness mirrors Field's own `if (label)` render gate.
  const active = !!label && rendersLabel;
  // Presence, not truthiness: `htmlFor: undefined` is an explicit opt-out and
  // must not leave an orphan generated id on the control.
  const userWired = !!labelProps && 'htmlFor' in labelProps;
  const adopted = !active && hasInput ? fieldLabelId : undefined;
  const controlId = id ?? (active && !userWired ? generatedId : adopted);
  const ownLabelProps = { htmlFor: controlId, ...labelProps };
  // Inactive with a label still means an own Field may render it (pickers'
  // inline mode, Taginput at maxTags) — the explicit `htmlFor: undefined`
  // tells Field the association is owned here, so it must not generate one
  // that would dangle (#495 presence semantics).
  const fieldLabelProps = active
    ? ownLabelProps
    : label
      ? { htmlFor: undefined, ...labelProps }
      : labelProps;
  const labelTarget = active ? ownLabelProps.htmlFor : fieldLabelFor;
  return {
    controlId,
    fieldLabelProps,
    labelled: !!controlId && labelTarget === controlId,
  };
}

interface UseAutoLabelledByOptions {
  /** The convenience `label` prop as passed by the caller. */
  label: React.ReactNode;
  /** User-supplied labelProps, if any. */
  labelProps?: FieldProps['labelProps'];
  /** True when this render actually outputs the label naming the group. */
  rendersLabel: boolean;
  /**
   * The caller's remaining props. A non-empty `aria-label` or
   * `aria-labelledby` among them names the group, so a surrounding Field's
   * label then stays off it.
   */
  callerProps: object;
}

/**
 * Group-input counterpart of {@link useAutoLabelId} (#494): a group of
 * controls cannot take a single `htmlFor`, so instead the rendered `<label>`
 * gets a generated id and the group container points at it with
 * `aria-labelledby`. A user-supplied `labelProps.id` is used as the target
 * instead of generating one. Any caller `htmlFor` is stripped — a group label
 * names the group, never a single control — so the merged labelProps always
 * carry an explicit `htmlFor: undefined`. When the group renders no label of
 * its own, it points at the label of a labeled Field around it instead
 * (#939), unless the caller named it with `aria-label` or `aria-labelledby`.
 * Internal; not part of the public API.
 */
export function useAutoLabelledBy({
  label,
  labelProps,
  rendersLabel,
  callerProps,
}: UseAutoLabelledByOptions): {
  ariaLabelledBy: string | undefined;
  fieldLabelProps: FieldProps['labelProps'] | undefined;
} {
  // Called unconditionally per the rules of hooks; SSR-safe on React 18 and 19.
  const generatedId = useId();
  // Set only when an outer Field holds the group (see useAutoLabelId).
  const fieldLabelElementId = useFieldLabelElementId();
  const active = !!label && rendersLabel;
  const labelId = labelProps?.id ?? (active ? generatedId : undefined);
  const fieldLabelProps = active
    ? { ...labelProps, id: labelId, htmlFor: undefined }
    : labelProps;
  const aria = callerProps as React.AriaAttributes;
  const callerNamed = !!(aria['aria-label'] || aria['aria-labelledby']);
  const ariaLabelledBy = active
    ? labelId
    : callerNamed
      ? undefined
      : fieldLabelElementId;
  return { ariaLabelledBy, fieldLabelProps };
}
