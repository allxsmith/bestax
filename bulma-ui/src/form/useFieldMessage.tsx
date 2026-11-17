import React, { createContext, useContext, useId } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import type { FormFieldProps } from './fieldProps';

/**
 * A space-separated id list of the ids given, leaving out the empty ones, or
 * undefined when none is left, for `aria-describedby`. Internal.
 */
export const joinIds = (
  ...ids: Array<string | undefined>
): string | undefined => ids.filter(Boolean).join(' ') || undefined;

/**
 * A form wrapper's `message`, as the `help` paragraph it renders and the
 * `aria-describedby` that ties it to the control (#1963), so a screen reader
 * reads the help or error text when the control takes focus. The paragraph
 * gets an id only when there is a message, and `describedBy` lists any ids
 * the caller passed first, then the message's, as Fieldset's does. Put
 * `describedBy` on the element the label names, after any props spread.
 * Internal; not part of the public API.
 */
export function useFieldMessage(
  message: React.ReactNode,
  messageColor: FormFieldProps['messageColor'],
  callerDescribedBy?: string
): {
  messageEl: React.ReactElement | null;
  /** The message's id, or undefined when there's no message. */
  messageId: string | undefined;
  describedBy: string | undefined;
} {
  const id = `${useId()}-message`;
  const messageId = message ? id : undefined;
  const helpClass = usePrefixedClassNames('help', {
    [`is-${messageColor}`]: !!messageColor,
  });
  const messageEl = message ? (
    <p id={id} className={helpClass}>
      {message}
    </p>
  ) : null;
  const describedBy = joinIds(callerDescribedBy, messageId);
  return { messageEl, messageId, describedBy };
}

/** The caller's attributes that report the control's state, not the wrapper's. */
export interface ControlStateProps {
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-errormessage'?: React.AriaAttributes['aria-errormessage'];
}

/**
 * Splits a wrapper's caller attributes into the ones that report the
 * control's state, `aria-invalid` and `aria-errormessage`, and the rest. A
 * wrapper that puts the rest on an element around its control puts these on
 * the control the label names, after any props spread, where a screen reader
 * reads them as it reads the message (#2002). Only the ones given are in
 * `control`, so it never sets one to undefined. Internal.
 */
export function splitControlState<P extends ControlStateProps>(
  props: P
): { control: ControlStateProps; rest: Omit<P, keyof ControlStateProps> } {
  const {
    'aria-invalid': invalid,
    'aria-errormessage': errorMessage,
    ...rest
  } = props;
  const control: ControlStateProps = {};
  if (invalid !== undefined) control['aria-invalid'] = invalid;
  if (errorMessage !== undefined) control['aria-errormessage'] = errorMessage;
  return { control, rest };
}

const FieldMessageIdContext = createContext<string | undefined>(undefined);

/**
 * Hands a picker base the id of its wrapper's message. A picker base puts
 * the caller's other attributes on its container rather than its input, so
 * the wrapper can't reach the input through props. Internal.
 */
export const FieldMessageIdProvider = FieldMessageIdContext.Provider;

/**
 * The id of the message of the picker wrapper this base sits in, which its
 * input lists in `aria-describedby`, or undefined. Internal.
 */
export const useFieldMessageId = () => useContext(FieldMessageIdContext);
