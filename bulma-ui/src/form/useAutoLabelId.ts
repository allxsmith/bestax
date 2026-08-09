import React, { useId } from 'react';
import type { FieldProps } from './Field';

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
}

/**
 * Associates the convenience `label` prop with its control (#368): generates
 * an id for the control and returns labelProps carrying a matching `htmlFor`.
 * A user-supplied `id` is used as the target instead of the generated one, and
 * an explicit `htmlFor` key in labelProps — even set to `undefined` — disables
 * generation entirely: the user has taken over the association (#495 presence
 * semantics). Internal; not part of the public API.
 */
export function useAutoLabelId({
  label,
  id,
  labelProps,
  rendersLabel,
}: UseAutoLabelIdOptions): {
  controlId: string | undefined;
  fieldLabelProps: FieldProps['labelProps'] | undefined;
} {
  // Called unconditionally per the rules of hooks; SSR-safe on React 18 and 19.
  const generatedId = useId();
  // Truthiness mirrors Field's own `if (label)` render gate.
  const active = !!label && rendersLabel;
  // Presence, not truthiness: `htmlFor: undefined` is an explicit opt-out and
  // must not leave an orphan generated id on the control.
  const userWired = !!labelProps && 'htmlFor' in labelProps;
  const controlId = id ?? (active && !userWired ? generatedId : undefined);
  // Inactive with a label still means an own Field may render it (pickers'
  // inline mode, Taginput at maxTags) — the explicit `htmlFor: undefined`
  // tells Field the association is owned here, so it must not generate one
  // that would dangle (#495 presence semantics).
  const fieldLabelProps = active
    ? { htmlFor: controlId, ...labelProps }
    : label
      ? { htmlFor: undefined, ...labelProps }
      : labelProps;
  return { controlId, fieldLabelProps };
}

interface UseAutoLabelledByOptions {
  /** The convenience `label` prop as passed by the caller. */
  label: React.ReactNode;
  /** User-supplied labelProps, if any. */
  labelProps?: FieldProps['labelProps'];
  /** True when this render actually outputs the label naming the group. */
  rendersLabel: boolean;
}

/**
 * Group-input counterpart of {@link useAutoLabelId} (#494): a group of
 * controls cannot take a single `htmlFor`, so instead the rendered `<label>`
 * gets a generated id and the group container points at it with
 * `aria-labelledby`. A user-supplied `labelProps.id` is used as the target
 * instead of generating one. Any caller `htmlFor` is stripped — a group label
 * names the group, never a single control — so the merged labelProps always
 * carry an explicit `htmlFor: undefined`.
 * Internal; not part of the public API.
 */
export function useAutoLabelledBy({
  label,
  labelProps,
  rendersLabel,
}: UseAutoLabelledByOptions): {
  ariaLabelledBy: string | undefined;
  fieldLabelProps: FieldProps['labelProps'] | undefined;
} {
  // Called unconditionally per the rules of hooks; SSR-safe on React 18 and 19.
  const generatedId = useId();
  const active = !!label && rendersLabel;
  const labelId = labelProps?.id ?? (active ? generatedId : undefined);
  const fieldLabelProps = active
    ? { ...labelProps, id: labelId, htmlFor: undefined }
    : labelProps;
  return { ariaLabelledBy: active ? labelId : undefined, fieldLabelProps };
}
