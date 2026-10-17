import { Combobox, type ComboboxInputProps } from '../form/Combobox';
import type { FormFieldProps } from '../form/fieldProps';

/**
 * Combobox.Input takes no Field props: they go on the Combobox, which renders
 * the Field around the field and the list. Nor does it take what the Combobox
 * sets on the field itself, which would be overwritten. Its props omit them
 * by name, because the API docs read only string keys out of an `Omit`, so a
 * Field prop added to `FormFieldProps` and `InputProps` would slip through.
 * This names any that do.
 */
type Kept = Extract<
  keyof ComboboxInputProps,
  keyof FormFieldProps | 'size' | 'role' | 'autoComplete'
>;
type None<T> = [T] extends [never] ? true : { KEPT: T };

export const comboboxInput: None<Kept> = true;

/**
 * Given `data`, the Combobox renders its own parts, so it takes no children,
 * and built from parts it takes none of what `data` brings. `multiple` decides
 * the value's type: one value is a `string` or `null`, several an array.
 */
const countries = ['Canada', 'France'];
const one = (value: string | null) => value;
const several = (value: string[]) => value;

export const dataModes = (
  <>
    <Combobox data={countries} value="Canada" onChange={one} />
    <Combobox data={countries} value={null} defaultValue="France" />
    <Combobox data={countries} multiple value={['Canada']} onChange={several} />
    <Combobox
      data={[{ value: 'ca', label: 'Canada', group: 'Americas' }]}
      itemTemplate={item => item.label}
      empty="Nothing matches"
      name="country"
      placeholder="Pick one"
    />
    <Combobox onSelect={one} multiple>
      <Combobox.Input />
    </Combobox>
    {/* @ts-expect-error data and children don't go together */}
    <Combobox data={countries}>
      <Combobox.Input />
    </Combobox>
    {/* @ts-expect-error with multiple, the value is an array */}
    <Combobox data={countries} multiple value="Canada" />
    {/* @ts-expect-error with one value, it isn't */}
    <Combobox data={countries} value={['Canada']} />
    {/* @ts-expect-error with multiple, onChange takes an array */}
    <Combobox data={countries} multiple onChange={one} />
    {/* @ts-expect-error built from parts, the app keeps the value */}
    <Combobox value="Canada">
      <Combobox.Input />
    </Combobox>
    {/* @ts-expect-error built from parts, there's no empty prop */}
    <Combobox empty="Nothing" />
  </>
);
