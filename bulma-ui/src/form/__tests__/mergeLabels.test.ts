import {
  DEFAULT_PICKER_LABELS,
  mergeLabels,
  type PickerLabels,
} from '../_pickerInternals/pickerTypes';

const KEYS = Object.keys(DEFAULT_PICKER_LABELS) as Array<keyof PickerLabels>;

describe('mergeLabels', () => {
  it('returns the defaults when nothing is overridden', () => {
    expect(mergeLabels()).toEqual(DEFAULT_PICKER_LABELS);
    expect(mergeLabels({})).toEqual(DEFAULT_PICKER_LABELS);
  });

  it('takes a string override over its default', () => {
    const merged = mergeLabels({ ampm: 'Période', now: 'Maintenant' });
    expect(merged.ampm).toBe('Période');
    expect(merged.now).toBe('Maintenant');
    expect(merged.hours).toBe(DEFAULT_PICKER_LABELS.hours);
  });

  it.each(KEYS)('keeps the default %s when its override is undefined', key => {
    // A locale table missing a string spreads in as an undefined key, which
    // used to replace the default and leave the control with no name.
    expect(mergeLabels({ [key]: undefined })[key]).toBe(
      DEFAULT_PICKER_LABELS[key]
    );
  });

  it('keeps every default at once when every override is undefined', () => {
    const allUndefined = Object.fromEntries(
      KEYS.map(key => [key, undefined])
    ) as PickerLabels;
    expect(mergeLabels(allUndefined)).toEqual(DEFAULT_PICKER_LABELS);
  });

  it('takes an empty string, since that is a value', () => {
    expect(mergeLabels({ rangeSeparator: '' }).rangeSeparator).toBe('');
  });

  it('leaves the defaults object alone', () => {
    const before = { ...DEFAULT_PICKER_LABELS };
    mergeLabels({ ampm: 'Période' });
    expect(DEFAULT_PICKER_LABELS).toEqual(before);
  });
});
