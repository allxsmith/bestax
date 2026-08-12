import { mergeBulmaStyles } from '../mergeBulmaStyles';

describe('mergeBulmaStyles', () => {
  it('returns undefined when neither input is provided', () => {
    expect(mergeBulmaStyles(undefined, undefined)).toBeUndefined();
    expect(mergeBulmaStyles()).toBeUndefined();
  });

  it('returns the helper styles when only helper styles are provided', () => {
    expect(
      mergeBulmaStyles({ backgroundColor: 'var(--bulma-scheme-main-bis)' })
    ).toEqual({ backgroundColor: 'var(--bulma-scheme-main-bis)' });
  });

  it('returns the user style when only the user style is provided', () => {
    expect(mergeBulmaStyles(undefined, { backgroundColor: 'red' })).toEqual({
      backgroundColor: 'red',
    });
  });

  it('merges both inputs with the user style winning on conflicts', () => {
    expect(
      mergeBulmaStyles(
        { backgroundColor: 'var(--bulma-scheme-main-bis)' },
        { backgroundColor: 'red', color: 'blue' }
      )
    ).toEqual({ backgroundColor: 'red', color: 'blue' });
  });
});
