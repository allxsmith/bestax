import { classNames } from '../classNames';

describe('classNames', () => {
  it('joins simple string classes', () => {
    expect(classNames('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(classNames('foo', false, null, undefined, '', 0, 'bar')).toBe(
      'foo 0 bar'
    );
  });

  it('handles array of classes', () => {
    expect(classNames(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles nested arrays', () => {
    expect(classNames(['foo', ['bar', ['baz']]])).toBe('foo bar baz');
  });

  it('handles object syntax', () => {
    expect(classNames({ foo: true, bar: false, baz: 1 })).toBe('foo baz');
  });

  it('splits each string by whitespace and dedupes', () => {
    expect(classNames('foo foo bar', 'bar baz')).toBe('foo bar baz');
  });

  it('splits object keys by whitespace and dedupes', () => {
    expect(classNames({ 'foo bar': true, 'bar baz': 1, qux: false })).toBe(
      'foo bar baz'
    );
  });

  it('handles combinations of all types', () => {
    expect(
      classNames(
        'foo',
        ['bar', { baz: true, qux: false }],
        { foo: true, test: true },
        null,
        undefined
      )
    ).toBe('foo bar baz test');
  });

  it('handles numbers as class names', () => {
    expect(classNames('foo', 123, { 456: true })).toBe('foo 123 456');
  });

  it('returns empty string when nothing is passed', () => {
    expect(classNames()).toBe('');
  });

  it('dedupes class names across all argument types', () => {
    expect(
      classNames('foo', ['foo', 'bar'], { bar: true, baz: true }, 'baz', [
        'foo',
        ['bar'],
      ])
    ).toBe('foo bar baz');
  });
});
