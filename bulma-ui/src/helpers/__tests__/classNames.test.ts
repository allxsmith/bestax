import {
  classNames,
  createPrefixedClassNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../classNames';

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

describe('createPrefixedClassNames', () => {
  it('creates a function that prefixes all class names', () => {
    const prefixedFn = createPrefixedClassNames('bulma-');
    expect(prefixedFn('foo', 'bar')).toBe('bulma-foo bulma-bar');
  });

  it('handles object syntax with prefix', () => {
    const prefixedFn = createPrefixedClassNames('prefix-');
    expect(prefixedFn({ foo: true, bar: false, baz: 1 })).toBe(
      'prefix-foo prefix-baz'
    );
  });

  it('handles array syntax with prefix', () => {
    const prefixedFn = createPrefixedClassNames('test-');
    expect(prefixedFn(['foo', 'bar'], 'baz')).toBe(
      'test-foo test-bar test-baz'
    );
  });

  it('handles nested arrays with prefix', () => {
    const prefixedFn = createPrefixedClassNames('pre-');
    expect(prefixedFn(['foo', ['bar', ['baz']]])).toBe(
      'pre-foo pre-bar pre-baz'
    );
  });

  it('splits strings by whitespace and prefixes each', () => {
    const prefixedFn = createPrefixedClassNames('my-');
    expect(prefixedFn('foo bar', 'baz qux')).toBe(
      'my-foo my-bar my-baz my-qux'
    );
  });

  it('dedupes prefixed class names', () => {
    const prefixedFn = createPrefixedClassNames('app-');
    expect(prefixedFn('foo', 'foo', { foo: true })).toBe('app-foo');
  });

  it('handles numbers with prefix', () => {
    const prefixedFn = createPrefixedClassNames('num-');
    expect(prefixedFn(123, { 456: true })).toBe('num-123 num-456');
  });

  it('ignores falsy values', () => {
    const prefixedFn = createPrefixedClassNames('test-');
    expect(prefixedFn('foo', false, null, undefined, '', 0, 'bar')).toBe(
      'test-foo test-0 test-bar'
    );
  });
});

describe('prefixedClassNames', () => {
  it('applies prefix when provided', () => {
    expect(prefixedClassNames('bulma-', 'foo', 'bar')).toBe(
      'bulma-foo bulma-bar'
    );
  });

  it('behaves like classNames when prefix is undefined', () => {
    expect(prefixedClassNames(undefined, 'foo', 'bar')).toBe('foo bar');
  });

  it('behaves like classNames when prefix is empty string', () => {
    expect(prefixedClassNames('', 'foo', 'bar')).toBe('foo bar');
  });

  it('handles complex cases with prefix', () => {
    expect(
      prefixedClassNames('prefix-', 'foo', ['bar', { baz: true }], {
        qux: false,
        test: true,
      })
    ).toBe('prefix-foo prefix-bar prefix-baz prefix-test');
  });

  it('handles complex cases without prefix', () => {
    expect(
      prefixedClassNames(undefined, 'foo', ['bar', { baz: true }], {
        qux: false,
        test: true,
      })
    ).toBe('foo bar baz test');
  });
});

describe('usePrefixedClassNames', () => {
  // Since usePrefixedClassNames uses useConfig hook, we need to test it in the Config test file
  // This is a hook and needs to be tested with React testing utilities
  it('should be tested in Config.test.tsx with React hooks', () => {
    expect(typeof usePrefixedClassNames).toBe('function');
  });
});
