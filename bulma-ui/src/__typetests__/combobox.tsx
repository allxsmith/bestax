import type { ComboboxInputProps } from '../form/Combobox';
import type { FormFieldProps } from '../form/fieldProps';

/**
 * Combobox.Input takes no Field props: they go on the Combobox, which renders
 * the Field around the field and the list. Its props omit them by name,
 * because the API docs read only string keys out of an `Omit`, so a Field
 * prop added to `FormFieldProps` and `InputProps` would slip through. This
 * names any that do.
 */
type Kept = Extract<keyof ComboboxInputProps, keyof FormFieldProps>;
type None<T> = [T] extends [never] ? true : { KEPT: T };

export const comboboxInput: None<Kept> = true;
