// INTERNAL: deliberately not exported from src/index.ts. The parts a field
// holding values shows and posts them with, shared by Combobox and TreeSelect.

import { Delete } from '../../elements/Delete';
import { Tag } from '../../elements/Tag';
import { Tags } from '../../elements/Tags';

/** Props for the tags of a field holding several values. */
export interface ValueTagsProps {
  /** The values, in the order they show. */
  values: string[];
  /** The id of each tag's label, from `tagIds`, which the field's description lists. */
  ids: string[];
  /** What a value shows. */
  labelFor: (value: string) => string;
  /** The field can't be used, so the tags have no buttons. */
  disabled?: boolean;
  /**
   * Names each button in place of "Remove" and the value's label. The
   * button is then described by its tag's label, so it still says which.
   */
  ariaCloseLabel?: string;
  /** Called with a value when its tag's button is pressed. */
  onRemove: (value: string) => void;
  /** Whether a value's tag has a button. Every tag has one without it. */
  removable?: (value: string) => boolean;
}

const everyValue = () => true;

/**
 * The values of a field holding several, as Bulma tags under it, each with a
 * `Delete` that takes its value off. Nothing while there are none.
 */
export function ValueTags({
  values,
  ids,
  labelFor,
  disabled = false,
  ariaCloseLabel,
  onRemove,
  removable = everyValue,
}: ValueTagsProps) {
  if (values.length === 0) return null;
  return (
    <Tags mt="2">
      {values.map((value, index) => (
        <Tag key={value}>
          <span id={ids[index]}>{labelFor(value)}</span>
          {!disabled && removable(value) && (
            <Delete
              size="small"
              ariaLabel={ariaCloseLabel || `Remove ${labelFor(value)}`}
              aria-describedby={ariaCloseLabel ? ids[index] : undefined}
              onClick={() => onRemove(value)}
            />
          )}
        </Tag>
      ))}
    </Tags>
  );
}

/** The ids `ValueTags` gives its labels, built from one id of the field's. */
export const tagIds = (base: string, values: string[]): string[] =>
  values.map((_, index) => `${base}-${index}`);

/** Props for the hidden inputs that post a field's values. */
export interface HiddenValuesProps {
  /** The form field name. Nothing renders without one. */
  name?: string;
  /** One hidden input each. */
  values: string[];
  /** The id of the form they post with, for a field outside it. */
  form?: string;
  /** They don't post, as a disabled field's value doesn't. */
  disabled?: boolean;
}

/** A hidden input for each value, so a form posts them under `name`. */
export function HiddenValues({
  name,
  values,
  form,
  disabled,
}: HiddenValuesProps) {
  if (!name) return null;
  return (
    <>
      {values.map(value => (
        <input
          key={value}
          type="hidden"
          name={name}
          value={value}
          form={form}
          disabled={disabled}
        />
      ))}
    </>
  );
}
