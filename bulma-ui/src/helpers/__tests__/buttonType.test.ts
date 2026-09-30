import { buttonType } from '../buttonType';

describe('buttonType', () => {
  it.each(['button', 'submit', 'reset'])('keeps %s', type => {
    expect(buttonType(type)).toBe(type);
  });

  it('falls back to button when no type was given', () => {
    expect(buttonType(undefined)).toBe('button');
    expect(buttonType(null)).toBe('button');
  });

  it('falls back to button for a value HTML would read as submit', () => {
    // An invalid value is submit to HTML, the same as a missing one, so
    // forwarding it would undo the default.
    expect(buttonType('text/html')).toBe('button');
    expect(buttonType('')).toBe('button');
  });
});
